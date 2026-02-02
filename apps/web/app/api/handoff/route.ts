import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handoffs, businesses, calls, conversations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

/**
 * Human Handoff API
 * 
 * Called by AI brain when it needs to escalate to a human.
 * - Stores the handoff request
 * - Sends notification to business owner
 * - For voice: triggers actual call transfer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      channel,
      customerPhone,
      customerName,
      conversationId,
      callId,
      reason,
      summary,
      urgency = 'normal',
    } = body

    if (!businessId || !channel || !customerPhone || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`🚨 Human handoff requested`)
    console.log(`   Business: ${businessId}`)
    console.log(`   Channel: ${channel}`)
    console.log(`   Customer: ${customerPhone}`)
    console.log(`   Reason: ${reason}`)
    console.log(`   Urgency: ${urgency}`)

    // Get business info for notifications and transfer
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1)

    if (!business) {
      console.error(`   ❌ Business not found: ${businessId}`)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Create handoff record
    const handoffId = `hoff_${randomUUID()}`
    
    await db.insert(handoffs).values({
      id: handoffId,
      businessId,
      channel,
      callId: callId || null,
      conversationId: conversationId || null,
      customerPhone,
      customerName: customerName || null,
      reason,
      summary: summary || null,
      urgency,
      status: 'pending',
    })

    console.log(`   ✅ Handoff created: ${handoffId}`)

    // Prepare response
    let customerMessage = ''
    let transferred = false

    if (channel === 'voice') {
      // For voice calls, attempt to transfer if we have a handoff phone number
      if (business.handoffPhone && callId) {
        try {
          // Call voice service to transfer the call
          const voiceServiceUrl = process.env.VOICE_SERVICE_URL || 'http://localhost:3001'
          const apiKey = process.env.VOICE_SERVICE_API_KEY

          const transferResponse = await fetch(`${voiceServiceUrl}/api/transfer-call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey || '',
            },
            body: JSON.stringify({
              callId,
              transferTo: business.handoffPhone,
              reason,
              summary,
            }),
          })

          if (transferResponse.ok) {
            transferred = true
            customerMessage = 'Te transfiero con un miembro de nuestro equipo. Un momento por favor.'
            
            // Update handoff record
            await db.update(handoffs)
              .set({ 
                transferred: true, 
                transferredTo: business.handoffPhone,
                status: 'notified',
                notifiedAt: new Date(),
              })
              .where(eq(handoffs.id, handoffId))
            
            console.log(`   📞 Call transferred to ${business.handoffPhone}`)
          } else {
            console.error(`   ❌ Failed to transfer call: ${await transferResponse.text()}`)
            customerMessage = 'Nuestro equipo te contactará muy pronto. Disculpa las molestias.'
          }
        } catch (error) {
          console.error(`   ❌ Error transferring call:`, error)
          customerMessage = 'Nuestro equipo te contactará muy pronto. Disculpa las molestias.'
        }
      } else {
        customerMessage = 'Nuestro equipo te contactará muy pronto. Disculpa las molestias.'
      }

      // Update the call record
      if (callId) {
        try {
          await db.update(calls)
            .set({ transferredToHuman: true })
            .where(eq(calls.id, callId))
        } catch (e) {
          // Call might not exist yet, that's okay
        }
      }
    } else {
      // For WhatsApp, notify the business owner
      customerMessage = 'Entiendo. Un miembro de nuestro equipo revisará tu mensaje y te responderá lo antes posible.'
      
      // Update conversation status if we have one
      if (conversationId) {
        try {
          await db.update(conversations)
            .set({ status: 'handoff' })
            .where(eq(conversations.id, conversationId))
        } catch (e) {
          // Conversation might have different status values
        }
      }
    }

    // Send notification to business owner
    await sendHandoffNotification({
      business,
      channel,
      customerPhone,
      customerName,
      reason,
      summary,
      urgency,
      handoffId,
    })

    return NextResponse.json({
      success: true,
      handoffId,
      transferred,
      customerMessage,
    })

  } catch (error) {
    console.error('Handoff error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get handoffs for a business
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const businessId = searchParams.get('businessId')
  const status = searchParams.get('status')

  if (!businessId) {
    return NextResponse.json(
      { error: 'businessId is required' },
      { status: 400 }
    )
  }

  try {
    let query = db.select().from(handoffs).where(eq(handoffs.businessId, businessId))
    
    // Could add status filter here if needed
    
    const results = await query.orderBy(handoffs.createdAt)

    return NextResponse.json({ handoffs: results })
  } catch (error) {
    console.error('Error fetching handoffs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send notification to business owner about handoff
 */
async function sendHandoffNotification(params: {
  business: typeof businesses.$inferSelect
  channel: string
  customerPhone: string
  customerName?: string | null
  reason: string
  summary?: string | null
  urgency: string
  handoffId: string
}) {
  const { business, channel, customerPhone, customerName, reason, summary, urgency, handoffId } = params
  
  const urgencyEmoji = {
    low: '🟢',
    normal: '🟡',
    high: '🟠',
    urgent: '🔴',
  }[urgency] || '🟡'

  const channelName = channel === 'voice' ? 'Llamada' : 'WhatsApp'

  console.log(`\n${'='.repeat(50)}`)
  console.log(`${urgencyEmoji} HANDOFF NOTIFICATION`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Business: ${business.name}`)
  console.log(`Channel: ${channelName}`)
  console.log(`Customer: ${customerName || 'Unknown'} (${customerPhone})`)
  console.log(`Reason: ${reason}`)
  if (summary) console.log(`Summary: ${summary}`)
  console.log(`Urgency: ${urgency.toUpperCase()}`)
  console.log(`Handoff ID: ${handoffId}`)
  console.log(`${'='.repeat(50)}\n`)

  // If business has handoff email, send notification
  if (business.handoffEmail) {
    // TODO: Implement email notification with Resend/SendGrid
    // For now, just log that we would send an email
    console.log(`📧 Would send email to: ${business.handoffEmail}`)
    
    // Example Resend implementation (uncomment when email is set up):
    /*
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'Recepcionista AI <notifications@recepcionista.ai>',
      to: business.handoffEmail,
      subject: `${urgencyEmoji} ${channelName}: Cliente necesita ayuda`,
      html: `
        <h2>Un cliente necesita hablar con un humano</h2>
        <p><strong>Cliente:</strong> ${customerName || 'Unknown'} (${customerPhone})</p>
        <p><strong>Canal:</strong> ${channelName}</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        ${summary ? `<p><strong>Resumen:</strong> ${summary}</p>` : ''}
        <p><strong>Urgencia:</strong> ${urgency}</p>
        <hr>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/handoffs/${handoffId}">Ver en dashboard</a></p>
      `,
    })
    */
  }

  // Update handoff as notified
  await db.update(handoffs)
    .set({ 
      status: 'notified',
      notifiedAt: new Date(),
    })
    .where(eq(handoffs.id, handoffId))
}
