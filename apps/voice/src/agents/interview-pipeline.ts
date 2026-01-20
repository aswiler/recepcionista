/**
 * Interview Voice Pipeline
 * 
 * Handles the voice interview for onboarding.
 * Uses the same premium stack but with the Interview Agent.
 */

import { WebSocket } from 'ws'
import { DeepgramSTT } from '../pipeline/stt'
import { OpenAILLM } from '../pipeline/llm-openai'
import { ElevenLabsTTS } from '../pipeline/tts-elevenlabs'
import { InterviewAgent } from './interview-agent'
import {
  parseTwilioMessage,
  createMediaMessage,
  createClearMessage,
  TwilioMediaMessage,
} from '../telephony/twilio'

interface InterviewConfig {
  businessId: string
  scrapedData?: {
    businessName?: string
    services?: string[]
    hours?: string
    phone?: string
    description?: string
  }
  onProgress?: (info: Record<string, any>) => void
  onComplete?: (info: Record<string, any>) => void
}

export class InterviewVoicePipeline {
  private stt: DeepgramSTT
  private tts: ElevenLabsTTS
  private agent: InterviewAgent
  private ws: WebSocket | null = null
  private streamSid: string | null = null
  private isProcessing = false
  private isSpeaking = false
  private onComplete?: (info: Record<string, any>) => void

  constructor(config: InterviewConfig) {
    this.stt = new DeepgramSTT()
    this.tts = new ElevenLabsTTS({ voiceId: 'lucia-spain' })
    this.agent = new InterviewAgent(
      config.businessId,
      config.scrapedData || {},
      config.onProgress
    )
    this.onComplete = config.onComplete
  }

  async start(ws: WebSocket) {
    this.ws = ws

    // Handle Twilio messages
    ws.on('message', async (data: string) => {
      const message = parseTwilioMessage(data)
      await this.handleTwilioMessage(message)
    })

    // Start STT
    await this.stt.startStream(async (transcript, isFinal) => {
      if (!isFinal) return

      // Handle interruption
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
      case 'start':
        this.streamSid = message.start!.streamSid
        console.log('🎤 Interview call started')
        await this.sendGreeting()
        break

      case 'media':
        if (message.media?.track === 'inbound') {
          const audioBuffer = Buffer.from(message.media.payload, 'base64')
          this.stt.sendAudio(audioBuffer)
        }
        break

      case 'stop':
        console.log('📞 Interview call ended')
        this.stop()
        break
    }
  }

  private async handleInterruption() {
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
    const greeting = this.agent.getGreeting()
    console.log(`🤖 Greeting: ${greeting}`)
    await this.speak(greeting)
  }

  private async processUserInput(transcript: string) {
    if (!transcript.trim() || this.isProcessing) return

    this.isProcessing = true
    console.log(`👤 User: ${transcript}`)

    try {
      const result = await this.agent.processResponse(transcript)
      console.log(`🤖 AI: ${result.response}`)

      await this.speak(result.response)

      if (result.isComplete) {
        console.log('✅ Interview complete!')
        
        // Wait a moment, then send completion callback
        setTimeout(() => {
          if (this.onComplete && result.extractedInfo) {
            this.onComplete(result.extractedInfo)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error in interview:', error)
      await this.speak(
        'Perdona, he tenido un pequeño problema técnico. ¿Puedes repetir eso?'
      )
    } finally {
      this.isProcessing = false
    }
  }

  private async speak(text: string) {
    if (!this.ws || !this.streamSid || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.isSpeaking = true

    try {
      for await (const audioChunk of this.tts.synthesizeStream(text)) {
        if (this.ws.readyState !== WebSocket.OPEN || !this.isSpeaking) {
          break
        }

        const base64Audio = audioChunk.toString('base64')
        this.ws.send(createMediaMessage(base64Audio, this.streamSid!))
      }
    } catch (error) {
      console.error('TTS error:', error)
    }

    this.isSpeaking = false
  }
}
