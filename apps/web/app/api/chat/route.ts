import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface Message {
  role: 'assistant' | 'user'
  text: string
}

interface ExtractedInfo {
  businessName?: string
  businessType?: string
  description?: string
  services?: Array<{
    name: string
    description?: string
    price?: string
    duration?: string
  }>
  hours?: Array<{ day: string; open: string; close: string }> | string
  appointmentProcess?: string
  cancellationPolicy?: string
  faqs?: Array<{ question: string; answer: string }>
  transferRules?: {
    urgencies?: string[]
    complexCases?: string[]
    vipScenarios?: string[]
  }
  tone?: string
  languages?: string[]
  specialInstructions?: string
  pricingNotes?: string
  targetAudience?: string
  differentiators?: string[]
}

interface InterviewState {
  currentPhase: string
  phasesCompleted: string[]
  extractedInfo: ExtractedInfo
  questionsAskedInPhase: number
  totalExchanges: number
  confidence: Record<string, number>
}

// Map business types to industry categories
function getIndustryCategory(businessType: string): string {
  const type = businessType.toLowerCase()
  if (type.includes('clinic') || type.includes('medic') || type.includes('doctor') || 
      type.includes('dentist') || type.includes('hospital') || type.includes('health') ||
      type.includes('clínica') || type.includes('médic') || type.includes('salud')) return 'healthcare'
  if (type.includes('salon') || type.includes('beauty') || type.includes('hair') || 
      type.includes('spa') || type.includes('peluquer') || type.includes('estétic') ||
      type.includes('belleza') || type.includes('barber')) return 'salon'
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('bar') || 
      type.includes('food') || type.includes('restaurante') || type.includes('comida') ||
      type.includes('catering') || type.includes('pizz')) return 'restaurant'
  if (type.includes('law') || type.includes('consult') || type.includes('account') || 
      type.includes('legal') || type.includes('abogad') || type.includes('asesor') ||
      type.includes('financ') || type.includes('coach')) return 'professional'
  if (type.includes('software') || type.includes('tech') || type.includes('app') || 
      type.includes('saas') || type.includes('digital') || type.includes('startup') ||
      type.includes('desarrollo') || type.includes('tecnolog')) return 'software'
  if (type.includes('shop') || type.includes('store') || type.includes('retail') || 
      type.includes('tienda') || type.includes('ecommerce') || type.includes('venta')) return 'retail'
  if (type.includes('gym') || type.includes('fitness') || type.includes('yoga') || 
      type.includes('sport') || type.includes('gimnasio') || type.includes('deporte') ||
      type.includes('pilates') || type.includes('crossfit')) return 'fitness'
  return 'default'
}

// Lean phases: fast, 1-2 exchanges each, ALWAYS advance
const INTERVIEW_PHASES = [
  { id: 'intro',        maxExchanges: 1, requiredFields: ['businessName', 'businessType'] },
  { id: 'services',     maxExchanges: 2, requiredFields: ['services'] },
  { id: 'hours',        maxExchanges: 1, requiredFields: ['hours'] },
  { id: 'appointments', maxExchanges: 1, requiredFields: ['appointmentProcess'] },
  { id: 'faqs',         maxExchanges: 2, requiredFields: ['faqs'] },
  { id: 'escalation',   maxExchanges: 1, requiredFields: ['transferRules'] },
]

export async function POST(request: NextRequest) {
  try {
    const { messages, scrapedData, interviewState } = await request.json()
    
    let scraped: Record<string, unknown> = {}
    if (scrapedData) {
      try { scraped = typeof scrapedData === 'string' ? JSON.parse(scrapedData) : scrapedData } catch { scraped = {} }
    }
    
    let state: InterviewState = interviewState || {
      currentPhase: 'intro',
      phasesCompleted: [],
      extractedInfo: {},
      questionsAskedInPhase: 0,
      totalExchanges: messages?.length ? Math.floor(messages.length / 2) : 0,
      confidence: {},
    }
    
    const businessType = scraped.businessType as string || state.extractedInfo.businessType || 'default'
    const industryCategory = getIndustryCategory(businessType)
    const currentPhaseIndex = INTERVIEW_PHASES.findIndex(p => p.id === state.currentPhase)
    const currentPhase = INTERVIEW_PHASES[currentPhaseIndex] || INTERVIEW_PHASES[0]
    const knownInfo = buildKnownInfoContext(scraped, state.extractedInfo)

    // Phase labels for the prompt
    const phaseLabels: Record<string, string> = {
      intro: 'Confirmación rápida del negocio',
      services: 'Servicios, productos y precios',
      hours: 'Horarios de atención',
      appointments: 'Cómo se reserva o contrata',
      faqs: 'Preguntas que hacen los clientes',
      escalation: 'Cuándo pasar a un humano',
    }

    const systemPrompt = `Eres un entrevistador experto que APRENDE sobre un negocio para configurar su recepcionista AI. Hablas por voz así que sé ULTRA breve.

REGLAS ESTRICTAS:
- MÁXIMO 1 oración + 1 pregunta directa. NUNCA más de 2 frases.
- Haz preguntas CONCRETAS y ESPECÍFICAS. No digas "¿algo más?" ni "¿quieres añadir algo?".
- Si tienes info del scraping, MENCIONA lo que ya sabes y pregunta lo que FALTA: "Vi que abrís de nueve a seis, ¿cerráis algún día?"
- AVANZA RÁPIDO. Una vez tengas la info clave de esta fase, pon topicComplete: true.
- NUNCA repitas lo que el usuario ya dijo.
- Habla como en una llamada real: rápido, directo, natural.

FORMATO DE NÚMEROS PARA VOZ:
- Escribe horas en palabras: "de nueve a seis", "a las tres y media" (NUNCA "9:00", "18:00", "15:30")
- Escribe cifras como se dicen: "cincuenta euros", "dos mil" (NUNCA "50€", "2000")
- Porcentajes en palabras: "el veinte por ciento" (NUNCA "20%")

ESPAÑOL NATURAL:
- Castellano peninsular, tutea al usuario
- Tono cercano y directo como un colega

LO QUE YA SÉ DEL NEGOCIO:
${knownInfo || 'Nada aún'}

FASE ACTUAL: ${phaseLabels[state.currentPhase] || state.currentPhase} (intercambio ${state.questionsAskedInPhase + 1} de ${currentPhase.maxExchanges})
TIPO: ${businessType} (${industryCategory})

EJEMPLOS DE PREGUNTAS DIRECTAS POR FASE:
- intro: "He visto que sois una clínica dental en Madrid, ¿es correcto?"
- services: "¿Cuáles son los tres servicios que más pedís y a qué precio?"
- hours: "¿De qué hora a qué hora abrís entre semana?"
- appointments: "Cuando alguien llama para pedir cita, ¿cómo funciona?"
- faqs: "¿Cuál es la pregunta que más os hacen los clientes por teléfono?"
- escalation: "¿En qué situaciones debería la AI pasar la llamada a una persona real?"

Responde SOLO JSON:
{"text":"tu frase breve + pregunta directa","topicComplete":false,"interviewComplete":false,"extractedFromLastResponse":{}}`

    const formattedMessages = (messages || []).map((m: Message) => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.text,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',            // Much faster than gpt-4o
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      temperature: 0.6,
      max_tokens: 150,                   // Force brevity
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(content)
      
      if (parsed.extractedFromLastResponse) {
        state.extractedInfo = mergeExtractedInfo(state.extractedInfo, parsed.extractedFromLastResponse)
      }
      
      state.questionsAskedInPhase++
      state.totalExchanges++
      
      // ALWAYS advance after max exchanges — no getting stuck
      let topicComplete = parsed.topicComplete || false
      if (state.questionsAskedInPhase >= currentPhase.maxExchanges) {
        topicComplete = true
      }
      
      let interviewComplete = parsed.interviewComplete || false
      
      if (topicComplete && !interviewComplete) {
        state.phasesCompleted.push(state.currentPhase)
        const nextPhaseIndex = currentPhaseIndex + 1
        if (nextPhaseIndex < INTERVIEW_PHASES.length) {
          state.currentPhase = INTERVIEW_PHASES[nextPhaseIndex].id
          state.questionsAskedInPhase = 0
        } else {
          interviewComplete = true
        }
      }
      
      // Hard cap: 8 total exchanges
      if (state.totalExchanges >= 8) {
        interviewComplete = true
      }
      
      return NextResponse.json({
        text: parsed.text || '¿Puedes repetir?',
        topicComplete,
        interviewComplete,
        extractedInfo: state.extractedInfo,
        interviewState: state,
        currentPhase: state.currentPhase,
        phasesCompleted: state.phasesCompleted,
        confidence: state.confidence,
        progress: {
          current: state.phasesCompleted.length,
          total: INTERVIEW_PHASES.length,
          percentage: Math.round((state.phasesCompleted.length / INTERVIEW_PHASES.length) * 100),
        },
      })
    } catch {
      // If JSON parse fails, still advance
      state.questionsAskedInPhase++
      state.totalExchanges++
      if (state.questionsAskedInPhase >= currentPhase.maxExchanges) {
        state.phasesCompleted.push(state.currentPhase)
        const nextPhaseIndex = currentPhaseIndex + 1
        if (nextPhaseIndex < INTERVIEW_PHASES.length) {
          state.currentPhase = INTERVIEW_PHASES[nextPhaseIndex].id
          state.questionsAskedInPhase = 0
        }
      }
      return NextResponse.json({
        text: content,
        topicComplete: false,
        interviewComplete: false,
        interviewState: state,
        currentPhase: state.currentPhase,
        phasesCompleted: state.phasesCompleted,
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({
      text: 'Disculpa, hubo un fallo. ¿Puedes repetir?',
      topicComplete: false,
      interviewComplete: false,
    })
  }
}

function buildKnownInfoContext(scraped: Record<string, unknown>, extracted: ExtractedInfo): string {
  const parts: string[] = []
  const name = extracted.businessName || scraped.businessName
  const type = extracted.businessType || scraped.businessType
  const desc = extracted.description || scraped.description
  if (name) parts.push(`Nombre: ${name}`)
  if (type) parts.push(`Tipo: ${type}`)
  if (desc) parts.push(`Descripción: ${desc}`)
  const services = extracted.services || scraped.services
  if (services && Array.isArray(services) && services.length > 0) {
    parts.push(`Servicios: ${services.map((s: { name: string; price?: string }) => s.price ? `${s.name} (${s.price})` : s.name).join(', ')}`)
  }
  const hours = extracted.hours || scraped.hours
  if (hours) parts.push(`Horarios: ${typeof hours === 'string' ? hours : JSON.stringify(hours)}`)
  if (scraped.phone) parts.push(`Tel: ${scraped.phone}`)
  if (scraped.email) parts.push(`Email: ${scraped.email}`)
  if (scraped.address) parts.push(`Dirección: ${scraped.address}`)
  const faqs = extracted.faqs || scraped.faqs
  if (faqs && Array.isArray(faqs) && faqs.length > 0) parts.push(`FAQs: ${faqs.length}`)
  if (scraped.differentiators && Array.isArray(scraped.differentiators)) parts.push(`Diferenciadores: ${(scraped.differentiators as string[]).join(', ')}`)
  return parts.join('\n')
}

function mergeExtractedInfo(existing: ExtractedInfo, newInfo: Partial<ExtractedInfo>): ExtractedInfo {
  const merged = { ...existing }
  for (const [key, value] of Object.entries(newInfo)) {
    if (value === undefined || value === null || value === '') continue
    const typedKey = key as keyof ExtractedInfo
    if (Array.isArray(value) && Array.isArray(merged[typedKey])) {
      const existingArray = merged[typedKey] as unknown[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(merged as any)[typedKey] = [...existingArray, ...value]
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(merged as any)[typedKey] = value
    }
  }
  return merged
}
