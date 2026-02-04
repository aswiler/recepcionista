import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getInsightsData, getBusinessByUserId } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    const business = await getBusinessByUserId(session.user.id)
    
    if (!business) {
      return NextResponse.json({
        weeklyStats: [],
        hourlyDistribution: [],
        customerSentiment: { positive: 0, neutral: 100, negative: 0 },
        totalCalls: 0,
        appointmentsBooked: 0,
        conversionRate: 0,
        avgDuration: '0:00',
      })
    }

    const insights = await getInsightsData(business.id)
    
    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
