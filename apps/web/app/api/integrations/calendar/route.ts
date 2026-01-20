import { NextRequest, NextResponse } from 'next/server'

// In production, you'd use Nango SDK here
// For now, we'll return mock data or use Nango if configured

/**
 * List calendar integrations
 * GET /api/integrations/calendar?businessId=xxx
 */
export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }
  
  // If Nango is configured, list real connections
  const secretKey = process.env.NANGO_SECRET_KEY
  
  if (secretKey) {
    try {
      // Use Nango API directly
      const response = await fetch('https://api.nango.dev/connection', {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filter connections for this business
        const businessConnections = data.connections?.filter(
          (c: { connection_id: string }) => c.connection_id === businessId
        ) || []
        
        return NextResponse.json({ connections: businessConnections })
      }
    } catch (error) {
      console.error('Error fetching from Nango:', error)
    }
  }
  
  // Return empty if not configured
  return NextResponse.json({ connections: [] })
}

/**
 * Delete a calendar integration
 * DELETE /api/integrations/calendar?integrationId=xxx&connectionId=xxx
 */
export async function DELETE(request: NextRequest) {
  const integrationId = request.nextUrl.searchParams.get('integrationId')
  const connectionId = request.nextUrl.searchParams.get('connectionId')
  
  if (!integrationId || !connectionId) {
    return NextResponse.json(
      { error: 'integrationId and connectionId required' },
      { status: 400 }
    )
  }
  
  const secretKey = process.env.NANGO_SECRET_KEY
  
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Nango not configured' },
      { status: 500 }
    )
  }
  
  try {
    const response = await fetch(
      `https://api.nango.dev/connection/${connectionId}?provider_config_key=${integrationId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      }
    )
    
    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const error = await response.text()
      console.error('Nango delete error:', error)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
  }
}
