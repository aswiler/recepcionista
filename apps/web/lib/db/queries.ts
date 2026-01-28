import { eq, desc, sql, and, gte, lte, count } from 'drizzle-orm'
import { db } from './index'
import * as schema from './schema'

// Dashboard stats queries
export async function getDashboardStats(businessId: string, dateRange: 'today' | 'week' | 'month' = 'week') {
  const now = new Date()
  let startDate: Date
  
  switch (dateRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
  }

  // Get total calls
  const callsResult = await db
    .select({ count: count() })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.businessId, businessId),
        gte(schema.calls.createdAt, startDate)
      )
    )

  // Get average call duration
  const durationResult = await db
    .select({ 
      avgDuration: sql<number>`AVG(${schema.calls.duration})` 
    })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.businessId, businessId),
        gte(schema.calls.createdAt, startDate),
        sql`${schema.calls.duration} IS NOT NULL`
      )
    )

  // Get missed/transferred calls
  const missedResult = await db
    .select({ count: count() })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.businessId, businessId),
        gte(schema.calls.createdAt, startDate),
        eq(schema.calls.transferredToHuman, true)
      )
    )

  // Get previous period for comparison
  const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
  const previousCallsResult = await db
    .select({ count: count() })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.businessId, businessId),
        gte(schema.calls.createdAt, previousStart),
        lte(schema.calls.createdAt, startDate)
      )
    )

  const totalCalls = callsResult[0]?.count ?? 0
  const previousCalls = previousCallsResult[0]?.count ?? 0
  const avgDuration = durationResult[0]?.avgDuration ?? 0
  const missedCalls = missedResult[0]?.count ?? 0

  // Calculate percentage change
  const callsChange = previousCalls > 0 
    ? Math.round(((totalCalls - previousCalls) / previousCalls) * 100)
    : 0

  return {
    totalCalls,
    callsChange,
    appointmentsBooked: 0, // TODO: Connect to actual appointments when calendar is fully integrated
    appointmentsChange: 0,
    avgCallDuration: formatDuration(avgDuration),
    durationChange: 0,
    missedCalls,
    missedChange: 0,
  }
}

// Get recent calls
export async function getRecentCalls(businessId: string, limit: number = 10) {
  const calls = await db
    .select()
    .from(schema.calls)
    .where(eq(schema.calls.businessId, businessId))
    .orderBy(desc(schema.calls.createdAt))
    .limit(limit)

  return calls.map(call => ({
    id: call.id,
    caller: call.from,
    callerName: null, // Could be enriched from contacts
    time: getRelativeTime(call.createdAt),
    duration: formatDuration(call.duration || 0),
    status: call.status || 'completed',
    outcome: call.transferredToHuman ? 'transfer' : 'info',
    summary: call.summary || 'Sin resumen disponible',
    sentiment: call.sentiment || 'neutral',
  }))
}

// Get all calls with filtering
export async function getAllCalls(businessId: string, options: {
  limit?: number
  offset?: number
  filter?: 'all' | 'appointment' | 'info' | 'transfer' | 'missed'
} = {}) {
  const { limit = 50, offset = 0, filter = 'all' } = options

  let query = db
    .select()
    .from(schema.calls)
    .where(eq(schema.calls.businessId, businessId))
    .orderBy(desc(schema.calls.createdAt))
    .limit(limit)
    .offset(offset)

  const calls = await query

  return calls.map(call => {
    // Determine outcome based on call data
    let outcome = 'info'
    if (call.transferredToHuman) outcome = 'transfer'
    if (call.status === 'missed') outcome = 'missed'
    // TODO: Check if appointment was booked during call

    return {
      id: call.id,
      caller: call.from,
      callerName: null,
      time: formatTime(call.createdAt),
      date: formatDate(call.createdAt),
      fullDate: call.createdAt.toISOString().split('T')[0],
      duration: formatDuration(call.duration || 0),
      status: call.status || 'completed',
      outcome,
      sentiment: call.sentiment || 'neutral',
      summary: call.summary || 'Sin resumen disponible',
    }
  }).filter(call => {
    if (filter === 'all') return true
    return call.outcome === filter
  })
}

// Get call stats summary
export async function getCallStats(businessId: string) {
  const calls = await db
    .select()
    .from(schema.calls)
    .where(eq(schema.calls.businessId, businessId))

  const total = calls.length
  const appointments = calls.filter(c => !c.transferredToHuman && c.status === 'completed').length
  const info = calls.filter(c => !c.transferredToHuman && c.status === 'completed').length
  const attention = calls.filter(c => c.transferredToHuman || c.status === 'missed').length

  return {
    total,
    appointments,
    info,
    attention,
  }
}

// Get conversations (WhatsApp)
export async function getConversations(businessId: string, limit: number = 20) {
  const conversations = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.businessId, businessId))
    .orderBy(desc(schema.conversations.lastMessageAt))
    .limit(limit)

  return conversations
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.createdAt)

  return messages
}

// Get business by user ID
export async function getBusinessByUserId(userId: string) {
  const business = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.userId, userId))
    .limit(1)

  return business[0] || null
}

// Get business by ID
export async function getBusinessById(businessId: string) {
  const business = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, businessId))
    .limit(1)

  return business[0] || null
}

// Get user subscription
export async function getUserSubscription(userId: string) {
  const subscription = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1)

  return subscription[0] || null
}

// Get calendar integration for a business
export async function getCalendarIntegration(businessId: string) {
  const integration = await db
    .select()
    .from(schema.calendarIntegrations)
    .where(
      and(
        eq(schema.calendarIntegrations.businessId, businessId),
        eq(schema.calendarIntegrations.isActive, true)
      )
    )
    .limit(1)

  return integration[0] || null
}

// Get all calendar integrations for a business
export async function getCalendarIntegrations(businessId: string) {
  const integrations = await db
    .select()
    .from(schema.calendarIntegrations)
    .where(eq(schema.calendarIntegrations.businessId, businessId))

  return integrations
}

// Get insights data
export async function getInsightsData(businessId: string) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get calls from last 7 days
  const calls = await db
    .select()
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.businessId, businessId),
        gte(schema.calls.createdAt, weekAgo)
      )
    )
    .orderBy(schema.calls.createdAt)

  // Calculate weekly stats by day
  const weeklyStats = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]
    const dayCalls = calls.filter(c => {
      const callDate = new Date(c.createdAt)
      return callDate.getDate() === date.getDate() && 
             callDate.getMonth() === date.getMonth()
    })

    return {
      day: dayName,
      calls: dayCalls.length,
      appointments: dayCalls.filter(c => !c.transferredToHuman).length,
    }
  })

  // Calculate hourly distribution
  const hourlyDistribution = Array.from({ length: 12 }, (_, i) => {
    const hour = 9 + i // 9 AM to 8 PM
    const hourCalls = calls.filter(c => {
      const callHour = new Date(c.createdAt).getHours()
      return callHour === hour
    })
    return {
      hour: hour.toString(),
      calls: hourCalls.length,
    }
  })

  // Calculate sentiment distribution
  const sentimentCounts = {
    positive: calls.filter(c => c.sentiment === 'positive').length,
    neutral: calls.filter(c => c.sentiment === 'neutral' || !c.sentiment).length,
    negative: calls.filter(c => c.sentiment === 'negative').length,
  }
  const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative || 1
  const customerSentiment = {
    positive: Math.round((sentimentCounts.positive / totalSentiment) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalSentiment) * 100),
    negative: Math.round((sentimentCounts.negative / totalSentiment) * 100),
  }

  return {
    weeklyStats,
    hourlyDistribution,
    customerSentiment,
    totalCalls: calls.length,
    appointmentsBooked: calls.filter(c => !c.transferredToHuman).length,
    conversionRate: calls.length > 0 
      ? Math.round((calls.filter(c => !c.transferredToHuman).length / calls.length) * 100)
      : 0,
    avgDuration: formatDuration(
      calls.reduce((acc, c) => acc + (c.duration || 0), 0) / (calls.length || 1)
    ),
  }
}

// Helper functions
function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays === 1) return 'Ayer'
  return `Hace ${diffDays} días`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
