/**
 * Interview Agent - Voice-First Onboarding
 * 
 * This agent INTERVIEWS the business owner to learn about their business.
 * It's conversational, friendly, and extracts key information.
 */

import OpenAI from 'openai'
import { indexBusinessContent } from '../pipeline/rag'

const openai = new OpenAI()

// Topics to cover during interview
const INTERVIEW_TOPICS = [
  'business_confirmation',  // Confirm scraped data
  'services',               // What services do you offer?
  'hours',                  // Operating hours
  'appointments',           // How to handle appointments
  'faqs',                   // Common questions
  'escalation',             // When to transfer
  'personality',            // Tone and style
] as const

type InterviewTopic = typeof INTERVIEW_TOPICS[number]

interface ScrapedData {
  businessName?: string
  services?: string[]
  hours?: string
  phone?: string
  address?: string
  description?: string
}

interface InterviewState {
  businessId: string
  scrapedData: ScrapedData
  currentTopic: InterviewTopic
  topicsCompleted: InterviewTopic[]
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  extractedInfo: Record<string, any>
}

export class InterviewAgent {
  private state: InterviewState
  private onInfoExtracted?: (info: Record<string, any>) => void

  constructor(
    businessId: string,
    scrapedData: ScrapedData = {},
    onInfoExtracted?: (info: Record<string, any>) => void
  ) {
    this.state = {
      businessId,
      scrapedData,
      currentTopic: 'business_confirmation',
      topicsCompleted: [],
      conversationHistory: [],
      extractedInfo: {},
    }
    this.onInfoExtracted = onInfoExtracted
  }

  /**
   * Generate the opening greeting
   */
  getGreeting(): string {
    const name = this.state.scrapedData.businessName || 'tu negocio'
    
    if (this.state.scrapedData.businessName) {
      return `¡Hola! Soy tu nueva recepcionista AI de Recepcionista.com. ` +
        `He estado investigando sobre ${name} y me encantaría conocer más detalles ` +
        `para poder atender mejor a tus clientes. ¿Tienes unos cinco minutos para charlar?`
    } else {
      return `¡Hola! Soy tu nueva recepcionista AI de Recepcionista.com. ` +
        `Me encantaría conocer tu negocio para poder atender a tus clientes. ` +
        `¿Tienes unos cinco minutos para contarme sobre lo que hacéis?`
    }
  }

  /**
   * Process user response and generate next question
   */
  async processResponse(userInput: string): Promise<{
    response: string
    isComplete: boolean
    extractedInfo?: Record<string, any>
  }> {
    // Add to history
    this.state.conversationHistory.push({ role: 'user', content: userInput })

    // Build system prompt for current topic
    const systemPrompt = this.buildSystemPrompt()

    // Generate response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...this.state.conversationHistory.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 200,
      temperature: 0.8, // Slightly higher for more natural conversation
    })

    const aiResponse = response.choices[0].message.content || ''
    
    // Add to history
    this.state.conversationHistory.push({ role: 'assistant', content: aiResponse })

    // Extract information from the exchange
    await this.extractInfoFromExchange(userInput, aiResponse)

    // Check if we should move to next topic
    const shouldAdvance = await this.shouldAdvanceTopic(userInput, aiResponse)
    if (shouldAdvance) {
      this.advanceToNextTopic()
    }

    // Check if interview is complete
    const isComplete = this.state.topicsCompleted.length >= INTERVIEW_TOPICS.length - 1

    if (isComplete) {
      // Final extraction and indexing
      await this.finalizeInterview()
    }

    return {
      response: aiResponse,
      isComplete,
      extractedInfo: isComplete ? this.state.extractedInfo : undefined,
    }
  }

  private buildSystemPrompt(): string {
    const scraped = this.state.scrapedData
    const topic = this.state.currentTopic
    const completed = this.state.topicsCompleted

    let topicInstructions = ''
    
    switch (topic) {
      case 'business_confirmation':
        topicInstructions = scraped.businessName
          ? `Confirma que el negocio se llama "${scraped.businessName}" y pregunta si es correcto. ` +
            `Si tienen descripción, confírmala también.`
          : `Pregunta el nombre del negocio y a qué se dedican.`
        break
        
      case 'services':
        const knownServices = scraped.services?.join(', ') || 'ninguno conocido'
        topicInstructions = `Pregunta sobre los servicios que ofrecen. ` +
          `Servicios ya conocidos: ${knownServices}. ` +
          `Pregunta por precios si es apropiado, y duración de los servicios.`
        break
        
      case 'hours':
        topicInstructions = scraped.hours
          ? `Confirma el horario: "${scraped.hours}". Pregunta si es correcto y si hay excepciones.`
          : `Pregunta por el horario de atención, incluyendo fines de semana.`
        break
        
      case 'appointments':
        topicInstructions = `Pregunta cómo quieren manejar las citas: ` +
          `¿Se pueden reservar por teléfono? ¿Con cuánta antelación? ` +
          `¿Política de cancelaciones?`
        break
        
      case 'faqs':
        topicInstructions = `Pregunta cuáles son las preguntas más frecuentes de sus clientes. ` +
          `¿Qué información piden más? ¿Hay promociones actuales?`
        break
        
      case 'escalation':
        topicInstructions = `Pregunta cuándo deberías transferir la llamada a un humano. ` +
          `¿Hay un número para urgencias? ¿Quién maneja casos complejos?`
        break
        
      case 'personality':
        topicInstructions = `Pregunta sobre el tono preferido: ¿formal o cercano? ` +
          `¿Hay frases o nombres que debas usar? ¿Algún idioma adicional?`
        break
    }

    return `Eres un agente de onboarding amigable para Recepcionista.com.
Estás ENTREVISTANDO a un dueño de negocio para aprender sobre su empresa.

INFORMACIÓN PREVIA DEL SITIO WEB:
- Nombre: ${scraped.businessName || 'No conocido'}
- Servicios: ${scraped.services?.join(', ') || 'No conocidos'}
- Horario: ${scraped.hours || 'No conocido'}
- Teléfono: ${scraped.phone || 'No conocido'}
- Descripción: ${scraped.description || 'No conocida'}

TEMAS YA CUBIERTOS: ${completed.join(', ') || 'Ninguno'}
TEMA ACTUAL: ${topic}

INSTRUCCIONES PARA ESTE TEMA:
${topicInstructions}

REGLAS GENERALES:
- Sé conversacional y amigable, como un colega nuevo
- Haz UNA pregunta a la vez, no bombardees
- Si ya sabes algo del sitio web, confirma en lugar de preguntar de nuevo
- Si el usuario no sabe algo, di "no te preocupes" y sigue adelante
- Usa español de España naturalmente
- Mantén respuestas BREVES (2-3 oraciones máximo)
- Cuando tengas suficiente info del tema, agradece y pasa al siguiente

Si el usuario indica que quiere terminar o no tiene más que añadir, 
responde con un resumen amigable de lo aprendido y despídete.`
  }

  private async extractInfoFromExchange(userInput: string, aiResponse: string): Promise<void> {
    // Use GPT-4o-mini to extract structured info from the exchange
    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extrae información estructurada de esta conversación.
Responde SOLO con JSON válido. Si no hay información relevante, responde {}.

Campos posibles:
- businessName: string
- businessType: string
- services: [{name, price?, duration?}]
- hours: [{day, open, close}]
- appointmentRules: string
- faqs: [{question, answer}]
- transferRules: {urgencies?, complexCases?, vipCustomers?}
- tone: string
- languages: string[]`,
        },
        {
          role: 'user',
          content: `Tema actual: ${this.state.currentTopic}\n\nUsuario: ${userInput}\n\nAsistente: ${aiResponse}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    try {
      const extracted = JSON.parse(extraction.choices[0].message.content || '{}')
      
      // Merge with existing info
      this.state.extractedInfo = {
        ...this.state.extractedInfo,
        ...extracted,
        // Merge arrays instead of replacing
        services: [
          ...(this.state.extractedInfo.services || []),
          ...(extracted.services || []),
        ],
        faqs: [
          ...(this.state.extractedInfo.faqs || []),
          ...(extracted.faqs || []),
        ],
      }

      // Notify callback
      if (this.onInfoExtracted) {
        this.onInfoExtracted(this.state.extractedInfo)
      }
    } catch (e) {
      // Ignore extraction errors
    }
  }

  private async shouldAdvanceTopic(userInput: string, aiResponse: string): Promise<boolean> {
    // Simple heuristic: advance after 2-3 exchanges per topic
    const topicExchanges = this.state.conversationHistory.filter((_, i) => 
      i >= this.state.conversationHistory.length - 6
    ).length

    if (topicExchanges >= 4) return true

    // Check if AI's response indicates topic is complete
    const completionPhrases = [
      'perfecto',
      'genial',
      'entendido',
      'siguiente',
      'ahora',
      'pasemos',
    ]
    
    return completionPhrases.some(phrase => 
      aiResponse.toLowerCase().includes(phrase)
    )
  }

  private advanceToNextTopic(): void {
    this.state.topicsCompleted.push(this.state.currentTopic)
    
    const currentIndex = INTERVIEW_TOPICS.indexOf(this.state.currentTopic)
    if (currentIndex < INTERVIEW_TOPICS.length - 1) {
      this.state.currentTopic = INTERVIEW_TOPICS[currentIndex + 1]
    }
  }

  private async finalizeInterview(): Promise<void> {
    // Generate final summary
    const fullTranscript = this.state.conversationHistory
      .map(m => `${m.role === 'user' ? 'Usuario' : 'AI'}: ${m.content}`)
      .join('\n')

    // Index the raw transcript
    await indexBusinessContent(
      this.state.businessId,
      [fullTranscript],
      'interview_transcript'
    )

    // Index extracted information as structured text
    const info = this.state.extractedInfo
    const textsToIndex: string[] = []

    if (info.businessName) {
      textsToIndex.push(`Nombre del negocio: ${info.businessName}`)
    }

    if (info.services?.length) {
      for (const service of info.services) {
        let text = `Servicio: ${service.name}`
        if (service.price) text += `. Precio: ${service.price}`
        if (service.duration) text += `. Duración: ${service.duration}`
        textsToIndex.push(text)
      }
    }

    if (info.hours?.length) {
      const hoursText = info.hours
        .map((h: any) => `${h.day}: ${h.open} a ${h.close}`)
        .join(', ')
      textsToIndex.push(`Horario de atención: ${hoursText}`)
    }

    if (info.faqs?.length) {
      for (const faq of info.faqs) {
        textsToIndex.push(`Pregunta frecuente: ${faq.question}\nRespuesta: ${faq.answer}`)
      }
    }

    if (info.appointmentRules) {
      textsToIndex.push(`Política de citas: ${info.appointmentRules}`)
    }

    if (info.transferRules) {
      textsToIndex.push(`Reglas de transferencia: ${JSON.stringify(info.transferRules)}`)
    }

    // Index all structured info
    if (textsToIndex.length > 0) {
      await indexBusinessContent(
        this.state.businessId,
        textsToIndex,
        'interview_extracted'
      )
    }

    console.log(`✅ Interview complete. Indexed ${textsToIndex.length} pieces of info.`)
  }

  /**
   * Get the current state for persistence
   */
  getState(): InterviewState {
    return this.state
  }

  /**
   * Restore from persisted state
   */
  static fromState(state: InterviewState): InterviewAgent {
    const agent = new InterviewAgent(state.businessId, state.scrapedData)
    agent.state = state
    return agent
  }
}
