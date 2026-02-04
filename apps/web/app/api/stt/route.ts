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

    // Deepgram can auto-detect format, so we use a generic content type
    // and let it figure out the codec from the audio data
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true&detect_language=true', {
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
      
      // If webm fails, the audio might be in a different format - try with generic type
      if (response.status === 400) {
        console.log('Retrying with generic audio type...')
        const retryResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/octet-stream',
          },
          body: audioBuffer,
        })
        
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
          console.log('Deepgram transcript (retry):', transcript ? transcript.substring(0, 100) : '(empty)')
          return NextResponse.json({ text: transcript })
        }
        
        const retryError = await retryResponse.text()
        console.error('Deepgram retry also failed:', retryResponse.status, retryError)
      }
      
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
    return NextResponse.json({ text: '', error: String(error) })
  }
}
