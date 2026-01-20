/**
 * Text-to-Speech using Cartesia
 * 
 * Low-latency streaming TTS with Spanish voices
 */

// Note: Cartesia JS SDK is relatively new
// Using direct API calls for reliability

interface CartesiaVoice {
  id: string
  name: string
}

// Spanish voices from Cartesia
const SPANISH_VOICES: Record<string, string> = {
  'female-1': '79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e', // Lucia
  'male-1': 'a0e99841-438c-4a64-b679-ae501e7d6091',   // Carlos
}

export class CartesiaTTS {
  private apiKey: string
  private voiceId: string

  constructor(voiceType: 'female-1' | 'male-1' = 'female-1') {
    this.apiKey = process.env.CARTESIA_API_KEY!
    this.voiceId = SPANISH_VOICES[voiceType]
  }

  /**
   * Synthesize speech and return as a single buffer
   */
  async synthesize(text: string): Promise<Buffer> {
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-multilingual',
        transcript: text,
        voice: {
          mode: 'id',
          id: this.voiceId,
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_mulaw', // For telephony
          sample_rate: 8000,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Cartesia error: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Stream TTS for lower latency
   */
  async *synthesizeStream(text: string): AsyncGenerator<Buffer> {
    const response = await fetch('https://api.cartesia.ai/tts/sse', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-multilingual',
        transcript: text,
        voice: {
          mode: 'id',
          id: this.voiceId,
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_mulaw',
          sample_rate: 8000,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Cartesia error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.slice(5))
            if (data.audio) {
              yield Buffer.from(data.audio, 'base64')
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
