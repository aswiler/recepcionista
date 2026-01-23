import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businesses, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const PHONE_NUMBER_ID = process.env.whatsappPhoneNumberId || '931277210074180'
const PHONE_NUMBER = process.env.whatsappPhoneNumber || '+34 936 09 62 40'

/**
 * Setup endpoint to connect WhatsApp to a business
 * POST /api/whatsapp/setup
 * 
 * This creates/updates a demo business with your WhatsApp connection
 */
export async function POST(request: NextRequest) {
  try {
    // Get or create a demo user
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
    
    // Get or create demo business
    let [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, 'demo_business'))
      .limit(1)
    
    if (!business) {
      const [newBusiness] = await db.insert(businesses).values({
        id: 'demo_business',
        userId: user.id,
        name: 'Demo Business',
        description: 'Demo business for WhatsApp testing',
        language: 'es',
        timezone: 'Europe/Madrid',
        whatsappPhoneNumberId: PHONE_NUMBER_ID,
        whatsappPhoneNumber: PHONE_NUMBER,
        whatsappConnectedAt: new Date(),
      }).returning()
      business = newBusiness
    } else {
      // Update existing business with WhatsApp connection
      const [updatedBusiness] = await db.update(businesses)
        .set({
          whatsappPhoneNumberId: PHONE_NUMBER_ID,
          whatsappPhoneNumber: PHONE_NUMBER,
          whatsappConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, 'demo_business'))
        .returning()
      business = updatedBusiness
    }
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp connected to business',
      business: {
        id: business.id,
        name: business.name,
        whatsappPhoneNumberId: business.whatsappPhoneNumberId,
        whatsappPhoneNumber: business.whatsappPhoneNumber,
      }
    })
  } catch (error) {
    console.error('[WhatsApp Setup] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup WhatsApp',
        details: String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check setup status
 */
export async function GET() {
  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, 'demo_business'))
      .limit(1)
    
    if (!business) {
      return NextResponse.json({
        setup: false,
        message: 'Business not found. Run POST /api/whatsapp/setup to create it.'
      })
    }
    
    return NextResponse.json({
      setup: true,
      business: {
        id: business.id,
        name: business.name,
        whatsappPhoneNumberId: business.whatsappPhoneNumberId,
        whatsappPhoneNumber: business.whatsappPhoneNumber,
        whatsappConnectedAt: business.whatsappConnectedAt,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
