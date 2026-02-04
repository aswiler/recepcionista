import { NextRequest, NextResponse } from 'next/server'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

/**
 * Speech-to-Text using Deepgram
 * Converts audio to text for the browser-based interview
 */
export async function POST(request: NextRequest) {
  try {
    const { audio } = await request.json()

    if (!audio) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    if (!DEEPGRAM_API_KEY) {
      // Fallback: return empty text if no API key
      console.error('DEEPGRAM_API_KEY not set - speech recognition will not work')
      return NextResponse.json({ 
        text: '', 
        error: 'Speech recognition not configured. Please add DEEPGRAM_API_KEY to environment variables.' 
      })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')

    // Send to Deepgram
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
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
    
    console.log('Deepgram transcript:', transcript ? transcript.substring(0, 100) : '(empty)')

    return NextResponse.json({ text: transcript })
  } catch (error) {
    console.error('STT error:', error)
    return NextResponse.json({ text: '' })
  }
}
