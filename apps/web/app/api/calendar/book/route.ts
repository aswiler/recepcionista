import { NextRequest, NextResponse } from 'next/server'
import { bookAppointment } from '@/lib/integrations/calendar'
import { getCalendarIntegration } from '@/lib/db/queries'

/**
 * Book an appointment on the calendar
 * POST /api/calendar/book
 * 
 * Body: { businessId, date, time, customerName, customerPhone?, serviceType?, notes? }
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
      customerEmail,
      serviceType,
      notes,
      duration = 60 // Default 60 minutes
    } = await request.json()
    
    if (!businessId || !date || !time || !customerName) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos obligatorios para la reserva' },
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
    
    // Parse date and time
    const [hours, minutes] = time.split(':').map(Number)
    const startDate = new Date(date)
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setMinutes(startDate.getMinutes() + duration)
    
    // Build appointment title and description
    const title = serviceType 
      ? `${serviceType} - ${customerName}`
      : `Cita - ${customerName}`
    
    let description = `Cliente: ${customerName}`
    if (customerPhone) description += `\nTeléfono: ${customerPhone}`
    if (customerEmail) description += `\nEmail: ${customerEmail}`
    if (serviceType) description += `\nServicio: ${serviceType}`
    if (notes) description += `\nNotas: ${notes}`
    description += `\n\nReservado por: Recepcionista AI`
    
    // Prepare attendees (email addresses only)
    const attendees: string[] = []
    if (customerEmail) attendees.push(customerEmail)
    
    // Book the appointment
    const appointment = await bookAppointment(integrationId, connId, {
      title,
      description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      attendees: attendees.length > 0 ? attendees : undefined,
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
        customerEmail,
        customerPhone,
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
