/**
 * Text-to-Speech using ElevenLabs
 * 
 * THE WOW FACTOR - Best quality voices available
 * 
 * Spanish voices recommended:
 * - "Lucia" (Spain female) - Professional, warm
 * - "Diego" (Spain male) - Confident, clear
 * - "Sofia" (LatAm female) - Friendly, approachable
 * - "Mateo" (Mexico male) - Natural, conversational
 */

import { ElevenLabsClient } from 'elevenlabs'

// Spanish voice IDs from ElevenLabs
export const SPANISH_VOICES = {
  // Spain Spanish
  'lucia-spain': '9BWtsMINqrJLrRacOk9x',      // Professional female
  'diego-spain': 'CYw3kZ02Hs0563khs1Fj',      // Professional male
  
  // Latin American Spanish
  'sofia-latam': 'EXAVITQu4vr4xnSDxMaL',      // Friendly female
  'mateo-mexico': 'IKne3meq5aSn9XLyUdCD',     // Natural male
  
  // Multilingual (switches automatically)
  'aria-multilingual': '9BWtsMINqrJLrRacOk9x',
} as const

export type VoiceId = keyof typeof SPANISH_VOICES

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
    
    this.voiceId = SPANISH_VOICES[config.voiceId || 'lucia-spain']
    this.stability = config.stability ?? 0.5        // Balanced
    this.similarityBoost = config.similarityBoost ?? 0.75  // Consistent
    this.style = config.style ?? 0.3                // Some expression
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
    this.voiceId = SPANISH_VOICES[voiceId]
  }
}
