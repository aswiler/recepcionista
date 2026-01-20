/**
 * Telnyx Webhook Handler
 * 
 * Handles incoming calls, call events, and audio streaming setup
 */

import Telnyx from 'telnyx'

const telnyx = new Telnyx(process.env.TELNYX_API_KEY!)

// Store for active calls
const activeCalls = new Map<string, {
  businessId: string
  from: string
  to: string
  startedAt: Date
}>()

interface TelnyxEvent {
  data: {
    event_type: string
    payload: {
      call_control_id: string
      call_leg_id: string
      call_session_id: string
      client_state?: string
      from: string
      to: string
      direction: string
      state?: string
    }
  }
}

export async function handleTelnyxWebhook(event: TelnyxEvent) {
  const { event_type, payload } = event.data
  const callControlId = payload.call_control_id

  console.log(`📞 Telnyx event: ${event_type}`)

  switch (event_type) {
    case 'call.initiated':
      return handleCallInitiated(callControlId, payload)
    
    case 'call.answered':
      return handleCallAnswered(callControlId, payload)
    
    case 'call.hangup':
      return handleCallHangup(callControlId)
    
    case 'streaming.started':
      return { status: 'streaming' }
    
    case 'streaming.stopped':
      return { status: 'stopped' }
    
    default:
      return { status: 'ignored', event: event_type }
  }
}

async function handleCallInitiated(callControlId: string, payload: any) {
  const { from, to, direction } = payload

  console.log(`📞 Incoming call from ${from} to ${to}`)

  // Look up business by phone number
  // For now, use a default
  const businessId = 'default'

  // Store call info
  activeCalls.set(callControlId, {
    businessId,
    from,
    to,
    startedAt: new Date(),
  })

  // Answer the call
  try {
    await telnyx.calls.answer(callControlId, {
      client_state: Buffer.from(JSON.stringify({ businessId })).toString('base64'),
    })
    
    return { status: 'answering' }
  } catch (error) {
    console.error('Error answering call:', error)
    return { status: 'error', error: String(error) }
  }
}

async function handleCallAnswered(callControlId: string, payload: any) {
  const callInfo = activeCalls.get(callControlId)
  if (!callInfo) {
    console.error('No call info found for:', callControlId)
    return { status: 'error', error: 'Call not found' }
  }

  console.log(`✅ Call answered, starting stream`)

  // Start audio streaming
  try {
    const voiceServiceUrl = process.env.VOICE_SERVICE_WS_URL || 'wss://voice.recepcionista.com'
    
    await telnyx.calls.streamingStart(callControlId, {
      stream_url: `${voiceServiceUrl}/stream/${callControlId}`,
      stream_track: 'both_tracks', // Inbound and outbound audio
    })

    return { status: 'streaming' }
  } catch (error) {
    console.error('Error starting stream:', error)
    return { status: 'error', error: String(error) }
  }
}

async function handleCallHangup(callControlId: string) {
  const callInfo = activeCalls.get(callControlId)
  
  if (callInfo) {
    const duration = Math.round((Date.now() - callInfo.startedAt.getTime()) / 1000)
    console.log(`📞 Call ended. Duration: ${duration}s`)
    
    // Store call record in database (optional)
    // await storeCallRecord(callInfo, duration)
    
    activeCalls.delete(callControlId)
  }

  return { status: 'hangup' }
}

/**
 * Transfer call to a human
 */
export async function transferCall(
  callControlId: string,
  transferTo: string
): Promise<void> {
  console.log(`📞 Transferring call to ${transferTo}`)
  
  await telnyx.calls.transfer(callControlId, {
    to: transferTo,
  })
}

/**
 * Hang up a call
 */
export async function hangupCall(callControlId: string): Promise<void> {
  await telnyx.calls.hangup(callControlId)
}
