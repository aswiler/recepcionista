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
    
    // eleven_multilingual_v2 auto-detects language from text - no language_code needed
    // The model supports: Spanish, English, French, German, Italian, Portuguese, Polish, etc.
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
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
          stability: 0.35,           // Lower = more expressive, natural variation
          similarity_boost: 0.8,     // High similarity to original voice
          style: 0.4,                // Add some emotional expressiveness
          use_speaker_boost: true,   // Enhance voice clarity
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
