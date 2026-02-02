#!/usr/bin/env bun
/**
 * Verify Voice Service Deployment
 * 
 * Usage:
 *   bun run scripts/verify-deployment.ts <your-railway-url>
 * 
 * Example:
 *   bun run scripts/verify-deployment.ts https://voice-xyz.up.railway.app
 */

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:3001'

console.log('\n🔍 Verifying Voice Service Deployment\n')
console.log(`   URL: ${BASE_URL}\n`)

// Test health endpoint
console.log('1️⃣  Testing health endpoint...')
try {
  const healthRes = await fetch(`${BASE_URL}/health`)
  const health = await healthRes.json()
  
  if (health.status === 'ok' && health.provider === 'telnyx') {
    console.log('   ✅ Health check passed')
    console.log(`   Service: ${health.service}`)
    console.log(`   Version: ${health.version}`)
    console.log(`   Provider: ${health.provider}`)
    console.log(`   Pipeline: ${health.pipeline}\n`)
  } else {
    console.log('   ⚠️  Health check returned unexpected response')
    console.log(`   Response:`, health)
  }
} catch (error) {
  console.log('   ❌ Health check failed')
  console.log(`   Error: ${error}\n`)
  process.exit(1)
}

// Test ready endpoint
console.log('2️⃣  Testing ready endpoint...')
try {
  const readyRes = await fetch(`${BASE_URL}/ready`)
  const ready = await readyRes.json()
  
  if (ready.ready === true) {
    console.log('   ✅ Ready check passed\n')
  } else {
    console.log('   ⚠️  Ready check returned unexpected response')
    console.log(`   Response:`, ready)
  }
} catch (error) {
  console.log('   ❌ Ready check failed')
  console.log(`   Error: ${error}\n`)
}

// Test webhook endpoint (should return error for GET, but endpoint exists)
console.log('3️⃣  Testing webhook endpoint...')
try {
  const webhookRes = await fetch(`${BASE_URL}/webhook/telnyx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  })
  
  // Should return some response (even if error, endpoint exists)
  const status = webhookRes.status
  if (status === 200 || status === 400 || status === 500) {
    console.log(`   ✅ Webhook endpoint exists (status: ${status})`)
  } else {
    console.log(`   ⚠️  Unexpected status: ${status}`)
  }
} catch (error) {
  console.log('   ❌ Webhook endpoint test failed')
  console.log(`   Error: ${error}`)
}

// Check active calls
console.log('\n4️⃣  Checking active calls endpoint...')
try {
  const callsRes = await fetch(`${BASE_URL}/api/calls`)
  const calls = await callsRes.json()
  
  console.log(`   ✅ Active calls endpoint working`)
  console.log(`   Current active calls: ${calls.count || 0}\n`)
} catch (error) {
  console.log('   ❌ Active calls endpoint failed')
  console.log(`   Error: ${error}\n`)
}

console.log('✅ Deployment verification complete!\n')
console.log('📋 Next Steps:')
console.log('   1. Go to Telnyx portal → Voice → Your Application')
console.log(`   2. Set Webhook URL to: ${BASE_URL}/webhook/telnyx`)
console.log('   3. Make sure Webhook API Version is set to "API v2"')
console.log('   4. Link a phone number to your application')
console.log('   5. Make a test call!\n')
