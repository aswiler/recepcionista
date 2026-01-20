/**
 * Speech-to-Text using Deepgram
 * 
 * Real-time streaming transcription with Spanish support
 */

import { createClient, LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk'

type TranscriptCallback = (text: string, isFinal: boolean) => void

export class DeepgramSTT {
  private client
  private connection: LiveClient | null = null
  private callback: TranscriptCallback | null = null

  constructor() {
    this.client = createClient(process.env.DEEPGRAM_API_KEY!)
  }

  async startStream(onTranscript: TranscriptCallback): Promise<void> {
    this.callback = onTranscript
    
    this.connection = this.client.listen.live({
      model: 'nova-2',           // Best model
      language: 'es',            // Spanish
      smart_format: true,        // Punctuation, numbers
      interim_results: true,     // Partial results
      utterance_end_ms: 1000,    // End of speech detection
      vad_events: true,          // Voice activity detection
      encoding: 'mulaw',         // Telephony encoding
      sample_rate: 8000,         // Telephony sample rate
    })

    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('🎤 Deepgram connection opened')
    })

    this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives?.[0]
      if (transcript?.transcript) {
        const isFinal = data.is_final || false
        this.callback?.(transcript.transcript, isFinal)
      }
    })

    this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      // User stopped speaking
      console.log('🔇 Utterance end detected')
    })

    this.connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error)
    })

    this.connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('🎤 Deepgram connection closed')
    })
  }

  sendAudio(audioBuffer: Buffer): void {
    if (this.connection?.getReadyState() === 1) { // OPEN
      this.connection.send(audioBuffer)
    }
  }

  close(): void {
    this.connection?.finish()
    this.connection = null
  }
}
