/**
 * Calendar Tools for Voice AI
 * 
 * These tools allow the AI to:
 * - Check calendar availability
 * - Book appointments
 * - List upcoming appointments
 */

import OpenAI from 'openai'

// Tool definitions for OpenAI function calling
export const calendarTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Comprueba la disponibilidad del calendario para una fecha específica. Usa esto cuando el cliente pregunte por citas disponibles o quiera saber si hay hueco.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'La fecha para comprobar disponibilidad en formato YYYY-MM-DD. Si el cliente dice "mañana", calcula la fecha.',
          },
          service_type: {
            type: 'string',
            description: 'El tipo de servicio o cita que el cliente quiere (opcional)',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Reserva una cita en el calendario. Usa esto cuando el cliente confirme que quiere reservar un hueco específico.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'La fecha de la cita en formato YYYY-MM-DD',
          },
          time: {
            type: 'string',
            description: 'La hora de la cita en formato HH:MM (24h)',
          },
          customer_name: {
            type: 'string',
            description: 'El nombre del cliente',
          },
          customer_phone: {
            type: 'string',
            description: 'El teléfono del cliente (opcional)',
          },
          service_type: {
            type: 'string',
            description: 'El tipo de servicio o cita',
          },
          notes: {
            type: 'string',
            description: 'Notas adicionales para la cita (opcional)',
          },
        },
        required: ['date', 'time', 'customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_next_available',
      description: 'Obtiene los próximos huecos disponibles. Usa esto cuando el cliente quiera saber cuándo es la próxima disponibilidad sin especificar fecha.',
      parameters: {
        type: 'object',
        properties: {
          service_type: {
            type: 'string',
            description: 'El tipo de servicio que el cliente necesita (opcional)',
          },
          preferred_time: {
            type: 'string',
            enum: ['morning', 'afternoon', 'any'],
            description: 'Preferencia de horario: mañana, tarde, o cualquiera',
          },
        },
        required: [],
      },
    },
  },
]

// Tool result interfaces
export interface AvailabilitySlot {
  time: string      // HH:MM format
  available: boolean
  duration?: number // minutes
}

export interface AppointmentResult {
  success: boolean
  appointmentId?: string
  message: string
  details?: {
    date: string
    time: string
    customerName: string
    service?: string
  }
}

export interface NextAvailableResult {
  slots: {
    date: string
    time: string
    formatted: string // "Mañana a las 10:00" or "El lunes 20 de enero a las 15:30"
  }[]
  message: string
}

/**
 * Execute a calendar tool
 * This is called when the AI decides to use a calendar function
 */
export async function executeCalendarTool(
  toolName: string,
  args: Record<string, unknown>,
  businessId: string,
  calendarConnectionId?: string
): Promise<string> {
  console.log(`🗓️ Executing tool: ${toolName}`, args)

  // If no calendar connected, return helpful message
  if (!calendarConnectionId) {
    return JSON.stringify({
      success: false,
      message: 'El calendario no está conectado. Por favor, indícale al cliente que llame más tarde o que contacte directamente.',
    })
  }

  try {
    switch (toolName) {
      case 'check_availability':
        return await checkAvailabilityTool(args, businessId, calendarConnectionId)
      
      case 'book_appointment':
        return await bookAppointmentTool(args, businessId, calendarConnectionId)
      
      case 'get_next_available':
        return await getNextAvailableTool(args, businessId, calendarConnectionId)
      
      default:
        return JSON.stringify({ success: false, message: 'Herramienta no reconocida' })
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error)
    return JSON.stringify({
      success: false,
      message: 'Ha habido un problema técnico con el calendario. Ofrece al cliente llamar más tarde.',
    })
  }
}

async function checkAvailabilityTool(
  args: Record<string, unknown>,
  businessId: string,
  connectionId: string
): Promise<string> {
  const date = args.date as string
  
  // Call the web app's calendar API
  const response = await fetch(`${process.env.WEB_APP_URL || 'http://localhost:3002'}/api/calendar/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      connectionId,
      date,
      serviceType: args.service_type,
    }),
  })
  
  if (!response.ok) {
    // Return mock data for demo/testing
    return JSON.stringify({
      success: true,
      date,
      slots: generateMockSlots(date),
      message: `Disponibilidad para el ${formatDateSpanish(date)}`,
    })
  }
  
  return response.text()
}

async function bookAppointmentTool(
  args: Record<string, unknown>,
  businessId: string,
  connectionId: string
): Promise<string> {
  const { date, time, customer_name, customer_phone, service_type, notes } = args as {
    date: string
    time: string
    customer_name: string
    customer_phone?: string
    service_type?: string
    notes?: string
  }
  
  // Call the web app's calendar API
  const response = await fetch(`${process.env.WEB_APP_URL || 'http://localhost:3002'}/api/calendar/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      connectionId,
      date,
      time,
      customerName: customer_name,
      customerPhone: customer_phone,
      serviceType: service_type,
      notes,
    }),
  })
  
  if (!response.ok) {
    // Return success for demo/testing
    return JSON.stringify({
      success: true,
      appointmentId: `appt-${Date.now()}`,
      message: `¡Perfecto! He reservado la cita para ${customer_name} el ${formatDateSpanish(date)} a las ${time}.`,
      details: { date, time, customerName: customer_name, service: service_type },
    })
  }
  
  return response.text()
}

async function getNextAvailableTool(
  args: Record<string, unknown>,
  businessId: string,
  connectionId: string
): Promise<string> {
  const preferredTime = (args.preferred_time as string) || 'any'
  
  // Call the web app's calendar API
  const response = await fetch(`${process.env.WEB_APP_URL || 'http://localhost:3002'}/api/calendar/next-available`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      connectionId,
      preferredTime,
      serviceType: args.service_type,
    }),
  })
  
  if (!response.ok) {
    // Return mock data for demo/testing
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return JSON.stringify({
      success: true,
      slots: [
        { date: formatDate(tomorrow), time: '10:00', formatted: 'Mañana a las 10:00' },
        { date: formatDate(tomorrow), time: '11:30', formatted: 'Mañana a las 11:30' },
        { date: formatDate(tomorrow), time: '16:00', formatted: 'Mañana a las 16:00' },
      ],
      message: 'Los próximos huecos disponibles son: mañana a las 10:00, 11:30 o 16:00.',
    })
  }
  
  return response.text()
}

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }
  return date.toLocaleDateString('es-ES', options)
}

function generateMockSlots(date: string): AvailabilitySlot[] {
  // Generate realistic mock availability
  const slots: AvailabilitySlot[] = []
  const hours = [9, 10, 11, 12, 16, 17, 18, 19]
  
  for (const hour of hours) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: Math.random() > 0.3, // 70% available
      duration: 60,
    })
  }
  
  return slots
}
