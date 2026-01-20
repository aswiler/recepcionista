import { NextRequest, NextResponse } from 'next/server'

/**
 * Create a Nango connect session token
 * POST /api/integrations/connect
 * 
 * Returns a session token that the frontend uses to open the OAuth popup
 */
export async function POST(request: NextRequest) {
  const { integrationId, businessId } = await request.json()
  
  if (!integrationId || !businessId) {
    return NextResponse.json(
      { error: 'integrationId and businessId are required' },
      { status: 400 }
    )
  }
  
  const secretKey = process.env.NANGO_SECRET_KEY
  
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Nango not configured. Add NANGO_SECRET_KEY to .env.local' },
      { status: 500 }
    )
  }
  
  try {
    // Create a connect session token using Nango API
    const response = await fetch('https://api.nango.dev/connect/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_user: {
          id: businessId,
          display_name: `Business ${businessId}`,
        },
        allowed_integrations: [integrationId],
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Nango session error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create session token' },
        { status: 500 }
      )
    }
    
    const result = await response.json()
    
    console.log('Nango session response:', JSON.stringify(result, null, 2))
    
    // Token is nested in data object
    const token = result.data?.token || result.token
    
    if (!token) {
      console.error('No token in Nango response:', result)
      return NextResponse.json(
        { error: 'No session token returned from Nango' },
        { status: 500 }
      )
    }
    
    // Return the connect URL with the session token
    const connectUrl = `https://connect.nango.dev/?session_token=${token}`
    
    return NextResponse.json({ 
      url: connectUrl,
      token,
      integrationId,
      businessId
    })
  } catch (error) {
    console.error('Error creating Nango session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
