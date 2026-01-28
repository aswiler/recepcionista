import { NextRequest, NextResponse } from 'next/server'
import { checkAvailability } from '@/lib/integrations/calendar'
import { getCalendarIntegration } from '@/lib/db/queries'

/**
 * Check calendar availability for a specific date
 * POST /api/calendar/availability
 * 
 * Body: { businessId, date, serviceType? }
 * Note: connectionId is optional - if not provided, looks up from database
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, connectionId, date, serviceType } = await request.json()
    
    if (!businessId || !date) {
      return NextResponse.json(
        { success: false, message: 'businessId and date are required' },
        { status: 400 }
      )
    }
    
    // Get calendar integration from database if not provided
    let integrationId: string
    let connId: string = connectionId
    
    if (!connectionId) {
      const integration = await getCalendarIntegration(businessId)
      if (!integration) {
        return NextResponse.json(
          { success: false, message: 'No hay calendario conectado. Por favor, conecta tu calendario primero.' },
          { status: 404 }
        )
      }
      integrationId = integration.integrationId
      connId = integration.connectionId
    } else {
      // If connectionId provided, determine integration type from it
      // Convention: connectionId format is "businessId" and integrationId comes from DB
      const integration = await getCalendarIntegration(businessId)
      integrationId = integration?.integrationId || 'google-calendar'
    }
    
    const dateObj = new Date(date)
    const slots = await checkAvailability(integrationId, connId, dateObj)
    
    // Filter available slots
    const availableSlots = slots.filter(s => s.available)
    
    // Format for voice AI
    const formattedSlots = availableSlots.map(slot => {
      const time = new Date(slot.start)
      return {
        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        available: true,
      }
    })
    
    // Create human-readable message
    let message = ''
    if (formattedSlots.length === 0) {
      message = `No hay huecos disponibles para el ${formatDateSpanish(date)}.`
    } else if (formattedSlots.length <= 3) {
      const times = formattedSlots.map(s => s.time).join(', ')
      message = `Para el ${formatDateSpanish(date)}, tenemos disponible a las ${times}.`
    } else {
      message = `Para el ${formatDateSpanish(date)}, tenemos ${formattedSlots.length} huecos disponibles, desde las ${formattedSlots[0].time}.`
    }
    
    return NextResponse.json({
      success: true,
      date,
      slots: formattedSlots,
      message,
    })
    
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { success: false, message: 'Error al comprobar disponibilidad' },
      { status: 500 }
    )
  }
}

function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
}
