/**
 * Telnyx Integration
 * 
 * Handles:
 * - Incoming call webhooks (Call Control API v2)
 * - Media streams (audio in/out via WebSocket)
 * - Call control (answer, transfer, hangup)
 */

import Telnyx from 'telnyx'

// Initialize Telnyx client
const telnyxClient = new Telnyx(process.env.TELNYX_API_KEY!)

// Store for active calls
export const activeCalls = new Map<string, {
  businessId: string
  businessName: string
  calendarConnectionId?: string
  phoneNumberId?: string
  from: string
  to: string
  startedAt: Date
  callLegId?: string
  callSessionId?: string
}>()

/**
 * Telnyx webhook event structure (API v2)
 */
export interface TelnyxWebhookEvent {
  data: {
    event_type: string
    id: string
    occurred_at: string
    payload: {
      call_control_id: string
      call_leg_id: string
      call_session_id: string
      client_state?: string
      connection_id?: string
      from: string
      to: string
      direction: 'incoming' | 'outgoing'
      state?: string
      start_time?: string
      end_time?: string
      hangup_cause?: string
      hangup_source?: string
    }
    record_type: string
  }
  meta?: {
    attempt: number
    delivered_to: string
  }
}

/**
 * Telnyx Media Stream WebSocket message types
 */
export interface TelnyxStreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'error'
  sequence_number?: number
  stream_id?: string
  start?: {
    stream_id: string
    call_control_id: string
    client_state?: string
    media_format: {
      encoding: string
      sample_rate: number
      channels: number
    }
  }
  media?: {
    track: 'inbound' | 'outbound'
    chunk: number
    timestamp: string
    payload: string // Base64 encoded audio (mulaw 8kHz)
  }
  stop?: {
    reason: string
  }
  error?: {
    message: string
    code: string
  }
}

/**
 * Parse incoming WebSocket message from Telnyx
 */
export function parseTelnyxMessage(data: string): TelnyxStreamMessage {
  try {
    return JSON.parse(data)
  } catch {
    // If it's binary audio data
    return {
      event: 'media',
      media: {
        track: 'inbound',
        chunk: 0,
        timestamp: new Date().toISOString(),
        payload: Buffer.from(data).toString('base64'),
      },
    }
  }
}

/**
 * Create audio message to send back to Telnyx stream
 */
export function createTelnyxMediaMessage(audioBase64: string, streamId: string): string {
  return JSON.stringify({
    event: 'media',
    stream_id: streamId,
    media: {
      payload: audioBase64,
    },
  })
}

/**
 * Create clear message to stop audio playback
 */
export function createTelnyxClearMessage(streamId: string): string {
  return JSON.stringify({
    event: 'clear',
    stream_id: streamId,
  })
}

/**
 * Answer an incoming call
 */
export async function answerCall(
  callControlId: string,
  businessId: string,
  businessName: string,
  calendarConnectionId?: string
): Promise<void> {
  const clientState = Buffer.from(JSON.stringify({
    businessId,
    businessName,
    calendarConnectionId,
  })).toString('base64')

  await telnyxClient.calls.answer(callControlId, {
    client_state: clientState,
  })
}

/**
 * Start audio streaming on a call
 */
export async function startStreaming(
  callControlId: string,
  streamUrl: string
): Promise<void> {
  await telnyxClient.calls.streamingStart(callControlId, {
    stream_url: streamUrl,
    stream_track: 'both_tracks', // Both inbound and outbound
  })
}

/**
 * Stop audio streaming on a call
 */
export async function stopStreaming(callControlId: string): Promise<void> {
  try {
    await telnyxClient.calls.streamingStop(callControlId)
  } catch (error) {
    console.error('Error stopping stream:', error)
  }
}

/**
 * Transfer a call to another number
 */
export async function transferCall(
  callControlId: string,
  transferTo: string
): Promise<void> {
  console.log(`📞 Transferring call to ${transferTo}`)
  
  // First speak a message
  await telnyxClient.calls.speak(callControlId, {
    payload: 'Le transfiero con un miembro de nuestro equipo. Un momento por favor.',
    voice: 'female',
    language: 'es-ES',
  })
  
  // Then transfer
  await telnyxClient.calls.transfer(callControlId, {
    to: transferTo,
  })
}

/**
 * Hang up a call
 */
export async function hangupCall(callControlId: string): Promise<void> {
  await telnyxClient.calls.hangup(callControlId)
}

/**
 * Play audio to the caller (TTS)
 */
export async function speakToCall(
  callControlId: string,
  text: string,
  language: string = 'es-ES'
): Promise<void> {
  await telnyxClient.calls.speak(callControlId, {
    payload: text,
    voice: 'female',
    language,
  })
}

/**
 * Get call details
 */
export async function getCallInfo(callControlId: string) {
  return await telnyxClient.calls.retrieve(callControlId)
}

/**
 * List phone numbers from Telnyx account
 */
export async function listPhoneNumbers() {
  const numbers = await telnyxClient.phoneNumbers.list({
    page: { size: 100 },
  })
  return numbers.data.map((n: any) => ({
    id: n.id,
    phoneNumber: n.phone_number,
    status: n.status,
    connectionId: n.connection_id,
  }))
}

/**
 * Purchase a phone number
 */
export async function purchasePhoneNumber(
  phoneNumber: string,
  connectionId: string
): Promise<any> {
  const order = await telnyxClient.numberOrders.create({
    phone_numbers: [{ phone_number: phoneNumber }],
    connection_id: connectionId,
  })
  return order
}

/**
 * Search for available phone numbers
 */
export async function searchAvailableNumbers(
  countryCode: string = 'ES',
  limit: number = 10
): Promise<any[]> {
  const numbers = await telnyxClient.availablePhoneNumbers.list({
    filter: {
      country_code: countryCode,
      features: ['voice'],
      limit,
    },
  })
  return numbers.data
}

/**
 * Configure a phone number for voice
 */
export async function configurePhoneNumber(
  phoneNumberId: string,
  connectionId: string
): Promise<void> {
  await telnyxClient.phoneNumbers.update(phoneNumberId, {
    connection_id: connectionId,
  })
}

/**
 * Initiate an outbound call
 * Used for WhatsApp → Voice transfer
 */
export async function createOutboundCall(params: {
  from: string
  to: string
  connectionId?: string
  clientState?: string
  webhookUrl?: string
}): Promise<{ success: boolean; callControlId?: string; error?: string }> {
  try {
    const call = await telnyxClient.calls.create({
      from: params.from,
      to: params.to,
      connection_id: params.connectionId || process.env.TELNYX_CONNECTION_ID,
      webhook_url: params.webhookUrl,
      client_state: params.clientState,
      answering_machine_detection: 'detect',
    })
    
    // The call object structure varies by SDK version
    const callData = (call as any).data || call
    const callControlId = callData.call_control_id || callData.id
    
    return {
      success: true,
      callControlId,
    }
  } catch (error: any) {
    console.error('Telnyx outbound call error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create call',
    }
  }
}
