/**
 * Voice Service - Real-time voice AI pipeline (Production)
 * 
 * Premium Pipeline:
 * - Telnyx (telephony + media streams)
 * - Deepgram Nova-2 (STT - streaming)
 * - GPT-4o / GPT-4o-mini (LLM + function calling)
 * - ElevenLabs (TTS - most natural voices)
 * 
 * Features:
 * - Calendar integration (book appointments via voice)
 * - Interruption handling
 * - Natural Spanish (Spain) voice
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { TelnyxVoicePipeline } from './pipeline/orchestrator-telnyx'
import { 
  TelnyxWebhookEvent, 
  activeCalls, 
  answerCall, 
  startStreaming,
  createOutboundCall,
} from './telephony/telnyx'

// Environment
import 'dotenv/config'

const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

// HTTP Server (Hono)
const app = new Hono()

// Active voice pipelines (by call control ID)
const activePipelines = new Map<string, TelnyxVoicePipeline>()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  service: 'voice',
  version: '2.0.0',
  provider: 'telnyx',
  pipeline: 'premium',
  timestamp: new Date().toISOString(),
}))

// Ready check (for load balancers)
app.get('/ready', (c) => c.json({ ready: true }))

/**
 * Telnyx Voice Webhook - Handles all call events
 * This is the main entry point for incoming calls
 */
app.post('/webhook/telnyx', async (c) => {
  const event: TelnyxWebhookEvent = await c.req.json()
  const { event_type, payload } = event.data
  const callControlId = payload.call_control_id

  console.log(`📞 Telnyx event: ${event_type}`)
  console.log(`   Call ID: ${callControlId}`)

  switch (event_type) {
    case 'call.initiated':
      return handleCallInitiated(c, callControlId, payload)
    
    case 'call.answered':
      return handleCallAnswered(c, callControlId, payload)
    
    case 'call.hangup':
      return handleCallHangup(c, callControlId, payload)
    
    case 'streaming.started':
      console.log('🎙️ Audio streaming started')
      return c.json({ status: 'streaming' })
    
    case 'streaming.stopped':
      console.log('🎙️ Audio streaming stopped')
      return c.json({ status: 'stopped' })
    
    case 'call.speak.started':
      console.log('🔊 TTS started')
      return c.json({ status: 'speaking' })
    
    case 'call.speak.ended':
      console.log('🔊 TTS ended')
      return c.json({ status: 'spoke' })
    
    default:
      console.log(`   Ignored event: ${event_type}`)
      return c.json({ status: 'ignored', event: event_type })
  }
})

/**
 * Handle call initiated - for inbound calls, answer them
 * For outbound calls (WhatsApp → Voice), we already set up the call
 */
async function handleCallInitiated(c: any, callControlId: string, payload: any) {
  const { from, to, direction } = payload
  
  const isOutbound = direction === 'outgoing'
  
  console.log(`📞 ${isOutbound ? 'Outbound' : 'Inbound'} call initiated`)
  console.log(`   From: ${from}`)
  console.log(`   To: ${to}`)
  console.log(`   Direction: ${direction}`)
  
  // For outbound calls, we already stored the call info when we created it
  if (isOutbound) {
    const existingCall = activeCalls.get(callControlId)
    if (existingCall) {
      console.log(`   Business: ${existingCall.businessName} (outbound)`)
      console.log('📱 Ringing customer...')
      return c.json({ status: 'ringing' })
    }
  }
  
  // For inbound calls, look up business by phone number
  const businessConfig = await lookupBusinessByPhone(to)
  
  // Store call info for later
  activeCalls.set(callControlId, {
    businessId: businessConfig.businessId,
    businessName: businessConfig.businessName,
    calendarConnectionId: businessConfig.calendarConnectionId,
    phoneNumberId: businessConfig.phoneNumberId,
    from,
    to,
    startedAt: new Date(),
    callLegId: payload.call_leg_id,
    callSessionId: payload.call_session_id,
  })
  
  console.log(`   Business: ${businessConfig.businessName} (${businessConfig.businessId})`)
  
  try {
    // Answer the inbound call
    await answerCall(
      callControlId,
      businessConfig.businessId,
      businessConfig.businessName,
      businessConfig.calendarConnectionId
    )
    
    console.log('✅ Call answered')
    return c.json({ status: 'answering' })
  } catch (error) {
    console.error('❌ Error answering call:', error)
    return c.json({ status: 'error', error: String(error) }, 500)
  }
}

/**
 * Handle call answered - start audio streaming
 */
async function handleCallAnswered(c: any, callControlId: string, payload: any) {
  const callInfo = activeCalls.get(callControlId)
  
  if (!callInfo) {
    console.error('❌ No call info found for:', callControlId)
    return c.json({ status: 'error', error: 'Call not found' }, 404)
  }
  
  console.log('✅ Call answered, starting audio stream')
  
  try {
    // Build WebSocket URL for audio streaming
    const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws'
    const wsHost = BASE_URL.replace(/^https?:\/\//, '')
    const streamUrl = `${wsProtocol}://${wsHost}/stream/${callControlId}`
    
    // Add business context as query params
    const streamUrlWithParams = new URL(streamUrl)
    streamUrlWithParams.searchParams.set('businessId', callInfo.businessId)
    streamUrlWithParams.searchParams.set('businessName', callInfo.businessName)
    if (callInfo.calendarConnectionId) {
      streamUrlWithParams.searchParams.set('calendarConnectionId', callInfo.calendarConnectionId)
    }
    
    console.log(`   Stream URL: ${streamUrlWithParams.toString()}`)
    
    // Start streaming
    await startStreaming(callControlId, streamUrlWithParams.toString())
    
    return c.json({ status: 'streaming' })
  } catch (error) {
    console.error('❌ Error starting stream:', error)
    return c.json({ status: 'error', error: String(error) }, 500)
  }
}

/**
 * Handle call hangup - clean up
 */
async function handleCallHangup(c: any, callControlId: string, payload: any) {
  const callInfo = activeCalls.get(callControlId)
  
  if (callInfo) {
    const duration = Math.round((Date.now() - callInfo.startedAt.getTime()) / 1000)
    console.log(`📞 Call ended`)
    console.log(`   Duration: ${duration}s`)
    console.log(`   Hangup cause: ${payload.hangup_cause || 'unknown'}`)
    
    // Store call record in database
    await storeCallRecord(callControlId, {
      from: callInfo.from,
      to: callInfo.to,
      businessId: callInfo.businessId,
      phoneNumberId: callInfo.phoneNumberId,
      duration,
      hangupCause: payload.hangup_cause,
      completedAt: new Date(),
    })
    
    // Clean up
    activeCalls.delete(callControlId)
  }
  
  console.log(`📊 Active calls: ${activeCalls.size}`)
  return c.json({ status: 'hangup' })
}

/**
 * Phone number configuration endpoint
 * Used to configure which business handles calls for a number
 */
app.post('/api/configure-number', async (c) => {
  const body = await c.req.json()
  const { phoneNumber, businessId, connectionId } = body
  
  console.log(`🔧 Configuring ${phoneNumber} for business ${businessId}`)
  
  return c.json({ 
    success: true, 
    message: `Configured ${phoneNumber} for business ${businessId}`,
    webhookUrl: `${BASE_URL}/webhook/telnyx`,
  })
})

/**
 * Get active calls
 */
app.get('/api/calls', (c) => {
  const calls = Array.from(activeCalls.entries()).map(([id, info]) => ({
    callControlId: id,
    ...info,
    duration: Math.round((Date.now() - info.startedAt.getTime()) / 1000),
  }))
  return c.json({ calls, count: calls.length })
})

/**
 * Initiate an outbound call
 * Called from WhatsApp when user requests to be called
 */
app.post('/api/outbound-call', async (c) => {
  // Verify API key
  const apiKey = c.req.header('x-api-key')
  const expectedKey = process.env.VOICE_SERVICE_API_KEY
  
  if (!expectedKey || apiKey !== expectedKey) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const body = await c.req.json()
  const { businessId, customerPhone, reason } = body
  
  if (!customerPhone || !businessId) {
    return c.json({ error: 'customerPhone and businessId are required' }, 400)
  }
  
  console.log(`📞 Outbound call requested`)
  console.log(`   Business: ${businessId}`)
  console.log(`   Customer: ${customerPhone}`)
  console.log(`   Reason: ${reason || 'WhatsApp transfer'}`)
  
  try {
    // Look up business to get their Telnyx number
    const businessConfig = await lookupBusinessById(businessId)
    
    if (!businessConfig.phoneNumber) {
      console.error('❌ No phone number configured for business')
      return c.json({ 
        success: false, 
        message: 'El negocio no tiene un número de teléfono configurado' 
      }, 400)
    }
    
    // Initiate outbound call via Telnyx
    const callResult = await initiateOutboundCall({
      from: businessConfig.phoneNumber,
      to: customerPhone,
      businessId,
      businessName: businessConfig.businessName,
      calendarConnectionId: businessConfig.calendarConnectionId,
      reason,
    })
    
    if (callResult.success) {
      console.log(`✅ Outbound call initiated: ${callResult.callControlId}`)
      return c.json({
        success: true,
        message: 'Te llamaremos en unos segundos',
        callControlId: callResult.callControlId,
      })
    } else {
      console.error('❌ Failed to initiate call:', callResult.error)
      return c.json({
        success: false,
        message: 'No se pudo iniciar la llamada',
      }, 500)
    }
    
  } catch (error) {
    console.error('❌ Outbound call error:', error)
    return c.json({
      success: false,
      message: 'Error al iniciar la llamada',
    }, 500)
  }
})

/**
 * Transfer an active call to a human
 * Called from web app when AI requests handoff
 */
app.post('/api/transfer-call', async (c) => {
  // Verify API key
  const apiKey = c.req.header('x-api-key')
  const expectedKey = process.env.VOICE_SERVICE_API_KEY
  
  if (!expectedKey || apiKey !== expectedKey) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const body = await c.req.json()
  const { callId, transferTo, reason, summary } = body
  
  if (!callId || !transferTo) {
    return c.json({ error: 'callId and transferTo are required' }, 400)
  }
  
  console.log(`📞 Transfer request received`)
  console.log(`   Call ID: ${callId}`)
  console.log(`   Transfer to: ${transferTo}`)
  console.log(`   Reason: ${reason || 'Not specified'}`)
  
  // Find the call control ID from our active calls
  // The callId from web app might be our internal ID or the Telnyx call_control_id
  let callControlId = callId
  
  // Check if it's in our active calls
  const activeCall = activeCalls.get(callId)
  if (!activeCall) {
    // Maybe it's stored by external ID, search for it
    for (const [ccId, info] of activeCalls.entries()) {
      if (info.callId === callId || ccId === callId) {
        callControlId = ccId
        break
      }
    }
  }
  
  if (!activeCalls.has(callControlId)) {
    console.error(`   ❌ Call not found: ${callId}`)
    return c.json({ 
      error: 'Call not found or already ended',
      success: false,
    }, 404)
  }
  
  try {
    // Import transfer function
    const { transferCall } = await import('./telephony/telnyx')
    
    // Stop the AI pipeline before transfer
    const pipeline = activePipelines.get(callControlId)
    if (pipeline) {
      console.log(`   Stopping AI pipeline for transfer...`)
      // Don't remove from activePipelines yet - the call.hangup event will handle cleanup
    }
    
    // Transfer the call
    await transferCall(callControlId, transferTo)
    
    console.log(`   ✅ Call transferred to ${transferTo}`)
    
    return c.json({
      success: true,
      message: 'Call transferred',
      transferredTo: transferTo,
    })
    
  } catch (error) {
    console.error('❌ Transfer error:', error)
    return c.json({
      success: false,
      error: 'Failed to transfer call',
    }, 500)
  }
})

// Create HTTP server
const httpServer = createServer()

// Handle both Hono and raw HTTP (for WebSocket upgrade)
httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
  // Let Hono handle HTTP requests
  app.fetch(new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([_, v]) => v !== undefined) as [string, string][]
    ),
    body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : req as any,
  })).then(response => {
    res.writeHead(response.status, Object.fromEntries(response.headers))
    response.body?.pipeTo(new WritableStream({
      write(chunk) { res.write(chunk) },
      close() { res.end() },
    }))
  }).catch(err => {
    console.error('Request error:', err)
    res.writeHead(500)
    res.end('Internal Server Error')
  })
})

// WebSocket Server for Telnyx media streams
const wss = new WebSocketServer({ server: httpServer, path: '/stream' })

wss.on('connection', (ws: WebSocket, req) => {
  // Parse URL to extract call ID and business config
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const callControlId = pathParts[pathParts.length - 1] || 'unknown'
  
  // Get business config from query params
  const businessId = url.searchParams.get('businessId') || 'default'
  const businessName = decodeURIComponent(url.searchParams.get('businessName') || 'Mi Negocio')
  const calendarConnectionId = url.searchParams.get('calendarConnectionId') || undefined
  
  console.log(`🔌 WebSocket connected for call: ${callControlId}`)
  console.log(`   Business: ${businessName} (${businessId})`)
  console.log(`   Calendar: ${calendarConnectionId || 'not connected'}`)
  
  // Create Telnyx voice pipeline
  const pipeline = new TelnyxVoicePipeline({
    businessId,
    businessName,
    callControlId,
    calendarConnectionId,
    calendarEnabled: !!calendarConnectionId,
    usePremiumLLM: true, // Use GPT-4o for best quality
    voiceId: 'lucia-spain', // Professional Spanish voice
  })
  
  activePipelines.set(callControlId, pipeline)
  
  // Start the pipeline
  pipeline.start(ws)
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket closed for call: ${callControlId}`)
    pipeline.stop()
    activePipelines.delete(callControlId)
    
    // Log active calls
    console.log(`📊 Active pipelines: ${activePipelines.size}`)
  })
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for call ${callControlId}:`, error)
    pipeline.stop()
    activePipelines.delete(callControlId)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  
  // Close all active pipelines
  for (const [callId, pipeline] of activePipelines) {
    console.log(`   Closing pipeline for ${callId}`)
    pipeline.stop()
  }
  activePipelines.clear()
  
  // Close WebSocket server
  wss.close(() => {
    console.log('   WebSocket server closed')
    httpServer.close(() => {
      console.log('   HTTP server closed')
      process.exit(0)
    })
  })
})

// Start server
httpServer.listen(Number(PORT), () => {
  console.log('')
  console.log('🎤 Voice Service (Premium Pipeline)')
  console.log('=====================================')
  console.log(`   HTTP:      ${BASE_URL}`)
  console.log(`   WebSocket: ${BASE_URL.replace('http', 'ws')}/stream/{callControlId}`)
  console.log(`   Webhook:   ${BASE_URL}/webhook/telnyx`)
  console.log('')
  console.log('📋 Pipeline Components:')
  console.log('   Telephony: Telnyx')
  console.log('   STT:       Deepgram Nova-2 (streaming)')
  console.log('   LLM:       GPT-4o (function calling)')
  console.log('   TTS:       ElevenLabs (natural Spanish)')
  console.log('')
  console.log('✅ Ready to receive calls!')
  console.log('')
})

/**
 * Look up business configuration by phone number
 * Calls the web app API to resolve phone number → business
 */
async function lookupBusinessByPhone(phoneNumber: string): Promise<{
  businessId: string
  businessName: string
  calendarConnectionId?: string
  phoneNumberId?: string
}> {
  const webAppUrl = process.env.WEB_APP_URL
  const apiKey = process.env.VOICE_SERVICE_API_KEY
  
  // If no web app configured, use defaults
  if (!webAppUrl) {
    console.log('⚠️ WEB_APP_URL not configured, using defaults')
    return {
      businessId: 'default',
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
      calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
    }
  }
  
  try {
    const response = await fetch(`${webAppUrl}/api/voice/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
      },
      body: JSON.stringify({ phoneNumber }),
    })
    
    if (!response.ok) {
      console.error(`❌ Web app lookup failed: ${response.status}`)
      return {
        businessId: 'default',
        businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
        calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
      }
    }
    
    const data = await response.json()
    
    if (data.found) {
      return {
        businessId: data.businessId,
        businessName: data.businessName,
        calendarConnectionId: data.calendarConnectionId || undefined,
        phoneNumberId: data.phoneNumberId,
      }
    }
    
    // Phone number not found in database
    console.log(`⚠️ Phone number ${phoneNumber} not found, using defaults`)
    return {
      businessId: 'default',
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
      calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
    }
    
  } catch (error) {
    console.error('❌ Error calling web app lookup:', error)
    return {
      businessId: 'default',
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
      calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
    }
  }
}

/**
 * Store call record in database
 * Calls the web app API to persist the call
 */
async function storeCallRecord(callControlId: string, data: {
  from: string
  to: string
  businessId: string
  phoneNumberId?: string
  duration: number
  hangupCause?: string
  completedAt: Date
}): Promise<void> {
  const webAppUrl = process.env.WEB_APP_URL
  const apiKey = process.env.VOICE_SERVICE_API_KEY
  
  // If no web app configured, just log
  if (!webAppUrl) {
    console.log(`💾 Call record (local only): ${callControlId} - ${data.duration}s`)
    return
  }
  
  try {
    const response = await fetch(`${webAppUrl}/api/voice/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
      },
      body: JSON.stringify({
        externalId: callControlId,
        businessId: data.businessId,
        phoneNumberId: data.phoneNumberId,
        from: data.from,
        to: data.to,
        duration: data.duration,
        status: 'completed',
      }),
    })
    
    if (!response.ok) {
      console.error(`❌ Failed to store call record: ${response.status}`)
      return
    }
    
    const result = await response.json()
    console.log(`💾 Call stored: ${result.callId} (${data.duration}s)`)
    
  } catch (error) {
    console.error('❌ Error storing call record:', error)
  }
}

/**
 * Look up business configuration by ID
 * Used for outbound calls from WhatsApp
 */
async function lookupBusinessById(businessId: string): Promise<{
  businessId: string
  businessName: string
  phoneNumber?: string
  calendarConnectionId?: string
}> {
  const webAppUrl = process.env.WEB_APP_URL
  const apiKey = process.env.VOICE_SERVICE_API_KEY
  
  if (!webAppUrl) {
    return {
      businessId,
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
      phoneNumber: process.env.DEFAULT_OUTBOUND_NUMBER,
      calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
    }
  }
  
  try {
    const response = await fetch(`${webAppUrl}/api/voice/business/${businessId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey || '',
      },
    })
    
    if (!response.ok) {
      console.error(`❌ Business lookup failed: ${response.status}`)
      return {
        businessId,
        businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
        phoneNumber: process.env.DEFAULT_OUTBOUND_NUMBER,
      }
    }
    
    const data = await response.json()
    return {
      businessId: data.id,
      businessName: data.name,
      phoneNumber: data.phoneNumber,
      calendarConnectionId: data.calendarConnectionId,
    }
    
  } catch (error) {
    console.error('❌ Error looking up business:', error)
    return {
      businessId,
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
      phoneNumber: process.env.DEFAULT_OUTBOUND_NUMBER,
    }
  }
}

/**
 * Initiate an outbound call to a customer
 */
async function initiateOutboundCall(params: {
  from: string
  to: string
  businessId: string
  businessName: string
  calendarConnectionId?: string
  reason?: string
}): Promise<{ success: boolean; callControlId?: string; error?: string }> {
  // Build client state with business context
  const clientState = Buffer.from(JSON.stringify({
    businessId: params.businessId,
    businessName: params.businessName,
    calendarConnectionId: params.calendarConnectionId,
    isOutbound: true,
    reason: params.reason,
  })).toString('base64')
  
  // Create the outbound call
  const result = await createOutboundCall({
    from: params.from,
    to: params.to,
    clientState,
    webhookUrl: `${BASE_URL}/webhook/telnyx`,
  })
  
  if (result.success && result.callControlId) {
    // Store call info for when they answer
    activeCalls.set(result.callControlId, {
      businessId: params.businessId,
      businessName: params.businessName,
      calendarConnectionId: params.calendarConnectionId,
      from: params.from,
      to: params.to,
      startedAt: new Date(),
    })
  }
  
  return result
}
