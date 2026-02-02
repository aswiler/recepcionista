import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Start a voice interview session
 * 
 * Returns a WebSocket URL for browser-based voice interview.
 * The interview is conducted via WebRTC in the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { scrapedData } = await request.json()

    // Generate a unique session ID for this interview
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Return WebRTC connection info for browser-based interview
    return NextResponse.json({
      sessionId,
      type: 'browser',
      wsUrl: `${process.env.VOICE_SERVICE_URL}/interview/${sessionId}`,
      scrapedData,
    })
  } catch (error) {
    console.error('Error starting interview:', error)
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    )
  }
}
