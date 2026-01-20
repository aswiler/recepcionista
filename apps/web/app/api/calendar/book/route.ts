import { NextRequest, NextResponse } from 'next/server'
import { bookAppointment } from '@/lib/integrations/calendar'

/**
 * Book an appointment on the calendar
 * POST /api/calendar/book
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      businessId, 
      connectionId, 
      date, 
      time, 
      customerName, 
      customerPhone,
      serviceType,
      notes 
    } = await request.json()
    
    if (!businessId || !connectionId || !date || !time || !customerName) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos obligatorios para la reserva' },
        { status: 400 }
      )
    }
    
    // Parse date and time
    const [hours, minutes] = time.split(':').map(Number)
    const startDate = new Date(date)
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(hours + 1) // Default 1 hour appointment
    
    // Build appointment title and description
    const title = serviceType 
      ? `${serviceType} - ${customerName}`
      : `Cita - ${customerName}`
    
    let description = `Cliente: ${customerName}`
    if (customerPhone) description += `\nTeléfono: ${customerPhone}`
    if (serviceType) description += `\nServicio: ${serviceType}`
    if (notes) description += `\nNotas: ${notes}`
    description += `\n\nReservado por: Recepcionista AI`
    
    // Book the appointment
    const appointment = await bookAppointment(connectionId, {
      title,
      description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      attendees: customerPhone ? [customerPhone] : undefined,
    })
    
    // Format confirmation message
    const dateFormatted = startDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
    
    const message = `¡Perfecto! He reservado la cita para ${customerName} el ${dateFormatted} a las ${time}.`
    
    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      message,
      details: {
        date,
        time,
        customerName,
        service: serviceType,
      }
    })
    
  } catch (error) {
    console.error('Error booking appointment:', error)
    return NextResponse.json(
      { success: false, message: 'Ha habido un problema al reservar la cita. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
