import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calendarIntegrations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Handle Nango webhooks
 * POST /api/integrations/nango/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle connection creation
    if (body.type === 'auth' && body.operation === 'creation' && body.success) {
      const { connectionId, endUser, integrationId } = body

      if (!connectionId || !endUser?.endUserId || !integrationId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const businessId = endUser.endUserId

      // Check if connection already exists
      const existing = await db
        .select()
        .from(calendarIntegrations)
        .where(eq(calendarIntegrations.connectionId, connectionId))
        .limit(1)

      if (existing.length === 0) {
        // Create new calendar integration record
        await db.insert(calendarIntegrations).values({
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          businessId,
          provider: integrationId, // e.g., 'google-calendar'
          connectionId,
          integrationId,
          isActive: true,
        })

        console.log(`✅ Calendar integration created: ${connectionId} for business ${businessId}`)
      }
    }

    // Handle connection deletion
    if (body.type === 'auth' && body.operation === 'deletion') {
      const { connectionId } = body

      if (connectionId) {
        await db
          .update(calendarIntegrations)
          .set({ isActive: false })
          .where(eq(calendarIntegrations.connectionId, connectionId))

        console.log(`🗑️ Calendar integration deactivated: ${connectionId}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling Nango webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
