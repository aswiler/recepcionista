/**
 * Voice Service - Real-time voice AI pipeline
 * 
 * Handles:
 * - Telnyx webhook for incoming calls
 * - WebSocket for audio streaming
 * - Deepgram STT → Groq LLM → Cartesia TTS pipeline
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { VoicePipeline } from './pipeline/orchestrator'
import { handleTelnyxWebhook } from './telephony/webhook'

// Environment
import 'dotenv/config'

const PORT = process.env.PORT || 3001

// HTTP Server (Hono)
const app = new Hono()

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'voice' }))

// Telnyx webhooks
app.post('/webhook/telnyx', async (c) => {
  const body = await c.req.json()
  const response = await handleTelnyxWebhook(body)
  return c.json(response)
})

// Create HTTP server
const server = createServer(app.fetch as any)

// WebSocket Server for audio streaming
const wss = new WebSocketServer({ server, path: '/stream' })

// Active voice pipelines
const activePipelines = new Map<string, VoicePipeline>()

wss.on('connection', (ws: WebSocket, req) => {
  // Extract call ID from URL path
  const callId = req.url?.split('/').pop() || 'unknown'
  
  console.log(`WebSocket connected for call: ${callId}`)
  
  // Get business ID from call metadata (you'd look this up)
  const businessId = 'default' // Replace with actual lookup
  const businessName = 'Mi Negocio'
  
  // Create voice pipeline
  const pipeline = new VoicePipeline(businessId, businessName)
  activePipelines.set(callId, pipeline)
  
  // Start the pipeline
  pipeline.start(ws)
  
  ws.on('close', () => {
    console.log(`WebSocket closed for call: ${callId}`)
    pipeline.stop()
    activePipelines.delete(callId)
  })
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for call ${callId}:`, error)
    pipeline.stop()
    activePipelines.delete(callId)
  })
})

// Start server
serve({
  fetch: app.fetch,
  port: Number(PORT),
}, (info) => {
  console.log(`🎤 Voice service running on http://localhost:${info.port}`)
  console.log(`   WebSocket: ws://localhost:${info.port}/stream/{callId}`)
  console.log(`   Webhook: http://localhost:${info.port}/webhook/telnyx`)
})
