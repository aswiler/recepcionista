import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { businesses, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Initiate a test call to the user's phone
 * This allows users to experience their AI receptionist firsthand
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { phoneNumber, businessId } = body
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Se requiere un número de teléfono' },
        { status: 400 }
      )
    }
    
    // Validate phone number format (basic validation)
    const cleanedPhone = phoneNumber.replace(/\s+/g, '').replace(/[()-]/g, '')
    if (!cleanedPhone.match(/^\+?[0-9]{9,15}$/)) {
      return NextResponse.json(
        { error: 'Formato de teléfono inválido. Usa formato internacional (+34612345678)' },
        { status: 400 }
      )
    }
    
    // Ensure phone has country code
    let formattedPhone = cleanedPhone
    if (!formattedPhone.startsWith('+')) {
      // Assume Spain if no country code
      formattedPhone = '+34' + formattedPhone
    }
    
    // Get business info
    let business = null
    
    if (businessId) {
      // Use provided business ID
      const results = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1)
      business = results[0]
    } else {
      // Find user by email first, then get their business
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1)
      
      const user = userResults[0]
      if (user) {
        const businessResults = await db
          .select()
          .from(businesses)
          .where(eq(businesses.userId, user.id))
          .limit(1)
        business = businessResults[0]
      }
    }
    
    if (!business) {
      return NextResponse.json(
        { error: 'No se encontró tu negocio. Completa el onboarding primero.' },
        { status: 404 }
      )
    }
    
    // Check voice service configuration
    const voiceServiceUrl = process.env.VOICE_SERVICE_URL
    const voiceServiceApiKey = process.env.VOICE_SERVICE_API_KEY
    
    if (!voiceServiceUrl) {
      console.error('VOICE_SERVICE_URL not configured')
      return NextResponse.json(
        { 
          error: 'El servicio de voz no está configurado',
          details: 'Contacta con soporte técnico'
        },
        { status: 503 }
      )
    }
    
    console.log(`📞 Test call requested`)
    console.log(`   Business: ${business.name} (${business.id})`)
    console.log(`   Phone: ${formattedPhone}`)
    console.log(`   Voice Service: ${voiceServiceUrl}`)
    
    // Call the voice service to initiate outbound call
    const response = await fetch(`${voiceServiceUrl}/api/outbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': voiceServiceApiKey || '',
      },
      body: JSON.stringify({
        businessId: business.id,
        customerPhone: formattedPhone,
        reason: 'Test call from dashboard',
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Voice service error: ${response.status} - ${errorText}`)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Error de autenticación con el servicio de voz' },
          { status: 500 }
        )
      }
      
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'El negocio no tiene un número de teléfono configurado para realizar llamadas' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'No se pudo iniciar la llamada. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Test call initiated: ${result.callControlId}`)
      return NextResponse.json({
        success: true,
        message: '¡Llamada iniciada! Recibirás una llamada en unos segundos.',
        callId: result.callControlId,
      })
    } else {
      console.error(`Voice service returned failure:`, result)
      return NextResponse.json(
        { error: result.message || 'No se pudo iniciar la llamada' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Test call error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * Check if test call is available
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ available: false, reason: 'not_authenticated' })
    }
    
    // Check if voice service is configured
    const voiceServiceUrl = process.env.VOICE_SERVICE_URL
    
    if (!voiceServiceUrl) {
      return NextResponse.json({ 
        available: false, 
        reason: 'voice_service_not_configured',
        message: 'El servicio de voz no está configurado'
      })
    }
    
    // Find user by email first, then get their business
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)
    
    const user = userResults[0]
    let business = null
    
    if (user) {
      const businessResults = await db
        .select()
        .from(businesses)
        .where(eq(businesses.userId, user.id))
        .limit(1)
      business = businessResults[0]
    }
    
    if (!business) {
      return NextResponse.json({ 
        available: false, 
        reason: 'no_business',
        message: 'Completa el onboarding primero'
      })
    }
    
    // Check if voice service is healthy
    try {
      const healthCheck = await fetch(`${voiceServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      
      if (!healthCheck.ok) {
        return NextResponse.json({ 
          available: false, 
          reason: 'voice_service_unhealthy',
          message: 'El servicio de voz no está disponible'
        })
      }
    } catch {
      return NextResponse.json({ 
        available: false, 
        reason: 'voice_service_unreachable',
        message: 'No se puede conectar con el servicio de voz'
      })
    }
    
    return NextResponse.json({ 
      available: true,
      businessId: business.id,
      businessName: business.name,
    })
    
  } catch (error) {
    console.error('Test call check error:', error)
    return NextResponse.json({ available: false, reason: 'error' })
  }
}
