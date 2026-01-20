import { NextRequest, NextResponse } from 'next/server'
import { checkAvailability } from '@/lib/integrations/calendar'

/**
 * Check calendar availability for a specific date
 * POST /api/calendar/availability
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, connectionId, date, serviceType } = await request.json()
    
    if (!businessId || !connectionId || !date) {
      return NextResponse.json(
        { success: false, message: 'businessId, connectionId, and date are required' },
        { status: 400 }
      )
    }
    
    const dateObj = new Date(date)
    const slots = await checkAvailability(connectionId, dateObj)
    
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
