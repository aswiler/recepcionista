import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
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
    
    // Update business with WhatsApp connection
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
      { error: 'Failed to connect WhatsApp' },
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
