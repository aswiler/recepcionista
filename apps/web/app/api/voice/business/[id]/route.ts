import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businesses, phoneNumbers, calendarIntegrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Voice Service API - Get business by ID
 * 
 * Returns business info including their voice phone number
 * for outbound calls (WhatsApp → Voice transfer)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.VOICE_SERVICE_API_KEY
    
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = params.id

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Looking up business: ${businessId}`)

    // Get business
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1)

    if (!business) {
      console.log(`   ⚠️ Business not found: ${businessId}`)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get their voice phone number
    const [voiceNumber] = await db
      .select()
      .from(phoneNumbers)
      .where(
        and(
          eq(phoneNumbers.businessId, businessId),
          eq(phoneNumbers.isActive, true)
        )
      )
      .limit(1)

    // Get calendar connection
    const [calendarConnection] = await db
      .select()
      .from(calendarIntegrations)
      .where(
        and(
          eq(calendarIntegrations.businessId, businessId),
          eq(calendarIntegrations.isActive, true)
        )
      )
      .limit(1)

    console.log(`   ✅ Found: ${business.name}`)
    console.log(`   Phone: ${voiceNumber?.number || 'none'}`)

    return NextResponse.json({
      id: business.id,
      name: business.name,
      phoneNumber: voiceNumber?.number || null,
      phoneNumberId: voiceNumber?.id || null,
      calendarConnectionId: calendarConnection?.connectionId || null,
      greeting: business.greeting,
      personality: business.personality,
      language: business.language,
      timezone: business.timezone,
    })

  } catch (error) {
    console.error('Error looking up business:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
