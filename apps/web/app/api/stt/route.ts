import { NextRequest, NextResponse } from 'next/server'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

/**
 * Speech-to-Text using Deepgram
 * Optimized for Spanish conversational speech with high accuracy
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

    // Optimized Deepgram settings for Spanish conversational speech
    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'es',              // Force Spanish
      punctuate: 'true',
      smart_format: 'true',
      utterances: 'true',          // Better sentence boundary detection  
      endpointing: '400',          // Wait 400ms of silence before finalizing (captures full phrases)
      // NO numerals - we want "dieciocho" not "18" (TTS reads digits literally)
      // NO filler_words - "eh", "um" add noise to the transcript
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
    
    // Get transcript - prefer utterances if available for better sentence structure
    let transcript = ''
    if (data.results?.utterances?.length > 0) {
      // Combine all utterances for complete transcript
      transcript = data.results.utterances.map((u: { transcript: string }) => u.transcript).join(' ')
    } else {
      transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    }
    
    const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
    const words = data.results?.channels?.[0]?.alternatives?.[0]?.words || []
    
    console.log('Deepgram result:', {
      transcript: transcript ? transcript.substring(0, 150) : '(empty)',
      wordCount: words.length,
      confidence: confidence.toFixed(2),
      audioSize: audioBuffer.length,
    })

    return NextResponse.json({ 
      text: transcript,
      confidence,
      wordCount: words.length,
    })
  } catch (error) {
    console.error('STT error:', error)
    return NextResponse.json({ text: '', error: String(error) })
  }
}
