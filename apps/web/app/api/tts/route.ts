import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// Default voice ID - Sarah (professional, clear)
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

/**
 * Text-to-Speech using ElevenLabs
 * Converts AI text responses to natural speech
 * 
 * Supports multiple languages:
 * - es-ES: Spanish (Castilian/Spain)
 * - ca: Catalan
 * 
 * @param text - The text to convert to speech
 * @param voiceId - Optional ElevenLabs voice ID (defaults to Sarah)
 * @param language - Optional language code (defaults to es-ES for Castilian Spanish)
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, language } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      console.warn('ELEVENLABS_API_KEY not set')
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
    }

    // Use provided voice ID or default
    const selectedVoiceId = voiceId || DEFAULT_VOICE_ID
    
    // Map language codes to ElevenLabs language codes
    // ElevenLabs uses ISO 639-1 codes
    const languageMap: Record<string, string> = {
      'es-ES': 'es',  // Spanish (Castilian)
      'es': 'es',     // Spanish (generic)
      'ca': 'ca',     // Catalan
    }
    
    const languageCode = languageMap[language || 'es-ES'] || 'es'

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
        language_code: languageCode,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!response.ok) {
      console.error('ElevenLabs error:', await response.text())
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
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
