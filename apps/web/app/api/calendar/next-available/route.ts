import { NextRequest, NextResponse } from 'next/server'
import { getNextAvailableSlots } from '@/lib/integrations/calendar'
import { getCalendarIntegration } from '@/lib/db/queries'

/**
 * Get next available slots
 * POST /api/calendar/next-available
 * 
 * Body: { businessId, preferredTime?, serviceType? }
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, connectionId, preferredTime, serviceType } = await request.json()
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, message: 'businessId is required' },
        { status: 400 }
      )
    }
    
    // Get calendar integration from database
    const integration = await getCalendarIntegration(businessId)
    if (!integration) {
      return NextResponse.json(
        { success: false, message: 'No hay calendario conectado. Por favor, conecta tu calendario primero.' },
        { status: 404 }
      )
    }
    
    const integrationId = integration.integrationId
    const connId = connectionId || integration.connectionId
    
    // Map preferred time to expected format
    const preferredTimeNormalized = preferredTime === 'morning' ? 'morning' 
      : preferredTime === 'afternoon' ? 'afternoon' 
      : 'any'
    
    // Get next available slots using the integrated function
    const slots = await getNextAvailableSlots(
      integrationId, 
      connId, 
      preferredTimeNormalized as 'morning' | 'afternoon' | 'any'
    )
    
    // Format slots for voice AI response
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const formattedSlots = slots.map(slot => {
      const slotDate = new Date(slot.start)
      const time = slotDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const date = slotDate.toISOString().split('T')[0]
      
      // Calculate days from now
      const daysFromNow = Math.floor((slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const formatted = formatSlotSpanish(slotDate, time, daysFromNow)
      
      return { date, time, formatted }
    })
    
    // Build message
    let message = ''
    if (formattedSlots.length === 0) {
      message = 'Lo siento, no he encontrado huecos disponibles en los próximos días.'
    } else if (formattedSlots.length === 1) {
      message = `El próximo hueco disponible es ${formattedSlots[0].formatted}.`
    } else {
      const firstThree = formattedSlots.slice(0, 3).map(s => s.formatted)
      message = `Los próximos huecos disponibles son: ${firstThree.join(', ')}.`
    }
    
    return NextResponse.json({
      success: true,
      slots: formattedSlots,
      message,
    })
    
  } catch (error) {
    console.error('Error getting next available:', error)
    return NextResponse.json(
      { success: false, message: 'Error al buscar disponibilidad' },
      { status: 500 }
    )
  }
}

function formatSlotSpanish(date: Date, time: string, daysFromNow: number): string {
  if (daysFromNow === 1) {
    return `mañana a las ${time}`
  } else if (daysFromNow === 2) {
    return `pasado mañana a las ${time}`
  } else {
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' })
    const dayNum = date.getDate()
    return `el ${dayName} ${dayNum} a las ${time}`
  }
}
