import { NextRequest, NextResponse } from 'next/server'
import { createConnectSession } from '@/lib/integrations/nango'

/**
 * Create a Nango session token for OAuth flow
 * POST /api/integrations/nango/session
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, integrationId } = await request.json()

    if (!businessId || !integrationId) {
      return NextResponse.json(
        { error: 'businessId and integrationId are required' },
        { status: 400 }
      )
    }

    // Create session token
    const result = await createConnectSession({
      endUserId: businessId, // Use businessId as end user ID
      integrationId: integrationId, // e.g., 'google-calendar'
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create session token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessionToken: result.token, url: result.url })
  } catch (error) {
    console.error('Error creating session token:', error)
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    )
  }
}
