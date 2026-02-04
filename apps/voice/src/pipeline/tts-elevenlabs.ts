/**
 * Text-to-Speech using ElevenLabs
 * 
 * THE WOW FACTOR - Best quality multilingual voices
 * 
 * These voices automatically adapt to ANY language:
 * - Sara (female) - Calm, peaceful
 * - Pablo (male) - Professional, clear
 * 
 * The caller speaks in any language → GPT responds in that language →
 * ElevenLabs speaks that language automatically!
 */

import { ElevenLabsClient } from 'elevenlabs'

// Multilingual voice IDs - these work with ANY supported language
export const VOICES = {
  'sara': 'BIvP0GN1cAtSRTxNHnWS',    // Female - Calm, peaceful (multilingual)
  'pablo': 'pb3lVZVjdFWbkhPKlelB',   // Male - Professional, clear (multilingual)
} as const

export type VoiceId = keyof typeof VOICES

interface TTSConfig {
  voiceId?: VoiceId
  stability?: number        // 0-1, lower = more expressive
  similarityBoost?: number  // 0-1, higher = more consistent
  style?: number           // 0-1, higher = more stylized
}

export class ElevenLabsTTS {
  private client: ElevenLabsClient
  private voiceId: string
  private stability: number
  private similarityBoost: number
  private style: number

  constructor(config: TTSConfig = {}) {
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    })
    
    this.voiceId = VOICES[config.voiceId || 'sara']
    this.stability = config.stability ?? 0.35       // Lower = more expressive/natural
    this.similarityBoost = config.similarityBoost ?? 0.8   // High similarity to original
    this.style = config.style ?? 0.4                // More emotional expressiveness
  }

  /**
   * Generate speech - returns complete audio buffer
   */
  async synthesize(text: string): Promise<Buffer> {
    const audioStream = await this.client.generate({
      voice: this.voiceId,
      text,
      model_id: 'eleven_multilingual_v2', // Best for Spanish
      voice_settings: {
        stability: this.stability,
        similarity_boost: this.similarityBoost,
        style: this.style,
        use_speaker_boost: true,
      },
      output_format: 'ulaw_8000', // For telephony
    })

    // Collect chunks into buffer
    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk))
    }
    
    return Buffer.concat(chunks)
  }

  /**
   * Stream speech - yields audio chunks as they're generated
   * Lower latency for real-time applications
   */
  async *synthesizeStream(text: string): AsyncGenerator<Buffer> {
    const audioStream = await this.client.generate({
      voice: this.voiceId,
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: this.stability,
        similarity_boost: this.similarityBoost,
        style: this.style,
        use_speaker_boost: true,
      },
      output_format: 'ulaw_8000',
    })

    for await (const chunk of audioStream) {
      yield Buffer.from(chunk)
    }
  }

  /**
   * Get available voices (useful for letting users choose)
   */
  async getVoices() {
    const voices = await this.client.voices.getAll()
    return voices.voices.filter(v => 
      v.labels?.language?.includes('spanish') || 
      v.labels?.language?.includes('es')
    )
  }

  /**
   * Change voice mid-conversation
   */
  setVoice(voiceId: VoiceId) {
    this.voiceId = VOICES[voiceId]
  }
  
  /**
   * Set voice by raw ElevenLabs voice ID
   * (for custom voices from business settings)
   */
  setVoiceById(elevenLabsVoiceId: string) {
    this.voiceId = elevenLabsVoiceId
  }
}
