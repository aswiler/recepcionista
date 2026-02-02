import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/ai/brain'
import { db } from '@/lib/db'
import { businesses, conversations, messages, calendarIntegrations } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

/**
 * WhatsApp Webhook Verification (GET)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * WhatsApp Incoming Message Handler (POST)
 * Routes messages to the correct business based on phone_number_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract message data from Meta's webhook format
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messageData = value?.messages?.[0]
    const phoneNumberId = value?.metadata?.phone_number_id
    
    if (!messageData || !phoneNumberId) {
      return NextResponse.json({ status: 'no_message' })
    }
    
    const customerPhone = messageData.from
    const text = messageData.text?.body
    const messageId = messageData.id
    
    if (!text) {
      return NextResponse.json({ status: 'no_text' })
    }
    
    console.log(`[WhatsApp] From ${customerPhone} to ${phoneNumberId}: ${text}`)
    
    // Find business by their connected WhatsApp phone number ID
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.whatsappPhoneNumberId, phoneNumberId))
      .limit(1)
    
    if (!business) {
      console.error(`[WhatsApp] No business found for phone_number_id: ${phoneNumberId}`)
      return NextResponse.json({ status: 'no_business' })
    }
    
    // Get or create conversation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.businessId, business.id),
          eq(conversations.customerPhone, customerPhone)
        )
      )
      .limit(1)
    
    let conversation = existingConversation
    
    if (!conversation) {
      const [newConversation] = await db.insert(conversations).values({
        id: `conv_${Date.now()}`,
        businessId: business.id,
        customerPhone,
        status: 'active',
        lastMessageAt: new Date(),
      }).returning()
      conversation = newConversation
    }
    
    // Store incoming message (ignore if already exists - Meta retries webhooks)
    try {
      await db.insert(messages).values({
        id: `msg_${messageId}`,
        conversationId: conversation.id,
        externalId: messageId,
        role: 'user',
        content: text,
      })
    } catch (insertError: any) {
      // If duplicate key error, message was already processed - skip
      if (insertError?.message?.includes('duplicate key')) {
        console.log(`[WhatsApp] Message ${messageId} already processed, skipping`)
        return NextResponse.json({ status: 'already_processed' })
      }
      throw insertError
    }
    
    // Check if business has a calendar integration
    const [calendarIntegration] = await db
      .select()
      .from(calendarIntegrations)
      .where(
        and(
          eq(calendarIntegrations.businessId, business.id),
          eq(calendarIntegrations.isActive, true)
        )
      )
      .limit(1)
    
    const hasCalendar = !!calendarIntegration
    console.log(`[WhatsApp] Calendar enabled: ${hasCalendar}`)
    
    // Get recent conversation history for context
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(10)
    
    const conversationHistory = recentMessages
      .reverse()
      .map(m => ({ role: m.role, content: m.content }))
    
    // Check if voice service is configured (for WhatsApp → Voice calls)
    const hasVoiceService = !!process.env.VOICE_SERVICE_URL
    
    // Generate AI response with calendar, voice call, and handoff tools
    const response = await generateResponse(
      business.id,
      business.name,
      text,
      'whatsapp',
      {
        enableCalendar: hasCalendar,
        enableVoiceCall: hasVoiceService,
        customerPhone,
        customerName: conversation.customerName || undefined,
        conversationId: conversation.id,
        conversationHistory,
      }
    )
    
    // Send response via WhatsApp
    const sentMessageId = await sendWhatsAppMessage(phoneNumberId, customerPhone, response.text)
    
    // Store outgoing message
    await db.insert(messages).values({
      id: `msg_${sentMessageId || Date.now()}`,
      conversationId: conversation.id,
      externalId: sentMessageId,
      role: 'assistant',
      content: response.text,
    })
    
    // Update conversation timestamp
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversation.id))
    
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

/**
 * Send a WhatsApp message using the business's connected number
 */
async function sendWhatsAppMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<string | null> {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('[WhatsApp] Send error:', error)
    return null
  }
  
  const data = await response.json()
  return data.messages?.[0]?.id || null
}
