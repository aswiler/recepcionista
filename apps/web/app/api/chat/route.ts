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

// Industry-specific question templates
const INDUSTRY_QUESTIONS: Record<string, Record<string, string[]>> = {
  // Healthcare/Medical
  healthcare: {
    services: [
      '¿Qué especialidades médicas o tratamientos ofrecéis?',
      '¿Trabajáis con seguros médicos? ¿Cuáles?',
      '¿Ofrecéis consultas de urgencia o solo con cita previa?',
    ],
    appointments: [
      '¿Cuánto dura una consulta típica?',
      '¿Con cuánta antelación hay que pedir cita?',
      '¿Hacéis recordatorios de citas? ¿Tenéis lista de espera?',
    ],
    faqs: [
      '¿Qué preguntas os hacen más los pacientes antes de venir?',
      '¿Hay algo que los pacientes deban traer o preparar antes de la cita?',
    ],
  },
  // Beauty/Salon
  salon: {
    services: [
      '¿Cuáles son vuestros servicios más populares y sus precios?',
      '¿Ofrecéis tratamientos especiales o packs?',
      '¿Trabajáis con productos específicos de alguna marca?',
    ],
    appointments: [
      '¿Cuánto duran los diferentes servicios?',
      '¿Se puede elegir estilista? ¿Tienen especialidades?',
      '¿Qué política tenéis para cancelaciones o cambios de cita?',
    ],
    faqs: [
      '¿Qué recomendaciones dais antes o después de un tratamiento?',
      '¿Hay alguna pregunta que os hagan constantemente los clientes?',
    ],
  },
  // Restaurant/Food
  restaurant: {
    services: [
      '¿Qué tipo de cocina ofrecéis? ¿Tenéis especialidades de la casa?',
      '¿Tenéis opciones vegetarianas, veganas o para alergias?',
      '¿Ofrecéis menú del día o solo carta?',
    ],
    appointments: [
      '¿Aceptáis reservas? ¿Con cuánta antelación?',
      '¿Hay un mínimo o máximo de comensales para reservar?',
      '¿Qué pasa si alguien llega tarde a su reserva?',
    ],
    faqs: [
      '¿Tenéis terraza, parking o acceso para sillas de ruedas?',
      '¿Hacéis eventos privados o catering?',
    ],
  },
  // Professional Services (Law, Consulting, etc.)
  professional: {
    services: [
      '¿En qué áreas os especializáis?',
      '¿Cómo funciona vuestra estructura de precios? ¿Por hora, proyecto, o retainer?',
      '¿Ofrecéis una consulta inicial gratuita?',
    ],
    appointments: [
      '¿Cómo es el proceso típico de trabajar con vosotros?',
      '¿Hacéis reuniones presenciales, online, o ambas?',
      '¿Cuánto dura un proyecto típico?',
    ],
    faqs: [
      '¿Qué os diferencia de otros profesionales del sector?',
      '¿Qué información necesitáis del cliente antes de empezar?',
    ],
  },
  // Tech/Software
  software: {
    services: [
      '¿Podéis explicarme en términos simples qué hace vuestro producto?',
      '¿Tenéis diferentes planes o versiones? ¿Cuáles son las diferencias?',
      '¿Ofrecéis prueba gratuita o demo?',
    ],
    appointments: [
      '¿Cómo es el proceso de onboarding para nuevos clientes?',
      '¿Cuánto tarda la implementación típicamente?',
      '¿Qué soporte ofrecéis? ¿Hay soporte 24/7?',
    ],
    faqs: [
      '¿Qué integraciones tenéis disponibles?',
      '¿Qué pasa si el cliente quiere cancelar? ¿Hay permanencia?',
      '¿Cuál es la pregunta técnica más común que os hacen?',
    ],
  },
  // Retail/E-commerce
  retail: {
    services: [
      '¿Cuáles son vuestros productos más vendidos?',
      '¿Tenéis tienda física además de online?',
      '¿Hacéis envíos? ¿Cuánto tardan y cuánto cuestan?',
    ],
    appointments: [
      '¿Cómo funciona el proceso de compra y pago?',
      '¿Cuál es vuestra política de devoluciones?',
      '¿Ofrecéis recogida en tienda?',
    ],
    faqs: [
      '¿Qué métodos de pago aceptáis?',
      '¿Tenéis programa de fidelización o descuentos?',
    ],
  },
  // Fitness/Gym
  fitness: {
    services: [
      '¿Qué tipo de clases o entrenamientos ofrecéis?',
      '¿Tenéis entrenadores personales? ¿Cuánto cuesta?',
      '¿Qué equipamiento tenéis disponible?',
    ],
    appointments: [
      '¿Hay que reservar para las clases o son drop-in?',
      '¿Cuáles son los horarios del centro?',
      '¿Qué tipos de membresías tenéis y cuánto cuestan?',
    ],
    faqs: [
      '¿Hay límite de acceso según el tipo de membresía?',
      '¿Qué política tenéis para pausar o cancelar membresías?',
    ],
  },
  // Default for unknown industries
  default: {
    services: [
      '¿Cuáles son vuestros servicios o productos principales?',
      '¿Podéis darme una idea de vuestros precios o rangos de precio?',
      '¿Qué os diferencia de vuestra competencia?',
    ],
    appointments: [
      '¿Cómo puede un cliente contrataros o compraros?',
      '¿Cuál es el proceso típico de trabajo con un nuevo cliente?',
      '¿Tenéis alguna política de cancelación o garantía?',
    ],
    faqs: [
      '¿Cuáles son las preguntas que más os hacen los clientes?',
      '¿Hay algo importante que los clientes deban saber antes de contrataros?',
    ],
  },
}

// Map business types to industry categories
function getIndustryCategory(businessType: string): string {
  const type = businessType.toLowerCase()
  
  if (type.includes('clinic') || type.includes('medic') || type.includes('doctor') || 
      type.includes('dentist') || type.includes('hospital') || type.includes('health') ||
      type.includes('clínica') || type.includes('médic') || type.includes('salud')) {
    return 'healthcare'
  }
  if (type.includes('salon') || type.includes('beauty') || type.includes('hair') || 
      type.includes('spa') || type.includes('peluquer') || type.includes('estétic') ||
      type.includes('belleza') || type.includes('barber')) {
    return 'salon'
  }
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('bar') || 
      type.includes('food') || type.includes('restaurante') || type.includes('comida') ||
      type.includes('catering') || type.includes('pizz')) {
    return 'restaurant'
  }
  if (type.includes('law') || type.includes('consult') || type.includes('account') || 
      type.includes('legal') || type.includes('abogad') || type.includes('asesor') ||
      type.includes('financ') || type.includes('coach')) {
    return 'professional'
  }
  if (type.includes('software') || type.includes('tech') || type.includes('app') || 
      type.includes('saas') || type.includes('digital') || type.includes('startup') ||
      type.includes('desarrollo') || type.includes('tecnolog')) {
    return 'software'
  }
  if (type.includes('shop') || type.includes('store') || type.includes('retail') || 
      type.includes('tienda') || type.includes('ecommerce') || type.includes('venta')) {
    return 'retail'
  }
  if (type.includes('gym') || type.includes('fitness') || type.includes('yoga') || 
      type.includes('sport') || type.includes('gimnasio') || type.includes('deporte') ||
      type.includes('pilates') || type.includes('crossfit')) {
    return 'fitness'
  }
  
  return 'default'
}

// Interview phases with what info we need from each
const INTERVIEW_PHASES = [
  {
    id: 'intro',
    name: 'Confirmación inicial',
    description: 'Confirmar información básica del negocio',
    requiredFields: ['businessName', 'businessType', 'description'],
    minExchanges: 1,
    maxExchanges: 2,
  },
  {
    id: 'services',
    name: 'Servicios y precios',
    description: 'Conocer servicios, productos y precios',
    requiredFields: ['services'],
    minExchanges: 2,
    maxExchanges: 4,
  },
  {
    id: 'hours',
    name: 'Horarios y contacto',
    description: 'Horarios de atención y datos de contacto',
    requiredFields: ['hours'],
    minExchanges: 1,
    maxExchanges: 2,
  },
  {
    id: 'appointments',
    name: 'Proceso de citas/compra',
    description: 'Cómo agendar, comprar o contratar',
    requiredFields: ['appointmentProcess'],
    minExchanges: 1,
    maxExchanges: 3,
  },
  {
    id: 'faqs',
    name: 'Preguntas frecuentes',
    description: 'Preguntas comunes de clientes',
    requiredFields: ['faqs'],
    minExchanges: 2,
    maxExchanges: 4,
  },
  {
    id: 'escalation',
    name: 'Transferencias',
    description: 'Cuándo transferir a un humano',
    requiredFields: ['transferRules'],
    minExchanges: 1,
    maxExchanges: 2,
  },
]

/**
 * AI Chat for the onboarding interview - ENHANCED VERSION
 * 
 * Features:
 * - Industry-adaptive questions based on business type
 * - Real-time information extraction
 * - Confidence-based topic progression
 * - Smart follow-up questions
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, topic, scrapedData, interviewState } = await request.json()
    
    // Parse scraped data if it's a string
    let scraped: Record<string, unknown> = {}
    if (scrapedData) {
      try {
        scraped = typeof scrapedData === 'string' ? JSON.parse(scrapedData) : scrapedData
      } catch {
        scraped = {}
      }
    }
    
    // Initialize or parse interview state
    let state: InterviewState = interviewState || {
      currentPhase: 'intro',
      phasesCompleted: [],
      extractedInfo: {},
      questionsAskedInPhase: 0,
      totalExchanges: messages?.length ? Math.floor(messages.length / 2) : 0,
      confidence: {},
    }
    
    // Get business type for industry-specific questions
    const businessType = scraped.businessType as string || state.extractedInfo.businessType || 'default'
    const industryCategory = getIndustryCategory(businessType)
    
    // Get current phase config
    const currentPhaseIndex = INTERVIEW_PHASES.findIndex(p => p.id === state.currentPhase)
    const currentPhase = INTERVIEW_PHASES[currentPhaseIndex] || INTERVIEW_PHASES[0]
    
    // Build context from scraped data
    const knownInfo = buildKnownInfoContext(scraped, state.extractedInfo)
    
    // Get industry-specific questions for current phase
    const industryQuestions = INDUSTRY_QUESTIONS[industryCategory]?.[currentPhase.id] || 
                             INDUSTRY_QUESTIONS.default[currentPhase.id] || []
    
    const systemPrompt = `Eres una asistente experta de Recepcionista.com que está entrevistando a un dueño de negocio para configurar su recepcionista AI. Tu objetivo es recopilar información detallada en una conversación natural y eficiente.

INFORMACIÓN DEL NEGOCIO YA CONOCIDA:
${knownInfo || 'Ninguna información previa'}

FASE ACTUAL: ${currentPhase.name} (${currentPhase.description})
Intercambios en esta fase: ${state.questionsAskedInPhase}/${currentPhase.maxExchanges}
Total de intercambios: ${state.totalExchanges}

TIPO DE NEGOCIO DETECTADO: ${businessType} (categoría: ${industryCategory})

PREGUNTAS SUGERIDAS PARA ESTA FASE Y TIPO DE NEGOCIO:
${industryQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

INSTRUCCIONES DE COMPORTAMIENTO:
1. Sé CONCISA pero INTELIGENTE - máximo 2-3 oraciones por respuesta
2. NUNCA repitas preguntas sobre información que ya conoces
3. Si el usuario da información útil, agradece brevemente y haz una pregunta de seguimiento RELEVANTE
4. Adapta tus preguntas al tipo específico de negocio
5. Si detectas que falta información crítica, pregunta específicamente por ella
6. Muestra que ENTIENDES el negocio haciendo preguntas específicas del sector
7. NO hagas preguntas genéricas - sé específica al tipo de negocio

ESPAÑOL DE ESPAÑA:
- Habla EXCLUSIVAMENTE en español de España (castellano peninsular)
- Usa "vosotros" cuando sea apropiado
- Usa vocabulario español: "móvil" (no "celular"), "ordenador" (no "computadora")
- Tono profesional pero cercano

CUÁNDO AVANZAR DE FASE:
- Avanza cuando tengas información clara sobre los campos requeridos: ${currentPhase.requiredFields.join(', ')}
- O cuando hayas alcanzado ${currentPhase.maxExchanges} intercambios en esta fase
- Si el usuario indica que no hay más info sobre un tema, avanza

Responde en JSON:
{
  "text": "Tu respuesta aquí (concisa, específica, inteligente)",
  "topicComplete": true/false (¿se puede avanzar de fase?),
  "interviewComplete": true/false (¿entrevista terminada?),
  "extractedFromLastResponse": {
    // Información extraída de la última respuesta del usuario (opcional, solo si hay nueva info)
    // Campos: businessName, businessType, description, services, hours, appointmentProcess, 
    //         cancellationPolicy, faqs, transferRules, tone, languages, specialInstructions, pricingNotes
  },
  "confidence": {
    // Nivel de confianza (0-100) en la información extraída de esta fase
    "${currentPhase.id}": 0-100
  },
  "suggestedNextPhase": "siguiente fase si topicComplete es true"
}`

    const formattedMessages = (messages || []).map((m: Message) => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.text,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(content)
      
      // Update state with extracted information
      if (parsed.extractedFromLastResponse) {
        state.extractedInfo = mergeExtractedInfo(state.extractedInfo, parsed.extractedFromLastResponse)
      }
      
      // Update confidence
      if (parsed.confidence) {
        state.confidence = { ...state.confidence, ...parsed.confidence }
      }
      
      // Update exchanges
      state.questionsAskedInPhase++
      state.totalExchanges++
      
      // Handle phase transitions
      let topicComplete = parsed.topicComplete || false
      let interviewComplete = parsed.interviewComplete || false
      
      // Auto-advance if max exchanges reached
      if (state.questionsAskedInPhase >= currentPhase.maxExchanges) {
        topicComplete = true
      }
      
      // Move to next phase if complete
      if (topicComplete && !interviewComplete) {
        state.phasesCompleted.push(state.currentPhase)
        
        // Find next phase
        const nextPhaseIndex = currentPhaseIndex + 1
        if (nextPhaseIndex < INTERVIEW_PHASES.length) {
          state.currentPhase = INTERVIEW_PHASES[nextPhaseIndex].id
          state.questionsAskedInPhase = 0
        } else {
          interviewComplete = true
        }
      }
      
      // Check if we should end the interview (all phases done or time-based)
      if (state.totalExchanges >= 15) {
        interviewComplete = true
      }
      
      return NextResponse.json({
        text: parsed.text || 'Lo siento, no entendí. ¿Puedes repetir?',
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
      text: 'Disculpa, hubo un problema. ¿Puedes repetir?',
      topicComplete: false,
      interviewComplete: false,
    })
  }
}

/**
 * Build a context string from known information
 */
function buildKnownInfoContext(scraped: Record<string, unknown>, extracted: ExtractedInfo): string {
  const parts: string[] = []
  
  // Business basics
  const name = extracted.businessName || scraped.businessName
  const type = extracted.businessType || scraped.businessType
  const desc = extracted.description || scraped.description
  
  if (name) parts.push(`Nombre: ${name}`)
  if (type) parts.push(`Tipo: ${type}`)
  if (desc) parts.push(`Descripción: ${desc}`)
  
  // Services
  const services = extracted.services || scraped.services
  if (services && Array.isArray(services) && services.length > 0) {
    const serviceList = services.map((s: { name: string; price?: string }) => 
      s.price ? `${s.name} (${s.price})` : s.name
    ).join(', ')
    parts.push(`Servicios conocidos: ${serviceList}`)
  }
  
  // Hours
  const hours = extracted.hours || scraped.hours
  if (hours) {
    parts.push(`Horarios: ${typeof hours === 'string' ? hours : JSON.stringify(hours)}`)
  }
  
  // Contact info
  if (scraped.phone) parts.push(`Teléfono: ${scraped.phone}`)
  if (scraped.email) parts.push(`Email: ${scraped.email}`)
  if (scraped.address) parts.push(`Dirección: ${scraped.address}`)
  
  // FAQs
  const faqs = extracted.faqs || scraped.faqs
  if (faqs && Array.isArray(faqs) && faqs.length > 0) {
    parts.push(`FAQs conocidas: ${faqs.length} preguntas`)
  }
  
  // Differentiators
  if (scraped.differentiators && Array.isArray(scraped.differentiators)) {
    parts.push(`Diferenciadores: ${(scraped.differentiators as string[]).join(', ')}`)
  }
  
  // Target audience
  if (scraped.targetAudience) parts.push(`Público objetivo: ${scraped.targetAudience}`)
  
  return parts.join('\n')
}

/**
 * Merge new extracted info with existing info
 */
function mergeExtractedInfo(existing: ExtractedInfo, newInfo: Partial<ExtractedInfo>): ExtractedInfo {
  const merged = { ...existing }
  
  for (const [key, value] of Object.entries(newInfo)) {
    if (value === undefined || value === null || value === '') continue
    
    const typedKey = key as keyof ExtractedInfo
    
    // For arrays, append new items
    if (Array.isArray(value) && Array.isArray(merged[typedKey])) {
      const existingArray = merged[typedKey] as unknown[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(merged as any)[typedKey] = [...existingArray, ...value]
    } else {
      // For other values, replace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(merged as any)[typedKey] = value
    }
  }
  
  return merged
}
