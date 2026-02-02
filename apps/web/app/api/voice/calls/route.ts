import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calls } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

/**
 * Voice Service API - Store call records
 * 
 * Called by the voice service when a call ends to store the
 * call record in the database.
 * 
 * Security: Uses API key authentication (VOICE_SERVICE_API_KEY)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.VOICE_SERVICE_API_KEY
    
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      externalId,
      businessId,
      phoneNumberId,
      from,
      to,
      duration,
      status = 'completed',
      transcript,
      summary,
      sentiment,
      transferredToHuman = false,
    } = body

    // Validate required fields
    if (!businessId || !from || !to) {
      return NextResponse.json(
        { error: 'businessId, from, and to are required' },
        { status: 400 }
      )
    }

    console.log(`💾 Storing call record: ${externalId || 'no-external-id'}`)
    console.log(`   Business: ${businessId}`)
    console.log(`   From: ${from} → To: ${to}`)
    console.log(`   Duration: ${duration}s`)

    // Generate a unique ID for the call
    const callId = `call_${randomUUID()}`

    // Insert the call record
    await db.insert(calls).values({
      id: callId,
      businessId,
      phoneNumberId: phoneNumberId || null,
      externalId: externalId || null,
      from,
      to,
      direction: 'inbound',
      status,
      duration: duration || null,
      transcript: transcript || null,
      summary: summary || null,
      sentiment: sentiment || null,
      transferredToHuman,
    })

    console.log(`   ✅ Call stored: ${callId}`)

    return NextResponse.json({
      success: true,
      callId,
    })

  } catch (error) {
    console.error('Error storing call record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update an existing call record
 * Used to add transcript, summary, or sentiment after the call
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.VOICE_SERVICE_API_KEY
    
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      callId,
      externalId,
      transcript,
      summary,
      sentiment,
      transferredToHuman,
    } = body

    if (!callId && !externalId) {
      return NextResponse.json(
        { error: 'callId or externalId is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Updating call record: ${callId || externalId}`)

    // Build update object with only provided fields
    const updates: Record<string, any> = {}
    if (transcript !== undefined) updates.transcript = transcript
    if (summary !== undefined) updates.summary = summary
    if (sentiment !== undefined) updates.sentiment = sentiment
    if (transferredToHuman !== undefined) updates.transferredToHuman = transferredToHuman

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update by callId or externalId
    // Note: Using raw SQL for flexibility
    const { eq } = await import('drizzle-orm')
    
    if (callId) {
      await db
        .update(calls)
        .set(updates)
        .where(eq(calls.id, callId))
    } else {
      await db
        .update(calls)
        .set(updates)
        .where(eq(calls.externalId, externalId))
    }

    console.log(`   ✅ Call updated`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating call record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
