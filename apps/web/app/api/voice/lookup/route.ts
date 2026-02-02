import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { phoneNumbers, businesses, calendarIntegrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Voice Service API - Lookup business by phone number
 * 
 * Called by the voice service when a call comes in to resolve
 * the phone number to a business configuration.
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
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    console.log(`📞 Looking up business for phone: ${phoneNumber}`)

    // Normalize phone number (remove spaces, ensure + prefix)
    const normalizedNumber = phoneNumber.replace(/\s/g, '')

    // Look up the phone number
    const phoneRecord = await db
      .select({
        phoneNumber: phoneNumbers,
        business: businesses,
      })
      .from(phoneNumbers)
      .innerJoin(businesses, eq(phoneNumbers.businessId, businesses.id))
      .where(
        and(
          eq(phoneNumbers.number, normalizedNumber),
          eq(phoneNumbers.isActive, true)
        )
      )
      .limit(1)

    if (phoneRecord.length === 0) {
      // Try without the + prefix
      const withoutPlus = normalizedNumber.replace(/^\+/, '')
      const withPlus = normalizedNumber.startsWith('+') ? normalizedNumber : `+${normalizedNumber}`
      
      const altRecord = await db
        .select({
          phoneNumber: phoneNumbers,
          business: businesses,
        })
        .from(phoneNumbers)
        .innerJoin(businesses, eq(phoneNumbers.businessId, businesses.id))
        .where(
          and(
            eq(phoneNumbers.isActive, true)
          )
        )
        .limit(100)
      
      // Find matching number with flexible format
      const match = altRecord.find(r => {
        const num = r.phoneNumber.number.replace(/\s/g, '').replace(/^\+/, '')
        return num === withoutPlus || r.phoneNumber.number === withPlus
      })

      if (!match) {
        console.log(`   ⚠️ Phone number not found: ${phoneNumber}`)
        return NextResponse.json({
          found: false,
          businessId: null,
          businessName: null,
          calendarConnectionId: null,
        })
      }

      // Found with alternative format
      const calendarConnection = await getCalendarConnection(match.business.id)
      
      console.log(`   ✅ Found: ${match.business.name} (${match.business.id})`)
      
      return NextResponse.json({
        found: true,
        businessId: match.business.id,
        businessName: match.business.name,
        calendarConnectionId: calendarConnection?.connectionId || null,
        phoneNumberId: match.phoneNumber.id,
        greeting: match.business.greeting,
        personality: match.business.personality,
        language: match.business.language,
        timezone: match.business.timezone,
      })
    }

    const { business, phoneNumber: phone } = phoneRecord[0]
    
    // Get calendar connection if any
    const calendarConnection = await getCalendarConnection(business.id)

    console.log(`   ✅ Found: ${business.name} (${business.id})`)

    return NextResponse.json({
      found: true,
      businessId: business.id,
      businessName: business.name,
      calendarConnectionId: calendarConnection?.connectionId || null,
      phoneNumberId: phone.id,
      greeting: business.greeting,
      personality: business.personality,
      language: business.language,
      timezone: business.timezone,
    })

  } catch (error) {
    console.error('Error looking up phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getCalendarConnection(businessId: string) {
  const connections = await db
    .select()
    .from(calendarIntegrations)
    .where(
      and(
        eq(calendarIntegrations.businessId, businessId),
        eq(calendarIntegrations.isActive, true)
      )
    )
    .limit(1)

  return connections[0] || null
}
