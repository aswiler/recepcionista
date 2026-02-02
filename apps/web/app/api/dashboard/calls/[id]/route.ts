import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getBusinessByUserId } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await getBusinessByUserId(session.user.id)
    
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    // Get the call
    const call = await db
      .select()
      .from(schema.calls)
      .where(
        and(
          eq(schema.calls.id, params.id),
          eq(schema.calls.businessId, business.id)
        )
      )
      .limit(1)

    if (!call[0]) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const callData = call[0]
    
    // Format the response
    const formattedCall = {
      id: callData.id,
      caller: callData.from,
      callerName: null, // Could be enriched from contacts
      time: formatTime(callData.createdAt),
      date: formatFullDate(callData.createdAt),
      duration: formatDuration(callData.duration || 0),
      status: callData.status || 'completed',
      outcome: callData.transferredToHuman ? 'transfer' : 'info',
      sentiment: callData.sentiment || 'neutral',
      sentimentScore: callData.sentiment === 'positive' ? 0.85 : callData.sentiment === 'negative' ? 0.15 : 0.5,
      summary: callData.summary || 'Sin resumen disponible',
      transcript: callData.transcript ? parseTranscript(callData.transcript) : [],
      tags: extractTags(callData),
      appointmentDetails: null, // Would come from calendar integration
    }
    
    return NextResponse.json(formattedCall)
  } catch (error) {
    console.error('Error fetching call details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call details' },
      { status: 500 }
    )
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function parseTranscript(transcript: string): Array<{ speaker: string; text: string }> {
  // Try to parse as JSON first
  try {
    return JSON.parse(transcript)
  } catch {
    // If not JSON, return as a single message
    return [{ speaker: 'ai', text: transcript }]
  }
}

function extractTags(call: typeof schema.calls.$inferSelect): string[] {
  const tags: string[] = []
  
  if (call.transferredToHuman) {
    tags.push('transferida')
  }
  if (call.sentiment === 'positive') {
    tags.push('positivo')
  }
  if (call.sentiment === 'negative') {
    tags.push('requiere atención')
  }
  
  return tags.length > 0 ? tags : ['llamada']
}
