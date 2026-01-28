#!/usr/bin/env bun
/**
 * Configure Twilio Phone Numbers for Voice Service
 * 
 * Usage:
 *   bun run scripts/configure-twilio.ts list
 *   bun run scripts/configure-twilio.ts configure <phone_number_sid> <webhook_url>
 *   bun run scripts/configure-twilio.ts buy <area_code>
 */

import twilio from 'twilio'
import 'dotenv/config'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

async function listNumbers() {
  console.log('\n📞 Your Twilio Phone Numbers:\n')
  
  const numbers = await client.incomingPhoneNumbers.list()
  
  if (numbers.length === 0) {
    console.log('   No phone numbers found.')
    console.log('   Use "buy" command to purchase a number.\n')
    return
  }
  
  for (const num of numbers) {
    console.log(`   ${num.phoneNumber}`)
    console.log(`   SID: ${num.sid}`)
    console.log(`   Voice URL: ${num.voiceUrl || '(not configured)'}`)
    console.log('')
  }
}

async function configureNumber(phoneNumberSid: string, webhookUrl?: string) {
  const voiceUrl = webhookUrl || `${BASE_URL}/webhook/twilio/voice`
  const statusUrl = webhookUrl 
    ? webhookUrl.replace('/voice', '/status')
    : `${BASE_URL}/webhook/twilio/status`
  
  console.log(`\n🔧 Configuring phone number ${phoneNumberSid}...`)
  console.log(`   Voice URL: ${voiceUrl}`)
  console.log(`   Status URL: ${statusUrl}`)
  
  try {
    const updated = await client.incomingPhoneNumbers(phoneNumberSid).update({
      voiceUrl,
      voiceMethod: 'POST',
      statusCallback: statusUrl,
      statusCallbackMethod: 'POST',
    })
    
    console.log(`\n✅ Configured successfully!`)
    console.log(`   Phone: ${updated.phoneNumber}`)
    console.log(`   Ready to receive calls.\n`)
  } catch (error) {
    console.error(`\n❌ Error configuring number:`, error)
    process.exit(1)
  }
}

async function buyNumber(areaCode?: string, country: string = 'ES') {
  console.log(`\n🔍 Searching for available numbers...`)
  console.log(`   Country: ${country}`)
  if (areaCode) console.log(`   Area code: ${areaCode}`)
  
  try {
    const available = await client.availablePhoneNumbers(country)
      .local
      .list({
        areaCode: areaCode ? parseInt(areaCode) : undefined,
        limit: 5,
      })
    
    if (available.length === 0) {
      console.log(`\n❌ No numbers available in ${country}`)
      console.log('   Try a different country code or area code.\n')
      return
    }
    
    console.log(`\n📱 Available numbers:\n`)
    available.forEach((num, i) => {
      console.log(`   ${i + 1}. ${num.phoneNumber} (${num.locality || num.region || 'Unknown'})`)
    })
    
    // Purchase the first one
    const chosen = available[0]
    console.log(`\n🛒 Purchasing ${chosen.phoneNumber}...`)
    
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: chosen.phoneNumber,
      voiceUrl: `${BASE_URL}/webhook/twilio/voice`,
      voiceMethod: 'POST',
    })
    
    console.log(`\n✅ Purchased and configured!`)
    console.log(`   Phone: ${purchased.phoneNumber}`)
    console.log(`   SID: ${purchased.sid}`)
    console.log(`   Voice URL: ${purchased.voiceUrl}`)
    console.log(`\n   Ready to receive calls!\n`)
    
  } catch (error) {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  }
}

// Main
const [command, ...args] = process.argv.slice(2)

switch (command) {
  case 'list':
    await listNumbers()
    break
    
  case 'configure':
    if (!args[0]) {
      console.error('Usage: configure <phone_number_sid> [webhook_url]')
      process.exit(1)
    }
    await configureNumber(args[0], args[1])
    break
    
  case 'buy':
    await buyNumber(args[0], args[1] || 'ES')
    break
    
  default:
    console.log(`
Voice Service - Twilio Configuration

Usage:
  bun run scripts/configure-twilio.ts <command> [options]

Commands:
  list                              List all your Twilio phone numbers
  configure <sid> [webhook_url]     Configure a phone number for the voice service
  buy [area_code] [country]         Purchase a new phone number (default: ES)

Examples:
  bun run scripts/configure-twilio.ts list
  bun run scripts/configure-twilio.ts configure PNxxxxx https://voice.example.com/webhook/twilio/voice
  bun run scripts/configure-twilio.ts buy 91 ES
`)
}
