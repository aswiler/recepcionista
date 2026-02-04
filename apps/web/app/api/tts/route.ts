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
    
    // Map language codes to ElevenLabs language codes (ISO 639-3 for v3)
    // Catalan requires eleven_v3 model (not supported in v2)
    // Spanish works with eleven_multilingual_v2
    const languageMap: Record<string, { code: string; model: string }> = {
      'es-ES': { code: 'spa', model: 'eleven_multilingual_v2' },  // Spanish (Castilian)
      'es': { code: 'spa', model: 'eleven_multilingual_v2' },     // Spanish (generic)
      'ca': { code: 'cat', model: 'eleven_v3' },                  // Catalan (v3 only)
    }
    
    const langConfig = languageMap[language || 'es-ES'] || { code: 'spa', model: 'eleven_multilingual_v2' }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: langConfig.model,
        language_code: langConfig.code,
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
