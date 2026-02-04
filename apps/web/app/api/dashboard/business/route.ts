import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getBusinessByUserId, getUserSubscription } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [business, subscription] = await Promise.all([
      getBusinessByUserId(session.user.id),
      getUserSubscription(session.user.id)
    ])
    
    if (!business) {
      return NextResponse.json({
        business: null,
        subscription: null
      })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        website: business.website,
        phone: business.phone,
        timezone: business.timezone,
        whatsappConnected: !!business.whatsappPhoneNumberId,
        whatsappPhoneNumber: business.whatsappPhoneNumber,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
      } : {
        plan: 'starter',
        status: 'trialing',
      }
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    )
  }
}
