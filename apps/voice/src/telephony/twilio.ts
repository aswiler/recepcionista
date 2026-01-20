/**
 * Twilio Integration
 * 
 * Handles:
 * - Incoming call webhooks
 * - Media streams (audio in/out)
 * - Call control (transfer, hangup)
 */

import twilio from 'twilio'
import { WebSocket } from 'ws'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

// TwiML responses
const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * Generate TwiML to answer a call and start media streaming
 */
export function generateAnswerTwiML(streamUrl: string): string {
  const response = new VoiceResponse()
  
  // Start bi-directional audio stream
  const connect = response.connect()
  connect.stream({
    url: streamUrl,
    // Track both inbound (customer) and outbound (AI) audio
    track: 'both_tracks',
  })
  
  return response.toString()
}

/**
 * Generate TwiML for call transfer
 */
export function generateTransferTwiML(transferTo: string): string {
  const response = new VoiceResponse()
  
  // Say something before transfer
  response.say({
    voice: 'Polly.Lucia', // AWS Polly Spanish voice (backup)
    language: 'es-ES',
  }, 'Le transfiero con un miembro de nuestro equipo. Un momento por favor.')
  
  // Dial the transfer number
  response.dial(transferTo)
  
  return response.toString()
}

/**
 * Handle Twilio Media Stream WebSocket messages
 */
export interface TwilioMediaMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark'
  sequenceNumber?: string
  media?: {
    track: 'inbound' | 'outbound'
    chunk: string
    timestamp: string
    payload: string // Base64 encoded audio
  }
  streamSid?: string
  start?: {
    streamSid: string
    accountSid: string
    callSid: string
    tracks: string[]
    customParameters: Record<string, string>
  }
  mark?: {
    name: string
  }
}

export function parseTwilioMessage(data: string): TwilioMediaMessage {
  return JSON.parse(data)
}

/**
 * Send audio back to Twilio stream
 */
export function createMediaMessage(audioBase64: string, streamSid: string): string {
  return JSON.stringify({
    event: 'media',
    streamSid,
    media: {
      payload: audioBase64,
    },
  })
}

/**
 * Send a mark to track when audio finishes playing
 */
export function createMarkMessage(markName: string, streamSid: string): string {
  return JSON.stringify({
    event: 'mark',
    streamSid,
    mark: {
      name: markName,
    },
  })
}

/**
 * Clear the audio queue (stop current speech)
 */
export function createClearMessage(streamSid: string): string {
  return JSON.stringify({
    event: 'clear',
    streamSid,
  })
}

/**
 * Provision a new phone number
 */
export async function provisionPhoneNumber(
  areaCode?: string,
  country: string = 'ES'
): Promise<string> {
  // Search for available numbers
  const numbers = await client.availablePhoneNumbers(country)
    .local
    .list({
      areaCode: areaCode ? parseInt(areaCode) : undefined,
      limit: 1,
    })

  if (numbers.length === 0) {
    throw new Error(`No phone numbers available in ${country}`)
  }

  // Purchase the number
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: numbers[0].phoneNumber,
    voiceUrl: `${process.env.BASE_URL}/webhook/twilio/voice`,
    voiceMethod: 'POST',
  })

  return purchased.phoneNumber
}

/**
 * Configure webhook for existing number
 */
export async function configurePhoneNumber(
  phoneNumberSid: string,
  webhookUrl: string
): Promise<void> {
  await client.incomingPhoneNumbers(phoneNumberSid).update({
    voiceUrl: webhookUrl,
    voiceMethod: 'POST',
  })
}

/**
 * List all phone numbers
 */
export async function listPhoneNumbers() {
  const numbers = await client.incomingPhoneNumbers.list()
  return numbers.map(n => ({
    sid: n.sid,
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
  }))
}

/**
 * End an active call
 */
export async function endCall(callSid: string): Promise<void> {
  await client.calls(callSid).update({
    status: 'completed',
  })
}

/**
 * Transfer an active call
 */
export async function transferCall(
  callSid: string,
  transferTo: string
): Promise<void> {
  await client.calls(callSid).update({
    twiml: generateTransferTwiML(transferTo),
  })
}
