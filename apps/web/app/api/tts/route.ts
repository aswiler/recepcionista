import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// Default voice ID - Pablo (professional Spanish male voice)
const DEFAULT_VOICE_ID = 'pb3lVZVjdFWbkhPKlelB'

/**
 * Text-to-Speech using ElevenLabs
 * Converts AI text responses to natural speech
 * 
 * Uses eleven_multilingual_v2 which auto-detects language from text
 * Supports: Spanish, English, French, German, Italian, Portuguese, Polish, and more
 * 
 * @param text - The text to convert to speech
 * @param voiceId - Optional ElevenLabs voice ID
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      console.warn('ELEVENLABS_API_KEY not set')
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
    }

    // Use provided voice ID or default
    const selectedVoiceId = voiceId || DEFAULT_VOICE_ID
    console.log('TTS request - voiceId received:', voiceId, '| using:', selectedVoiceId)
    
    // Use streaming endpoint with optimize_streaming_latency for faster first-byte
    // output_format: mp3_22050_32 = lower quality but faster + more phone-like
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?optimize_streaming_latency=3&output_format=mp3_22050_32`
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,            // Balanced: natural but consistent
          similarity_boost: 0.75,    // Slightly lower for more natural variation
          style: 0.3,                // Moderate expressiveness
          use_speaker_boost: false,  // OFF = less studio-polished, more natural/phone
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs error:', response.status, errorText)
      return NextResponse.json({ 
        error: 'TTS failed', 
        details: errorText,
        voiceId: selectedVoiceId,
        status: response.status 
      }, { status: 500 })
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
