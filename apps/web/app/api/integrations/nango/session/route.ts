import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken } from '@/lib/integrations/nango'

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
    const token = await createSessionToken({
      endUserId: businessId, // Use businessId as end user ID
      allowedIntegrations: [integrationId], // e.g., 'google-calendar'
    })

    return NextResponse.json({ sessionToken: token })
  } catch (error) {
    console.error('Error creating session token:', error)
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    )
  }
}
