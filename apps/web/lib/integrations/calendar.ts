/**
 * Calendar Integration Service
 * Provides unified calendar operations for Google Calendar and Outlook
 * Uses Nango for OAuth and API proxying
 */

import { getNango, proxyRequest } from './nango'

export interface TimeSlot {
  start: string // ISO date string
  end: string
  available: boolean
}

export interface Appointment {
  id: string
  title: string
  description?: string
  start: string
  end: string
  attendees?: string[]
  location?: string
}

export interface CalendarEvent {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: Array<{ email: string; displayName?: string }>
  location?: string
}

// Provider-specific API configurations
const PROVIDERS = {
  'google-calendar': {
    calendarId: 'primary',
    eventsEndpoint: '/calendar/v3/calendars/primary/events',
    freebusyEndpoint: '/calendar/v3/freeBusy',
  },
  'microsoft-calendar': {
    eventsEndpoint: '/me/calendar/events',
    calendarViewEndpoint: '/me/calendarview',
  },
}

/**
 * Check availability on a connected calendar
 * @param integrationId - The Nango integration type (google-calendar, microsoft-calendar)
 * @param connectionId - The Nango connection ID for the calendar
 * @param date - The date to check availability for
 * @param businessHours - Optional business hours config (default 9-17)
 * @returns Array of available time slots
 */
export async function checkAvailability(
  integrationId: string,
  connectionId: string,
  date: Date,
  businessHours: { start: number; end: number } = { start: 9, end: 17 }
): Promise<TimeSlot[]> {
  console.log('🗓️ checkAvailability:', { integrationId, connectionId, date: date.toISOString() })
  
  const startOfDay = new Date(date)
  startOfDay.setHours(businessHours.start, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(businessHours.end, 0, 0, 0)

  try {
    // Fetch existing events for the date
    const events = await getEventsForDateRange(
      integrationId,
      connectionId,
      startOfDay,
      endOfDay
    )

    // Generate time slots and mark busy ones
    const slots: TimeSlot[] = []
    
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(date)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      // Check if this slot overlaps with any existing event
      const isOccupied = events.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date || '')
        const eventEnd = new Date(event.end.dateTime || event.end.date || '')
        return slotStart < eventEnd && slotEnd > eventStart
      })

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isOccupied,
      })
    }

    console.log(`✅ Found ${slots.filter(s => s.available).length} available slots`)
    return slots
  } catch (error) {
    console.error('Error checking availability:', error)
    // Return fallback availability on error
    return generateFallbackSlots(date, businessHours)
  }
}

/**
 * Book an appointment on a connected calendar
 * @param integrationId - The Nango integration type
 * @param connectionId - The Nango connection ID
 * @param appointment - The appointment details
 * @returns The created appointment with ID
 */
export async function bookAppointment(
  integrationId: string,
  connectionId: string,
  appointment: Omit<Appointment, 'id'>
): Promise<Appointment> {
  console.log('🗓️ bookAppointment:', { integrationId, connectionId, appointment })

  try {
    if (integrationId === 'google-calendar') {
      return await createGoogleCalendarEvent(connectionId, appointment)
    } else if (integrationId === 'microsoft-calendar') {
      return await createOutlookEvent(connectionId, appointment)
    }
    
    throw new Error(`Unsupported calendar provider: ${integrationId}`)
  } catch (error) {
    console.error('Error booking appointment:', error)
    throw error
  }
}

/**
 * List upcoming appointments
 * @param integrationId - The Nango integration type
 * @param connectionId - The Nango connection ID
 * @param fromDate - Start date for listing
 * @param toDate - End date for listing
 * @returns Array of appointments
 */
export async function listUpcomingAppointments(
  integrationId: string,
  connectionId: string,
  fromDate: Date,
  toDate: Date
): Promise<Appointment[]> {
  console.log('🗓️ listUpcomingAppointments:', { integrationId, connectionId, fromDate, toDate })

  try {
    const events = await getEventsForDateRange(integrationId, connectionId, fromDate, toDate)
    
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Sin título',
      description: event.description,
      start: event.start.dateTime || event.start.date || '',
      end: event.end.dateTime || event.end.date || '',
      attendees: event.attendees?.map(a => a.email),
      location: event.location,
    }))
  } catch (error) {
    console.error('Error listing appointments:', error)
    return []
  }
}

/**
 * Get the next available time slots
 * @param integrationId - The Nango integration type
 * @param connectionId - The Nango connection ID
 * @param preferredTime - 'morning', 'afternoon', or 'any'
 * @param daysToCheck - Number of days ahead to check (default 7)
 */
export async function getNextAvailableSlots(
  integrationId: string,
  connectionId: string,
  preferredTime: 'morning' | 'afternoon' | 'any' = 'any',
  daysToCheck: number = 7
): Promise<TimeSlot[]> {
  console.log('🗓️ getNextAvailableSlots:', { integrationId, connectionId, preferredTime })

  const availableSlots: TimeSlot[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check next N days
  for (let i = 1; i <= daysToCheck && availableSlots.length < 5; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() + i)
    
    // Skip weekends
    const dayOfWeek = checkDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const daySlots = await checkAvailability(integrationId, connectionId, checkDate)
    
    // Filter by preferred time
    const filteredSlots = daySlots.filter(slot => {
      if (!slot.available) return false
      const hour = new Date(slot.start).getHours()
      if (preferredTime === 'morning') return hour >= 9 && hour < 13
      if (preferredTime === 'afternoon') return hour >= 13 && hour < 17
      return true
    })

    availableSlots.push(...filteredSlots.slice(0, 3)) // Max 3 per day
  }

  return availableSlots.slice(0, 5) // Return top 5
}

/**
 * Delete/cancel an appointment
 */
export async function cancelAppointment(
  integrationId: string,
  connectionId: string,
  eventId: string
): Promise<boolean> {
  console.log('🗓️ cancelAppointment:', { integrationId, connectionId, eventId })

  try {
    if (integrationId === 'google-calendar') {
      await proxyRequest({
        integrationId,
        connectionId,
        method: 'DELETE',
        endpoint: `${PROVIDERS['google-calendar'].eventsEndpoint}/${eventId}`,
      })
    } else if (integrationId === 'microsoft-calendar') {
      await proxyRequest({
        integrationId,
        connectionId,
        method: 'DELETE',
        endpoint: `${PROVIDERS['microsoft-calendar'].eventsEndpoint}/${eventId}`,
      })
    }
    
    console.log('✅ Appointment cancelled')
    return true
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return false
  }
}

// ============================================
// Provider-specific implementations
// ============================================

async function getEventsForDateRange(
  integrationId: string,
  connectionId: string,
  fromDate: Date,
  toDate: Date
): Promise<CalendarEvent[]> {
  if (integrationId === 'google-calendar') {
    return await getGoogleCalendarEvents(connectionId, fromDate, toDate)
  } else if (integrationId === 'microsoft-calendar') {
    return await getOutlookEvents(connectionId, fromDate, toDate)
  }
  
  throw new Error(`Unsupported calendar provider: ${integrationId}`)
}

/**
 * Google Calendar: Get events
 */
async function getGoogleCalendarEvents(
  connectionId: string,
  fromDate: Date,
  toDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: fromDate.toISOString(),
    timeMax: toDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const response = await proxyRequest({
    integrationId: 'google-calendar',
    connectionId,
    method: 'GET',
    endpoint: `${PROVIDERS['google-calendar'].eventsEndpoint}?${params.toString()}`,
  })

  return response.items || []
}

/**
 * Google Calendar: Create event
 */
async function createGoogleCalendarEvent(
  connectionId: string,
  appointment: Omit<Appointment, 'id'>
): Promise<Appointment> {
  const eventData = {
    summary: appointment.title,
    description: appointment.description,
    start: {
      dateTime: appointment.start,
      timeZone: 'Europe/Madrid',
    },
    end: {
      dateTime: appointment.end,
      timeZone: 'Europe/Madrid',
    },
    attendees: appointment.attendees?.map(email => ({ email })),
    location: appointment.location,
  }

  const response = await proxyRequest({
    integrationId: 'google-calendar',
    connectionId,
    method: 'POST',
    endpoint: PROVIDERS['google-calendar'].eventsEndpoint,
    data: eventData,
  })

  console.log('✅ Google Calendar event created:', response.id)
  
  return {
    id: response.id,
    title: response.summary || appointment.title,
    description: response.description,
    start: response.start?.dateTime || appointment.start,
    end: response.end?.dateTime || appointment.end,
    attendees: response.attendees?.map((a: { email: string }) => a.email),
    location: response.location,
  }
}

/**
 * Microsoft Outlook: Get events
 */
async function getOutlookEvents(
  connectionId: string,
  fromDate: Date,
  toDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime: fromDate.toISOString(),
    endDateTime: toDate.toISOString(),
    $orderby: 'start/dateTime',
    $select: 'id,subject,body,start,end,attendees,location',
  })

  const response = await proxyRequest({
    integrationId: 'microsoft-calendar',
    connectionId,
    method: 'GET',
    endpoint: `${PROVIDERS['microsoft-calendar'].calendarViewEndpoint}?${params.toString()}`,
  })

  // Convert Outlook format to common format
  return (response.value || []).map((event: any) => ({
    id: event.id,
    summary: event.subject,
    description: event.body?.content,
    start: { dateTime: event.start?.dateTime },
    end: { dateTime: event.end?.dateTime },
    attendees: event.attendees?.map((a: any) => ({
      email: a.emailAddress?.address,
      displayName: a.emailAddress?.name,
    })),
    location: event.location?.displayName,
  }))
}

/**
 * Microsoft Outlook: Create event
 */
async function createOutlookEvent(
  connectionId: string,
  appointment: Omit<Appointment, 'id'>
): Promise<Appointment> {
  const eventData = {
    subject: appointment.title,
    body: {
      contentType: 'text',
      content: appointment.description || '',
    },
    start: {
      dateTime: appointment.start,
      timeZone: 'Europe/Madrid',
    },
    end: {
      dateTime: appointment.end,
      timeZone: 'Europe/Madrid',
    },
    attendees: appointment.attendees?.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    })),
    location: appointment.location ? { displayName: appointment.location } : undefined,
  }

  const response = await proxyRequest({
    integrationId: 'microsoft-calendar',
    connectionId,
    method: 'POST',
    endpoint: PROVIDERS['microsoft-calendar'].eventsEndpoint,
    data: eventData,
  })

  console.log('✅ Outlook event created:', response.id)
  
  return {
    id: response.id,
    title: response.subject || appointment.title,
    description: response.body?.content,
    start: response.start?.dateTime || appointment.start,
    end: response.end?.dateTime || appointment.end,
    attendees: response.attendees?.map((a: any) => a.emailAddress?.address),
    location: response.location?.displayName,
  }
}

// ============================================
// Helper functions
// ============================================

function generateFallbackSlots(
  date: Date,
  businessHours: { start: number; end: number }
): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  for (let hour = businessHours.start; hour < businessHours.end; hour++) {
    const start = new Date(date)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(date)
    end.setHours(hour + 1, 0, 0, 0)
    
    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      available: true, // Assume all available when can't fetch real data
    })
  }
  
  return slots
}
