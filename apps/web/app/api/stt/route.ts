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

    // Optimized Deepgram settings for Spanish conversational speech:
    // - Use nova-2-general for better accuracy with conversational speech
    // - Force Spanish (es) for better recognition of Spanish speakers
    // - Enable utterances for natural sentence boundaries
    // - Disable diarize since it's single speaker
    // - Use filler_words to capture more natural speech
    const params = new URLSearchParams({
      model: 'nova-2-general',
      language: 'es',              // Force Spanish for better accuracy
      punctuate: 'true',
      smart_format: 'true',
      utterances: 'true',          // Better sentence boundary detection
      filler_words: 'true',        // Capture "eh", "um", etc. (helps with full transcription)
      numerals: 'true',            // Better number handling
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
