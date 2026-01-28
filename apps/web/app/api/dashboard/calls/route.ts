import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllCalls, getRecentCalls, getCallStats, getBusinessByUserId } from '@/lib/db/queries'

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
        calls: [],
        stats: { total: 0, appointments: 0, info: 0, attention: 0 }
      })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const filter = (searchParams.get('filter') as 'all' | 'appointment' | 'info' | 'transfer' | 'missed') || 'all'
    const recent = searchParams.get('recent') === 'true'

    if (recent) {
      const calls = await getRecentCalls(business.id, limit)
      return NextResponse.json({ calls })
    }

    const [calls, stats] = await Promise.all([
      getAllCalls(business.id, { limit, filter }),
      getCallStats(business.id)
    ])
    
    return NextResponse.json({ calls, stats })
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}
