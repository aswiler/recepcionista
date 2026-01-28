/**
 * Voice Service - Real-time voice AI pipeline (Production)
 * 
 * Premium Pipeline:
 * - Twilio (telephony + media streams)
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
import { WowVoicePipeline } from './pipeline/orchestrator-wow'
import { generateAnswerTwiML } from './telephony/twilio'

// Environment
import 'dotenv/config'

const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

// HTTP Server (Hono)
const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  service: 'voice',
  version: '2.0.0',
  pipeline: 'premium',
  timestamp: new Date().toISOString(),
}))

// Ready check (for load balancers)
app.get('/ready', (c) => c.json({ ready: true }))

/**
 * Twilio Voice Webhook - Called when a call comes in
 * Returns TwiML to answer and start media streaming
 */
app.post('/webhook/twilio/voice', async (c) => {
  const formData = await c.req.parseBody()
  
  const callSid = formData['CallSid'] as string
  const from = formData['From'] as string
  const to = formData['To'] as string
  const calledCity = formData['CalledCity'] as string
  
  console.log(`📞 Incoming call: ${callSid}`)
  console.log(`   From: ${from}`)
  console.log(`   To: ${to}`)
  console.log(`   City: ${calledCity || 'unknown'}`)
  
  // Look up business by phone number
  const businessConfig = await lookupBusinessByPhone(to)
  
  // Generate WebSocket URL for this call
  const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws'
  const wsHost = BASE_URL.replace(/^https?:\/\//, '')
  const streamUrl = `${wsProtocol}://${wsHost}/stream/${callSid}`
  
  // Add business context to stream URL as query params
  const streamUrlWithParams = `${streamUrl}?businessId=${businessConfig.businessId}&businessName=${encodeURIComponent(businessConfig.businessName)}&calendarConnectionId=${businessConfig.calendarConnectionId || ''}`
  
  // Generate TwiML to answer and start streaming
  const twiml = generateAnswerTwiML(streamUrlWithParams)
  
  console.log(`   Stream URL: ${streamUrlWithParams}`)
  
  c.header('Content-Type', 'application/xml')
  return c.body(twiml)
})

/**
 * Twilio Status Callback - Called when call status changes
 */
app.post('/webhook/twilio/status', async (c) => {
  const formData = await c.req.parseBody()
  
  const callSid = formData['CallSid'] as string
  const status = formData['CallStatus'] as string
  const duration = formData['CallDuration'] as string
  
  console.log(`📞 Call ${callSid} status: ${status}`)
  
  if (status === 'completed' && duration) {
    console.log(`   Duration: ${duration}s`)
    
    // Store call record in database
    await storeCallRecord(callSid, {
      status,
      duration: parseInt(duration),
      completedAt: new Date(),
    })
  }
  
  return c.json({ status: 'ok' })
})

/**
 * Phone number configuration endpoint
 * Used to configure which business handles calls for a number
 */
app.post('/api/configure-number', async (c) => {
  const body = await c.req.json()
  const { phoneNumber, businessId, webhookUrl } = body
  
  // In production, this would update the Twilio number configuration
  console.log(`🔧 Configuring ${phoneNumber} for business ${businessId}`)
  
  return c.json({ 
    success: true, 
    message: `Configured ${phoneNumber} for business ${businessId}`,
    webhookUrl: webhookUrl || `${BASE_URL}/webhook/twilio/voice`,
  })
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

// WebSocket Server for Twilio media streams
const wss = new WebSocketServer({ server: httpServer, path: '/stream' })

// Active voice pipelines (by call SID)
const activePipelines = new Map<string, WowVoicePipeline>()

wss.on('connection', (ws: WebSocket, req) => {
  // Parse URL to extract call ID and business config
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const callSid = pathParts[pathParts.length - 1] || 'unknown'
  
  // Get business config from query params (set in webhook)
  const businessId = url.searchParams.get('businessId') || 'default'
  const businessName = decodeURIComponent(url.searchParams.get('businessName') || 'Mi Negocio')
  const calendarConnectionId = url.searchParams.get('calendarConnectionId') || undefined
  
  console.log(`🔌 WebSocket connected for call: ${callSid}`)
  console.log(`   Business: ${businessName} (${businessId})`)
  console.log(`   Calendar: ${calendarConnectionId || 'not connected'}`)
  
  // Create premium voice pipeline
  const pipeline = new WowVoicePipeline({
    businessId,
    businessName,
    calendarConnectionId,
    calendarEnabled: !!calendarConnectionId,
    usePremiumLLM: true, // Use GPT-4o for best quality
    voiceId: 'lucia-spain', // Professional Spanish voice
  })
  
  activePipelines.set(callSid, pipeline)
  
  // Start the pipeline
  pipeline.start(ws)
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket closed for call: ${callSid}`)
    pipeline.stop()
    activePipelines.delete(callSid)
    
    // Log active calls
    console.log(`📊 Active calls: ${activePipelines.size}`)
  })
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for call ${callSid}:`, error)
    pipeline.stop()
    activePipelines.delete(callSid)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  
  // Close all active pipelines
  for (const [callSid, pipeline] of activePipelines) {
    console.log(`   Closing pipeline for ${callSid}`)
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
  console.log(`   WebSocket: ${BASE_URL.replace('http', 'ws')}/stream/{callSid}`)
  console.log(`   Webhook:   ${BASE_URL}/webhook/twilio/voice`)
  console.log('')
  console.log('📋 Pipeline Components:')
  console.log('   STT:  Deepgram Nova-2 (streaming)')
  console.log('   LLM:  GPT-4o (function calling)')
  console.log('   TTS:  ElevenLabs (natural Spanish)')
  console.log('')
  console.log('✅ Ready to receive calls!')
  console.log('')
})

/**
 * Look up business configuration by phone number
 * In production, this queries the database
 */
async function lookupBusinessByPhone(phoneNumber: string): Promise<{
  businessId: string
  businessName: string
  calendarConnectionId?: string
}> {
  // TODO: Query database for business by phone number
  // For now, return default config
  
  // Example database query:
  // const business = await db.query.businesses.findFirst({
  //   where: eq(businesses.phoneNumber, phoneNumber),
  //   with: { calendarIntegration: true },
  // })
  
  return {
    businessId: 'default',
    businessName: process.env.DEFAULT_BUSINESS_NAME || 'Mi Negocio',
    calendarConnectionId: process.env.DEFAULT_CALENDAR_CONNECTION_ID,
  }
}

/**
 * Store call record in database
 */
async function storeCallRecord(callSid: string, data: {
  status: string
  duration: number
  completedAt: Date
}): Promise<void> {
  // TODO: Store in database
  // await db.insert(calls).values({
  //   twilioCallSid: callSid,
  //   status: data.status,
  //   durationSeconds: data.duration,
  //   endedAt: data.completedAt,
  // })
  
  console.log(`💾 Call record: ${callSid} - ${data.duration}s`)
}
