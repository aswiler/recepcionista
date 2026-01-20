/**
 * WOW Voice Pipeline with Calendar Integration
 * 
 * Premium stack:
 * - Twilio (telephony)
 * - Deepgram Nova-2 (STT - streaming)
 * - GPT-4o / GPT-4o-mini (LLM - smartest + function calling)
 * - ElevenLabs (TTS - most natural voices)
 * 
 * Features:
 * - Calendar integration (check availability, book appointments)
 * - Sentence-by-sentence streaming for lowest latency
 * - Interruption handling
 * - Natural Spanish (Spain) voice
 */

import { WebSocket } from 'ws'
import { DeepgramSTT } from './stt'
import { OpenAILLM, streamWithSentenceDetection } from './llm-openai'
import { ElevenLabsTTS, VoiceId } from './tts-elevenlabs'
import { getBusinessContext } from './rag'
import { 
  parseTwilioMessage, 
  createMediaMessage, 
  createClearMessage,
  TwilioMediaMessage 
} from '../telephony/twilio'
import { calendarTools, executeCalendarTool } from '../tools/calendar-tools'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PipelineConfig {
  businessId: string
  businessName: string
  voiceId?: VoiceId
  usePremiumLLM?: boolean        // GPT-4o vs GPT-4o-mini
  calendarConnectionId?: string  // Nango connection ID for calendar
  calendarEnabled?: boolean      // Whether to enable calendar tools
}

export class WowVoicePipeline {
  private businessId: string
  private businessName: string
  private stt: DeepgramSTT
  private llm: OpenAILLM
  private tts: ElevenLabsTTS
  private ws: WebSocket | null = null
  private streamSid: string | null = null
  private conversationHistory: ConversationMessage[] = []
  private isProcessing = false
  private isSpeaking = false
  private calendarConnectionId?: string
  private calendarEnabled: boolean

  constructor(config: PipelineConfig) {
    this.businessId = config.businessId
    this.businessName = config.businessName
    this.calendarConnectionId = config.calendarConnectionId
    this.calendarEnabled = config.calendarEnabled ?? true
    
    // Initialize components
    this.stt = new DeepgramSTT()
    this.llm = new OpenAILLM(config.usePremiumLLM ? 'gpt-4o' : 'gpt-4o-mini')
    this.tts = new ElevenLabsTTS({ voiceId: config.voiceId || 'lucia-spain' })
  }

  async start(ws: WebSocket) {
    this.ws = ws
    
    // Handle incoming messages from Twilio
    ws.on('message', async (data: string) => {
      const message = parseTwilioMessage(data)
      await this.handleTwilioMessage(message)
    })
    
    // Start STT stream
    await this.stt.startStream(async (transcript, isFinal) => {
      if (!isFinal) return
      
      // Handle interruption - stop current speech
      if (this.isSpeaking && transcript.length > 3) {
        await this.handleInterruption()
      }
      
      if (!this.isProcessing) {
        await this.processUserInput(transcript)
      }
    })
  }

  private async handleTwilioMessage(message: TwilioMediaMessage) {
    switch (message.event) {
      case 'connected':
        console.log('🔌 Twilio stream connected')
        break
        
      case 'start':
        this.streamSid = message.start!.streamSid
        console.log(`📞 Call started: ${this.streamSid}`)
        // Send greeting
        await this.sendGreeting()
        break
        
      case 'media':
        if (message.media?.track === 'inbound') {
          // Customer audio - send to STT
          const audioBuffer = Buffer.from(message.media.payload, 'base64')
          this.stt.sendAudio(audioBuffer)
        }
        break
        
      case 'mark':
        // Audio finished playing
        if (message.mark?.name === 'speech_end') {
          this.isSpeaking = false
        }
        break
        
      case 'stop':
        console.log('📞 Call ended')
        this.stop()
        break
    }
  }

  private async handleInterruption() {
    console.log('🛑 Interruption detected - stopping speech')
    
    // Clear Twilio's audio queue
    if (this.ws && this.streamSid) {
      this.ws.send(createClearMessage(this.streamSid))
    }
    
    this.isSpeaking = false
    this.isProcessing = false
  }

  async stop() {
    this.stt.close()
    this.ws = null
    this.streamSid = null
  }

  private async sendGreeting() {
    const greeting = this.calendarEnabled
      ? `¡Hola! Gracias por llamar a ${this.businessName}. Puedo ayudarte con información, o si quieres, también puedo gestionar citas. ¿En qué te puedo ayudar?`
      : `¡Hola! Gracias por llamar a ${this.businessName}. ¿En qué puedo ayudarle hoy?`
    
    await this.speakResponse(greeting)
    
    this.conversationHistory.push({
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    })
  }

  private async processUserInput(transcript: string) {
    if (!transcript.trim() || this.isProcessing) return
    
    this.isProcessing = true
    console.log(`👤 Customer: ${transcript}`)
    
    try {
      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      })
      
      // Get business context from Pinecone
      const context = await getBusinessContext(this.businessId, transcript)
      
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context)
      
      // Generate response with potential tool calls
      const tools = this.calendarEnabled ? calendarTools : undefined
      
      const result = await this.llm.generateWithTools({
        systemPrompt,
        userMessage: transcript,
        history: this.conversationHistory.slice(-6).map(m => ({
          role: m.role,
          content: m.content,
        })),
        tools,
      })
      
      // Check if AI wants to use a tool
      if (result.toolCalls && result.toolCalls.length > 0) {
        await this.handleToolCalls(result.toolCalls, systemPrompt, transcript)
      } else {
        // Normal response - speak it
        const response = result.content
        console.log(`🤖 AI: ${response}`)
        
        this.conversationHistory.push({
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        })
        
        await this.speakResponse(response)
        
        // Check for transfer intent
        if (this.shouldTransfer(response)) {
          console.log('📞 Transfer requested')
        }
      }
      
    } catch (error) {
      console.error('Error processing input:', error)
      await this.speakResponse('Lo siento, ha habido un problema técnico. ¿Puede repetir su pregunta?')
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Handle AI tool calls (calendar operations)
   */
  private async handleToolCalls(
    toolCalls: any[],
    systemPrompt: string,
    originalUserMessage: string
  ) {
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments || '{}')
      
      console.log(`🔧 Tool call: ${functionName}`, functionArgs)
      
      // Let the user know we're checking
      if (functionName === 'check_availability') {
        await this.speakResponse('Un momento, déjame comprobar la disponibilidad...')
      } else if (functionName === 'book_appointment') {
        await this.speakResponse('Perfecto, voy a reservar la cita...')
      } else if (functionName === 'get_next_available') {
        await this.speakResponse('Déjame ver los próximos huecos disponibles...')
      }
      
      // Execute the tool
      const toolResult = await executeCalendarTool(
        functionName,
        functionArgs,
        this.businessId,
        this.calendarConnectionId
      )
      
      console.log(`📅 Tool result:`, toolResult)
      
      // Get AI to formulate response based on tool result
      const response = await this.llm.continueAfterToolCall({
        systemPrompt,
        history: this.conversationHistory.slice(-6).map(m => ({
          role: m.role,
          content: m.content,
        })),
        toolCallId: toolCall.id,
        toolName: functionName,
        toolResult,
      })
      
      console.log(`🤖 AI (after tool): ${response}`)
      
      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      })
      
      // Speak the response
      await this.speakResponse(response)
    }
  }

  private async speakResponse(text: string) {
    if (!this.ws || !this.streamSid || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    
    this.isSpeaking = true
    
    try {
      // Stream ElevenLabs audio to Twilio
      for await (const audioChunk of this.tts.synthesizeStream(text)) {
        if (this.ws.readyState !== WebSocket.OPEN || !this.isSpeaking) {
          break // Stop if interrupted
        }
        
        const base64Audio = audioChunk.toString('base64')
        this.ws.send(createMediaMessage(base64Audio, this.streamSid!))
      }
      
    } catch (error) {
      console.error('TTS error:', error)
    }
  }

  private buildSystemPrompt(context: string): string {
    const calendarInstructions = this.calendarEnabled
      ? `
CALENDARIO:
- Tienes acceso a las herramientas del calendario para comprobar disponibilidad y reservar citas
- Cuando el cliente pregunte por citas disponibles, usa 'check_availability' o 'get_next_available'
- Cuando el cliente confirme que quiere reservar, usa 'book_appointment'
- Siempre confirma los detalles antes de reservar: fecha, hora, nombre del cliente
- Si el cliente dice "mañana", "la semana que viene", etc., calcula la fecha correcta
`
      : ''

    return `Eres una recepcionista AI profesional y encantadora para ${this.businessName}.

${context ? `INFORMACIÓN DEL NEGOCIO:
${context}

` : ''}${calendarInstructions}
INSTRUCCIONES IMPORTANTES:
- Responde SIEMPRE en español de España (usa "vosotros" si es apropiado, términos españoles)
- Mantén las respuestas BREVES - máximo 2 oraciones para voz
- Sé cálida, profesional y servicial
- Si no tienes información, ofrece amablemente transferir a un humano
- NUNCA inventes información que no esté en el contexto
- Usa un tono natural y conversacional, como una persona real
- Muestra empatía cuando sea apropiado

EJEMPLOS DE BUEN TONO:
- "¡Por supuesto! Déjame ayudarte con eso..."
- "Entiendo perfectamente. Lo que puedo hacer es..."
- "¡Qué bien! Tenemos disponibilidad mañana a las..."
- "Perfecto, te reservo la cita para el martes a las 10, ¿vale?"

NUNCA digas cosas como:
- "Como modelo de lenguaje..."
- "No tengo la capacidad de..."
- Respuestas largas o técnicas`
  }

  private shouldTransfer(response: string): boolean {
    const transferPhrases = [
      'transferir',
      'paso con',
      'comunico con',
      'humano',
      'persona',
      'no puedo ayudar',
      'equipo',
    ]
    return transferPhrases.some(phrase => 
      response.toLowerCase().includes(phrase)
    )
  }
}
