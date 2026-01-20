/**
 * Voice Pipeline Orchestrator
 * 
 * Coordinates: Deepgram STT → Business Logic → Groq LLM → Cartesia TTS
 */

import { WebSocket } from 'ws'
import { DeepgramSTT } from './stt'
import { GroqLLM } from './llm'
import { CartesiaTTS } from './tts'
import { getBusinessContext } from './rag'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export class VoicePipeline {
  private businessId: string
  private businessName: string
  private stt: DeepgramSTT
  private llm: GroqLLM
  private tts: CartesiaTTS
  private ws: WebSocket | null = null
  private conversationHistory: ConversationMessage[] = []
  private isProcessing = false

  constructor(businessId: string, businessName: string) {
    this.businessId = businessId
    this.businessName = businessName
    this.stt = new DeepgramSTT()
    this.llm = new GroqLLM()
    this.tts = new CartesiaTTS()
  }

  async start(ws: WebSocket) {
    this.ws = ws
    
    // Start STT stream
    await this.stt.startStream(async (transcript, isFinal) => {
      if (!isFinal || this.isProcessing) return
      
      await this.processUserInput(transcript)
    })
    
    // Handle incoming audio
    ws.on('message', (data: Buffer) => {
      this.stt.sendAudio(data)
    })
    
    // Send greeting
    await this.sendGreeting()
  }

  async stop() {
    this.stt.close()
    this.ws = null
  }

  private async sendGreeting() {
    const greeting = `¡Hola! Gracias por llamar a ${this.businessName}. ¿En qué puedo ayudarle?`
    await this.speakResponse(greeting)
    
    this.conversationHistory.push({
      role: 'assistant',
      content: greeting,
    })
  }

  private async processUserInput(transcript: string) {
    if (!transcript.trim()) return
    
    this.isProcessing = true
    console.log(`👤 Customer: ${transcript}`)
    
    try {
      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: transcript,
      })
      
      // Get business context from Pinecone
      const context = await getBusinessContext(this.businessId, transcript)
      
      // Generate response with Groq (fast!)
      const systemPrompt = this.buildSystemPrompt(context)
      const response = await this.llm.generate({
        systemPrompt,
        userMessage: transcript,
        history: this.conversationHistory.slice(-6), // Last 3 exchanges
      })
      
      console.log(`🤖 AI: ${response}`)
      
      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      })
      
      // Speak the response
      await this.speakResponse(response)
      
      // Check for transfer intent
      if (this.shouldTransfer(response)) {
        // Handle transfer to human
        console.log('📞 Transfer requested')
      }
    } catch (error) {
      console.error('Error processing input:', error)
      await this.speakResponse('Lo siento, ha habido un problema. ¿Puede repetir?')
    } finally {
      this.isProcessing = false
    }
  }

  private async speakResponse(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    
    // Stream TTS audio
    for await (const audioChunk of this.tts.synthesizeStream(text)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(audioChunk)
      }
    }
  }

  private buildSystemPrompt(context: string): string {
    return `Eres una recepcionista AI profesional para ${this.businessName}.

${context ? `INFORMACIÓN DEL NEGOCIO:\n${context}\n` : ''}

INSTRUCCIONES PARA VOZ:
- Respuestas MUY breves (1-2 oraciones máximo)
- Habla de forma natural y conversacional
- Si no puedes ayudar, ofrece transferir a un humano
- Usa un tono cálido y profesional
- Nunca inventes información`
  }

  private shouldTransfer(response: string): boolean {
    const transferPhrases = ['transferir', 'humano', 'persona', 'no puedo ayudar']
    return transferPhrases.some(phrase => response.toLowerCase().includes(phrase))
  }
}
