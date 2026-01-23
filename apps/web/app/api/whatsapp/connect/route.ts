import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businesses, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Connect WhatsApp Business number to a business
 * POST /api/whatsapp/connect
 * 
 * For MVP: Manual entry of phone number ID
 * Later: Meta Embedded Signup will automate this
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, phoneNumberId, phoneNumber } = body
    
    if (!businessId || !phoneNumberId) {
      return NextResponse.json(
        { error: 'businessId and phoneNumberId required' },
        { status: 400 }
      )
    }
    
    // Check if business exists
    const [existingBusiness] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1)
    
    if (!existingBusiness) {
      // Create demo user if needed
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, 'demo-user-1'))
        .limit(1)
      
      if (!user) {
        const [newUser] = await db.insert(users).values({
          id: 'demo-user-1',
          email: 'demo@recepcionista.com',
          name: 'Demo User',
        }).returning()
        user = newUser
      }
      
      // Create business with WhatsApp connection
      const [newBusiness] = await db.insert(businesses).values({
        id: businessId,
        userId: user.id,
        name: 'Demo Business',
        description: 'Demo business for WhatsApp testing',
        language: 'es',
        timezone: 'Europe/Madrid',
        whatsappPhoneNumberId: phoneNumberId,
        whatsappPhoneNumber: phoneNumber || null,
        whatsappConnectedAt: new Date(),
      }).returning()
      
      return NextResponse.json({ 
        success: true,
        message: 'Business created and WhatsApp connected successfully',
        business: {
          id: newBusiness.id,
          whatsappPhoneNumberId: newBusiness.whatsappPhoneNumberId,
        }
      })
    }
    
    // Update existing business with WhatsApp connection
    await db.update(businesses)
      .set({
        whatsappPhoneNumberId: phoneNumberId,
        whatsappPhoneNumber: phoneNumber || null,
        whatsappConnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId))
    
    return NextResponse.json({ 
      success: true,
      message: 'WhatsApp connected successfully'
    })
  } catch (error) {
    console.error('[WhatsApp] Connect error:', error)
    return NextResponse.json(
      { error: 'Failed to connect WhatsApp', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint - Auto-connect or show status
 * GET /api/whatsapp/connect?businessId=demo_business
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId') || 'demo_business'
    const autoConnect = searchParams.get('auto') !== 'false' // Default to true
    
    // Check if business exists and is connected
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1)
    
    if (business && business.whatsappPhoneNumberId) {
      // Already connected - show status
      return NextResponse.json({
        status: 'connected',
        business: {
          id: business.id,
          name: business.name,
          whatsappPhoneNumberId: business.whatsappPhoneNumberId,
          whatsappPhoneNumber: business.whatsappPhoneNumber,
          whatsappConnectedAt: business.whatsappConnectedAt,
        },
        message: 'WhatsApp is already connected!'
      })
    }
    
    // Auto-connect if enabled
    if (autoConnect) {
      const phoneNumberId = process.env.whatsappPhoneNumberId || '931277210074180'
      const phoneNumber = process.env.whatsappPhoneNumber || '+34 936 09 62 40'
      
      // Create a POST request internally
      const postRequest = new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({
          businessId,
          phoneNumberId,
          phoneNumber,
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      return POST(postRequest)
    }
    
    // Not connected and auto-connect disabled
    return NextResponse.json({
      status: 'not_connected',
      businessId,
      message: 'WhatsApp not connected. Add ?auto=true to auto-connect, or use POST method.',
      instructions: 'Visit this URL with ?auto=true or use POST /api/whatsapp/connect'
    })
  } catch (error) {
    console.error('[WhatsApp] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to check WhatsApp connection', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Disconnect WhatsApp from a business
 * DELETE /api/whatsapp/connect
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId required' },
        { status: 400 }
      )
    }
    
    // Remove WhatsApp connection
    await db.update(businesses)
      .set({
        whatsappPhoneNumberId: null,
        whatsappPhoneNumber: null,
        whatsappConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId))
    
    return NextResponse.json({ 
      success: true,
      message: 'WhatsApp disconnected'
    })
  } catch (error) {
    console.error('[WhatsApp] Disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect WhatsApp' },
      { status: 500 }
    )
  }
}
