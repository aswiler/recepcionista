import { NextRequest, NextResponse } from 'next/server'
import { checkAvailability } from '@/lib/integrations/calendar'

/**
 * Get next available slots
 * POST /api/calendar/next-available
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, connectionId, preferredTime, serviceType } = await request.json()
    
    if (!businessId || !connectionId) {
      return NextResponse.json(
        { success: false, message: 'businessId and connectionId are required' },
        { status: 400 }
      )
    }
    
    // Check next 7 days
    const availableSlots: { date: string; time: string; formatted: string }[] = []
    const today = new Date()
    
    for (let i = 1; i <= 7 && availableSlots.length < 5; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      
      // Skip weekends if business hours suggest it
      const dayOfWeek = checkDate.getDay()
      if (dayOfWeek === 0) continue // Skip Sunday
      
      const slots = await checkAvailability(connectionId, checkDate)
      
      for (const slot of slots) {
        if (!slot.available) continue
        
        const slotTime = new Date(slot.start)
        const hour = slotTime.getHours()
        
        // Filter by preferred time
        if (preferredTime === 'morning' && hour >= 14) continue
        if (preferredTime === 'afternoon' && hour < 14) continue
        
        const time = slotTime.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        
        const date = checkDate.toISOString().split('T')[0]
        const formatted = formatSlotSpanish(checkDate, time, i)
        
        availableSlots.push({ date, time, formatted })
        
        if (availableSlots.length >= 5) break
      }
    }
    
    // Build message
    let message = ''
    if (availableSlots.length === 0) {
      message = 'Lo siento, no he encontrado huecos disponibles en los próximos días.'
    } else if (availableSlots.length === 1) {
      message = `El próximo hueco disponible es ${availableSlots[0].formatted}.`
    } else {
      const firstThree = availableSlots.slice(0, 3).map(s => s.formatted)
      message = `Los próximos huecos disponibles son: ${firstThree.join(', ')}.`
    }
    
    return NextResponse.json({
      success: true,
      slots: availableSlots,
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
