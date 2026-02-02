import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDashboardStats, getBusinessByUserId } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    const business = await getBusinessByUserId(session.user.id)
    
    if (!business) {
      // Return empty stats if no business exists yet
      return NextResponse.json({
        totalCalls: 0,
        callsChange: 0,
        appointmentsBooked: 0,
        appointmentsChange: 0,
        avgCallDuration: '0:00',
        durationChange: 0,
        missedCalls: 0,
        missedChange: 0,
      })
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const dateRange = (searchParams.get('range') as 'today' | 'week' | 'month') || 'week'

    const stats = await getDashboardStats(business.id, dateRange)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
