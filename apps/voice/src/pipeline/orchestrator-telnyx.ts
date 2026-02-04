/**
 * Telnyx Voice Pipeline with Calendar Integration
 * 
 * Premium stack:
 * - Telnyx (telephony + streaming)
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
import { OpenAILLM } from './llm-openai'
import { ElevenLabsTTS, VoiceId } from './tts-elevenlabs'
import { getBusinessContext } from './rag'
import { 
  parseTelnyxMessage, 
  createTelnyxMediaMessage, 
  createTelnyxClearMessage,
  TelnyxStreamMessage 
} from '../telephony/telnyx'
import { calendarTools, executeCalendarTool } from '../tools/calendar-tools'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PipelineConfig {
  businessId: string
  businessName: string
  callControlId: string
  voiceId?: VoiceId
  usePremiumLLM?: boolean        // GPT-4o vs GPT-4o-mini
  calendarConnectionId?: string  // Nango connection ID for calendar
  calendarEnabled?: boolean      // Whether to enable calendar tools
}

export class TelnyxVoicePipeline {
  private businessId: string
  private businessName: string
  private callControlId: string
  private stt: DeepgramSTT
  private llm: OpenAILLM
  private tts: ElevenLabsTTS
  private ws: WebSocket | null = null
  private streamId: string | null = null
  private conversationHistory: ConversationMessage[] = []
  private isProcessing = false
  private isSpeaking = false
  private calendarConnectionId?: string
  private calendarEnabled: boolean

  constructor(config: PipelineConfig) {
    this.businessId = config.businessId
    this.businessName = config.businessName
    this.callControlId = config.callControlId
    this.calendarConnectionId = config.calendarConnectionId
    this.calendarEnabled = config.calendarEnabled ?? true
    
    // Initialize components
    this.stt = new DeepgramSTT()
    this.llm = new OpenAILLM(config.usePremiumLLM ? 'gpt-4o' : 'gpt-4o-mini')
    this.tts = new ElevenLabsTTS({ voiceId: config.voiceId || 'sara' })
  }

  async start(ws: WebSocket) {
    this.ws = ws
    
    // Handle incoming messages from Telnyx
    ws.on('message', async (data: Buffer | string) => {
      // Telnyx can send either JSON messages or raw binary audio
      const dataStr = typeof data === 'string' ? data : data.toString()
      
      try {
        const message = parseTelnyxMessage(dataStr)
        await this.handleTelnyxMessage(message)
      } catch (error) {
        // If parsing fails, it might be raw audio
        if (Buffer.isBuffer(data)) {
          this.stt.sendAudio(data)
        }
      }
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

  private async handleTelnyxMessage(message: TelnyxStreamMessage) {
    switch (message.event) {
      case 'connected':
        console.log('🔌 Telnyx stream connected')
        break
        
      case 'start':
        this.streamId = message.start?.stream_id || null
        console.log(`📞 Call stream started: ${this.streamId}`)
        console.log(`   Format: ${message.start?.media_format?.encoding} @ ${message.start?.media_format?.sample_rate}Hz`)
        
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
        
      case 'stop':
        console.log(`📞 Stream stopped: ${message.stop?.reason}`)
        this.stop()
        break
        
      case 'error':
        console.error(`❌ Stream error: ${message.error?.message} (${message.error?.code})`)
        break
    }
  }

  private async handleInterruption() {
    console.log('🛑 Interruption detected - stopping speech')
    
    // Clear Telnyx's audio queue
    if (this.ws && this.streamId && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(createTelnyxClearMessage(this.streamId))
    }
    
    this.isSpeaking = false
    this.isProcessing = false
  }

  async stop() {
    this.stt.close()
    this.ws = null
    this.streamId = null
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
          // TODO: Implement transfer via Telnyx API
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
    if (!this.ws || !this.streamId || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    
    this.isSpeaking = true
    
    try {
      // Stream ElevenLabs audio to Telnyx
      for await (const audioChunk of this.tts.synthesizeStream(text)) {
        if (this.ws.readyState !== WebSocket.OPEN || !this.isSpeaking) {
          break // Stop if interrupted
        }
        
        const base64Audio = audioChunk.toString('base64')
        this.ws.send(createTelnyxMediaMessage(base64Audio, this.streamId!))
      }
      
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      this.isSpeaking = false
    }
  }

  private buildSystemPrompt(context: string): string {
    const calendarInstructions = this.calendarEnabled
      ? `
CALENDAR (use when relevant):
- You have access to calendar tools to check availability and book appointments
- When the caller asks about available times, use 'check_availability' or 'get_next_available'
- When they confirm booking, use 'book_appointment'
- Always confirm details before booking: date, time, caller's name
- If they say "tomorrow", "next week", etc., calculate the correct date
`
      : ''

    return `You are a professional and charming AI receptionist for ${this.businessName}.

CRITICAL - AUTOMATIC LANGUAGE MATCHING:
- ALWAYS respond in the EXACT SAME LANGUAGE the caller uses
- If they speak Spanish → respond in Spanish (use Spain Spanish with "vosotros")
- If they speak English → respond in English
- If they speak French → respond in French
- If they speak Catalan → respond in Catalan
- Mirror their language perfectly, do NOT switch languages

${context ? `BUSINESS INFORMATION:
${context}

` : ''}${calendarInstructions}
VOICE INSTRUCTIONS:
- Keep responses BRIEF - maximum 2 sentences for voice
- Be warm, professional, and helpful
- If you don't have information, kindly offer to transfer to a human
- NEVER invent information not in the context
- Use a natural, conversational tone like a real person
- Show empathy when appropriate

GOOD TONE EXAMPLES (adapt to caller's language):
- "Of course! Let me help you with that..."
- "I understand. What I can do is..."
- "Great! We have availability tomorrow at..."
- "Perfect, I'll book that appointment for Tuesday at 10, okay?"

NEVER say things like:
- "As a language model..."
- "I don't have the capability to..."
- Long or technical responses`
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
