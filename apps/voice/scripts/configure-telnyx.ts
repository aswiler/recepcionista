#!/usr/bin/env bun
/**
 * Configure Telnyx Phone Numbers for Voice Service
 * 
 * Usage:
 *   bun run scripts/configure-telnyx.ts list
 *   bun run scripts/configure-telnyx.ts search [country_code]
 *   bun run scripts/configure-telnyx.ts configure <phone_number_id> <connection_id>
 */

import Telnyx from 'telnyx'
import 'dotenv/config'

const telnyx = new Telnyx(process.env.TELNYX_API_KEY!)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

async function listNumbers() {
  console.log('\n📞 Your Telnyx Phone Numbers:\n')
  
  try {
    const numbers = await telnyx.phoneNumbers.list({
      page: { size: 100 },
    })
    
    if (numbers.data.length === 0) {
      console.log('   No phone numbers found.')
      console.log('   Use "search" command to find available numbers.\n')
      return
    }
    
    for (const num of numbers.data as any[]) {
      console.log(`   ${num.phone_number}`)
      console.log(`   ID: ${num.id}`)
      console.log(`   Status: ${num.status}`)
      console.log(`   Connection: ${num.connection_id || '(not configured)'}`)
      console.log('')
    }
  } catch (error) {
    console.error('Error listing numbers:', error)
  }
}

async function listConnections() {
  console.log('\n🔌 Your Telnyx Connections:\n')
  
  try {
    const connections = await telnyx.connections.list({
      page: { size: 100 },
    })
    
    if (connections.data.length === 0) {
      console.log('   No connections found.')
      console.log('   Create a "Programmable Voice" connection in the Telnyx portal.\n')
      return
    }
    
    for (const conn of connections.data as any[]) {
      console.log(`   ${conn.connection_name || conn.id}`)
      console.log(`   ID: ${conn.id}`)
      console.log(`   Type: ${conn.connection_type}`)
      console.log(`   Active: ${conn.active}`)
      console.log('')
    }
  } catch (error) {
    console.error('Error listing connections:', error)
  }
}

async function searchNumbers(countryCode: string = 'ES') {
  console.log(`\n🔍 Searching for available numbers in ${countryCode}...\n`)
  
  try {
    const numbers = await telnyx.availablePhoneNumbers.list({
      filter: {
        country_code: countryCode,
        features: ['voice'],
        limit: 10,
      },
    })
    
    if (numbers.data.length === 0) {
      console.log(`   No numbers available in ${countryCode}`)
      console.log('   Try a different country code.\n')
      return
    }
    
    console.log('   Available numbers:\n')
    for (const num of numbers.data as any[]) {
      console.log(`   ${num.phone_number}`)
      console.log(`   Region: ${num.region_information?.[0]?.region_name || 'Unknown'}`)
      console.log(`   Type: ${num.phone_number_type}`)
      console.log(`   Features: ${num.features?.join(', ') || 'voice'}`)
      console.log('')
    }
    
    console.log('   To purchase, use the Telnyx portal or API.\n')
  } catch (error) {
    console.error('Error searching numbers:', error)
  }
}

async function configureNumber(phoneNumberId: string, connectionId: string) {
  console.log(`\n🔧 Configuring phone number ${phoneNumberId}...`)
  console.log(`   Connection ID: ${connectionId}`)
  
  try {
    await telnyx.phoneNumbers.update(phoneNumberId, {
      connection_id: connectionId,
    })
    
    console.log(`\n✅ Configured successfully!`)
    console.log(`   The number is now linked to your voice connection.`)
    console.log(`\n   Make sure your connection webhook is set to:`)
    console.log(`   ${BASE_URL}/webhook/telnyx\n`)
  } catch (error) {
    console.error('\n❌ Error configuring number:', error)
    process.exit(1)
  }
}

// Main
const [command, ...args] = process.argv.slice(2)

switch (command) {
  case 'list':
    await listNumbers()
    await listConnections()
    break
    
  case 'search':
    await searchNumbers(args[0] || 'ES')
    break
    
  case 'configure':
    if (!args[0] || !args[1]) {
      console.error('Usage: configure <phone_number_id> <connection_id>')
      process.exit(1)
    }
    await configureNumber(args[0], args[1])
    break
    
  default:
    console.log(`
Voice Service - Telnyx Configuration

Usage:
  bun run scripts/configure-telnyx.ts <command> [options]

Commands:
  list                                    List all your phone numbers and connections
  search [country_code]                   Search for available numbers (default: ES)
  configure <phone_id> <connection_id>    Link a phone number to a connection

Examples:
  bun run scripts/configure-telnyx.ts list
  bun run scripts/configure-telnyx.ts search ES
  bun run scripts/configure-telnyx.ts search US
  bun run scripts/configure-telnyx.ts configure 1234567890 abc-123-def

Setup Steps:
  1. Create a "Programmable Voice" application in Telnyx portal
  2. Set the webhook URL to: ${BASE_URL}/webhook/telnyx
  3. Purchase a phone number
  4. Link the number to your application using 'configure' command
`)
}
