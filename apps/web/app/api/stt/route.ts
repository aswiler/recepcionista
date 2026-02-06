import { NextRequest, NextResponse } from 'next/server'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

/**
 * Speech-to-Text using Deepgram
 * Converts audio to text for the browser-based interview
 */
export async function POST(request: NextRequest) {
  try {
    const { audio, mimeType } = await request.json()

    if (!audio) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    if (!DEEPGRAM_API_KEY) {
      console.error('DEEPGRAM_API_KEY not set - speech recognition will not work')
      return NextResponse.json({ 
        text: '', 
        error: 'Speech recognition not configured. Please add DEEPGRAM_API_KEY to environment variables.' 
      })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    console.log('STT request - audio size:', audioBuffer.length, 'bytes, mimeType:', mimeType || 'not specified')

    // Use Deepgram with auto language detection (don't force Spanish)
    // This works better when users might speak multiple languages
    const params = new URLSearchParams({
      model: 'nova-2',
      punctuate: 'true',
      smart_format: 'true',
      detect_language: 'true', // Auto-detect language
    })
    
    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': mimeType || 'audio/webm',
      },
      body: audioBuffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deepgram error:', response.status, errorText)
      
      return NextResponse.json({ 
        text: '', 
        error: `Deepgram API error: ${response.status}`,
        details: errorText
      })
    }

    const data = await response.json()
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const detectedLanguage = data.results?.channels?.[0]?.detected_language || 'unknown'
    const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
    
    console.log('Deepgram result:', {
      transcript: transcript ? transcript.substring(0, 100) : '(empty)',
      language: detectedLanguage,
      confidence: confidence.toFixed(2),
    })

    return NextResponse.json({ 
      text: transcript,
      language: detectedLanguage,
      confidence,
    })
  } catch (error) {
    console.error('STT error:', error)
    return NextResponse.json({ text: '', error: String(error) })
  }
}
