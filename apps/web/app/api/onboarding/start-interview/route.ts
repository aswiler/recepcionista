import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

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

    // Store scraped data in cache/DB for the voice service to access
    // In production, use Redis or a proper session store
    // For now, we'll pass it in the webhook URL params

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
