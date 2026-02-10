import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface ServiceDetail {
  name: string
  description?: string
  price?: string
  duration?: string
}

interface FAQ {
  question: string
  answer: string
}

interface BusinessContext {
  businessName?: string
  businessType?: string
  description?: string
  tagline?: string
  services?: ServiceDetail[]
  hours?: string | { day: string; open: string; close: string }[]
  phone?: string
  email?: string
  address?: string
  faqs?: FAQ[]
  appointmentRules?: string
  tone?: string
  differentiators?: string[]
}

function buildContextString(ctx: BusinessContext): string {
  const parts: string[] = []
  if (ctx.businessName) parts.push(`Nombre: ${ctx.businessName}`)
  if (ctx.businessType) parts.push(`Tipo de negocio: ${ctx.businessType}`)
  if (ctx.description) parts.push(`Descripción: ${ctx.description}`)
  if (ctx.tagline) parts.push(`Eslogan: ${ctx.tagline}`)
  if (ctx.services?.length) {
    parts.push('Servicios: ' + ctx.services.map(s => 
      s.price ? `${s.name} (${s.price})` : s.name
    ).join(', '))
  }
  if (ctx.hours) {
    parts.push('Horarios: ' + (typeof ctx.hours === 'string' 
      ? ctx.hours 
      : ctx.hours.map(h => `${h.day} ${h.open}-${h.close}`).join(', ')))
  }
  if (ctx.phone) parts.push(`Teléfono: ${ctx.phone}`)
  if (ctx.email) parts.push(`Email: ${ctx.email}`)
  if (ctx.address) parts.push(`Dirección: ${ctx.address}`)
  if (ctx.appointmentRules) parts.push(`Cómo reservar: ${ctx.appointmentRules}`)
  if (ctx.tone) parts.push(`Tono: ${ctx.tone}`)
  if (ctx.differentiators?.length) {
    parts.push('Diferenciadores: ' + ctx.differentiators.join(', '))
  }
  if (ctx.faqs?.length) {
    parts.push('FAQs: ' + ctx.faqs.map(f => `P: ${f.question} R: ${f.answer}`).join(' | '))
  }
  return parts.join('\n')
}

/**
 * Demo receptionist for browser voice test (no phone, no Pinecone).
 * Uses only the provided business context.
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, businessContext } = await request.json() as {
      messages: Array<{ role: 'user' | 'assistant'; text: string }>
      businessContext: BusinessContext
    }

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const ctx = businessContext || {}
    const businessName = ctx.businessName || 'el negocio'
    const contextString = buildContextString(ctx)

    const systemPrompt = `Eres la recepcionista por teléfono de ${businessName}. Respondes a clientes que llaman.

INFORMACIÓN DEL NEGOCIO (usa solo esto, no inventes):
${contextString || 'Aún no hay mucha información. Responde de forma general y amable.'}

INSTRUCCIONES:
- Responde en español, de forma natural y breve (1-2 oraciones para voz).
- Si no sabes algo, di que puedes pasarles con alguien o que les devolverán la llamada.
- Tono: ${ctx.tone || 'profesional y amable'}.
- No des información que no esté en el contexto.`

    const formattedMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const text = response.choices[0]?.message?.content?.trim() || 'No he podido responder. ¿Puedes repetir?'
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Receptionist demo error:', error)
    return NextResponse.json(
      { text: 'Disculpa, ha habido un fallo. ¿Puedes intentarlo de nuevo?' },
      { status: 200 }
    )
  }
}
