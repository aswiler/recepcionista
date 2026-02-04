import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCalendarIntegrations, getBusinessByUserId } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { calendarIntegrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * List calendar integrations for a business
 * GET /api/integrations/calendar
 * 
 * Gets businessId from authenticated session for security
 * Returns both database records and live status from Nango
 */
export async function GET(request: NextRequest) {
  // Get businessId from authenticated session
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const business = await getBusinessByUserId(session.user.id)
  if (!business) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 })
  }
  
  const businessId = business.id
  
  try {
    // First, get integrations from our database
    const dbIntegrations = await getCalendarIntegrations(businessId)
    
    // If Nango is configured, verify connections are still valid
    const secretKey = process.env.NANGO_SECRET_KEY
    
    if (secretKey && dbIntegrations.length > 0) {
      // Fetch connection details from Nango to verify status
      const response = await fetch('https://api.nango.dev/connection', {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const nangoConnections = data.connections || []
        
        // Map database records with Nango status
        const enrichedConnections = dbIntegrations.map(dbInt => {
          const nangoConn = nangoConnections.find(
            (c: { connection_id: string; provider_config_key: string }) => 
              c.connection_id === dbInt.connectionId && 
              c.provider_config_key === dbInt.integrationId
          )
          
          return {
            ...dbInt,
            integration_id: dbInt.integrationId,
            connection_id: dbInt.connectionId,
            provider: dbInt.provider,
            isActive: dbInt.isActive && !!nangoConn,
            created_at: dbInt.createdAt?.toISOString(),
            nangoStatus: nangoConn ? 'connected' : 'disconnected',
          }
        })
        
        return NextResponse.json({ connections: enrichedConnections })
      }
    }
    
    // Return database records if Nango verification fails
    const connections = dbIntegrations.map(dbInt => ({
      ...dbInt,
      integration_id: dbInt.integrationId,
      connection_id: dbInt.connectionId,
      provider: dbInt.provider,
      created_at: dbInt.createdAt?.toISOString(),
    }))
    
    return NextResponse.json({ connections })
    
  } catch (error) {
    console.error('Error fetching calendar integrations:', error)
    return NextResponse.json({ connections: [] })
  }
}

/**
 * Delete a calendar integration
 * DELETE /api/integrations/calendar?integrationId=xxx&connectionId=xxx
 * 
 * Gets businessId from authenticated session for security
 * Removes the connection from both Nango and our database
 */
export async function DELETE(request: NextRequest) {
  // Get businessId from authenticated session
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const business = await getBusinessByUserId(session.user.id)
  if (!business) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 })
  }
  
  const integrationId = request.nextUrl.searchParams.get('integrationId')
  const connectionId = request.nextUrl.searchParams.get('connectionId')
  
  if (!integrationId || !connectionId) {
    return NextResponse.json(
      { error: 'integrationId and connectionId required' },
      { status: 400 }
    )
  }
  
  const secretKey = process.env.NANGO_SECRET_KEY
  
  try {
    // Delete from Nango if configured
    if (secretKey) {
      const response = await fetch(
        `https://api.nango.dev/connection/${connectionId}?provider_config_key=${integrationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
          },
        }
      )
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Nango delete error:', error)
        // Continue to deactivate in our database anyway
      }
    }
    
    // Mark as inactive in our database (only if it belongs to this business)
    await db
      .update(calendarIntegrations)
      .set({ isActive: false })
      .where(
        and(
          eq(calendarIntegrations.connectionId, connectionId),
          eq(calendarIntegrations.businessId, business.id)
        )
      )
    
    console.log(`🗑️ Calendar integration deleted: ${connectionId}`)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
  }
}
