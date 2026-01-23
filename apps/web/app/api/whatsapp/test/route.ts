import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.whatsappPhoneNumberId || '931277210074180'

/**
 * Test endpoint to send WhatsApp template message
 * POST /api/whatsapp/test
 * 
 * Body: { "to": "34688332252" } (optional, defaults to test number)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const to = body.to || '34688332252' // Default test number from Meta
    
    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'WHATSAPP_ACCESS_TOKEN not configured' },
        { status: 500 }
      )
    }
    
    if (!PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: 'whatsappPhoneNumberId not configured' },
        { status: 500 }
      )
    }
    
    // Send hello_world template (Meta's test template)
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('[WhatsApp Test] Error:', data)
      return NextResponse.json(
        { 
          error: 'Failed to send template',
          details: data 
        },
        { status: response.status }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template sent successfully',
      messageId: data.messages?.[0]?.id,
      to,
      phoneNumberId: PHONE_NUMBER_ID
    })
  } catch (error) {
    console.error('[WhatsApp Test] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for quick testing
 * GET /api/whatsapp/test?to=34688332252
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const to = searchParams.get('to') || '34688332252'
  
  // Convert GET to POST by calling POST handler
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ to }),
    headers: { 'Content-Type': 'application/json' }
  })
  
  return POST(postRequest)
}
