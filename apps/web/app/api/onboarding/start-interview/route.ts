import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Lazy initialization of Twilio client (only when needed for phone calls)
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  if (!accountSid || !authToken) {
    return null
  }
  
  // Dynamic import to avoid build-time initialization
  const twilio = require('twilio')
  return twilio(accountSid, authToken)
}

/**
 * Start a voice interview call
 * 
 * This initiates an outbound call to the user for the onboarding interview.
 * Alternatively, it can return a browser-based WebRTC connection.
 */
export async function POST(request: NextRequest) {
  try {
    const { scrapedData, phoneNumber, useBrowser } = await request.json()

    // Generate a unique session ID for this interview
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (useBrowser) {
      // Return WebRTC token for browser-based call
      // This is the preferred method for immediate feedback
      return NextResponse.json({
        sessionId,
        type: 'browser',
        wsUrl: `${process.env.VOICE_SERVICE_URL}/interview/${sessionId}`,
        scrapedData,
      })
    }

    // Initiate outbound call to user's phone
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number required for outbound call' },
        { status: 400 }
      )
    }

    const client = getTwilioClient()
    if (!client) {
      return NextResponse.json(
        { error: 'Phone calls not configured. Please use browser-based interview.' },
        { status: 503 }
      )
    }

    const call = await client.calls.create({
      url: `${process.env.BASE_URL}/api/twilio/interview-webhook?sessionId=${sessionId}`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      statusCallback: `${process.env.BASE_URL}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })

    return NextResponse.json({
      sessionId,
      type: 'phone',
      callSid: call.sid,
      status: call.status,
    })
  } catch (error) {
    console.error('Error starting interview:', error)
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    )
  }
}
