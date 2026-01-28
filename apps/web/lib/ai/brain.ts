/**
 * AI Brain - Core intelligence for voice and WhatsApp
 * 
 * This is the ENTIRE AI logic. ~80 lines of code.
 * Replaces: unified_agent.py, pinecone_client.py, optimized_pinecone.py, embeddings.py
 */

import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI()
const pinecone = new Pinecone()

const INDEX_NAME = 'recepcionista'

// Types
export interface AIResponse {
  text: string
  shouldTransfer: boolean
  confidence: number
  toolCalls?: ToolCallResult[]
}

export interface ToolCallResult {
  tool: string
  args: Record<string, unknown>
  result: Record<string, unknown>
}

// Calendar tool definitions for OpenAI function calling
const calendarTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Comprueba la disponibilidad del calendario para una fecha específica. Usa esto cuando el cliente pregunte por citas disponibles.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'La fecha para comprobar disponibilidad en formato YYYY-MM-DD',
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
      description: 'Reserva una cita en el calendario. Usa esto cuando el cliente confirme una reserva.',
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
        },
        required: ['date', 'time', 'customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_next_available',
      description: 'Obtiene los próximos huecos disponibles. Usa esto cuando el cliente quiera saber cuándo hay citas disponibles sin especificar fecha.',
      parameters: {
        type: 'object',
        properties: {
          preferred_time: {
            type: 'string',
            enum: ['morning', 'afternoon', 'any'],
            description: 'Preferencia de horario: mañana (morning), tarde (afternoon), o cualquiera (any)',
          },
        },
        required: [],
      },
    },
  },
]

/**
 * Generate a response for a customer query
 * @param options.enableCalendar - Whether to enable calendar tools (requires calendar integration)
 */
export async function generateResponse(
  businessId: string,
  businessName: string,
  userMessage: string,
  channel: 'voice' | 'whatsapp' = 'voice',
  options?: { enableCalendar?: boolean; conversationHistory?: Array<{role: string; content: string}> }
): Promise<AIResponse> {
  // 1. Get relevant context from Pinecone
  const context = await getBusinessContext(businessId, userMessage)
  
  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt(businessName, context, channel, options?.enableCalendar)
  
  // 3. Build messages array with optional conversation history
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ]
  
  if (options?.conversationHistory) {
    for (const msg of options.conversationHistory.slice(-10)) { // Last 10 messages
      messages.push({ 
        role: msg.role as 'user' | 'assistant', 
        content: msg.content 
      })
    }
  }
  
  messages.push({ role: 'user', content: userMessage })
  
  // 4. Generate response with OpenAI (with tools if calendar enabled)
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: channel === 'voice' ? 150 : 300,
    temperature: 0.7,
    ...(options?.enableCalendar ? { tools: calendarTools, tool_choice: 'auto' } : {}),
  })
  
  const message = response.choices[0].message
  const toolCalls: ToolCallResult[] = []
  
  // 5. Handle tool calls if any
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name
      const toolArgs = JSON.parse(toolCall.function.arguments)
      
      // Execute the tool
      const toolResult = await executeCalendarTool(toolName, toolArgs, businessId)
      
      toolCalls.push({
        tool: toolName,
        args: toolArgs,
        result: toolResult,
      })
    }
    
    // Get final response incorporating tool results
    const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...messages,
      message as OpenAI.Chat.ChatCompletionMessageParam,
      ...message.tool_calls.map((tc, i) => ({
        role: 'tool' as const,
        tool_call_id: tc.id,
        content: JSON.stringify(toolCalls[i].result),
      })),
    ]
    
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: toolMessages,
      max_tokens: channel === 'voice' ? 150 : 300,
      temperature: 0.7,
    })
    
    const text = finalResponse.choices[0].message.content || 'Lo siento, no he entendido.'
    const shouldTransfer = checkShouldTransfer(text, context)
    
    return {
      text,
      shouldTransfer,
      confidence: 0.95,
      toolCalls,
    }
  }
  
  const text = message.content || 'Lo siento, no he entendido.'
  
  // 6. Check if should transfer to human
  const shouldTransfer = checkShouldTransfer(text, context)
  
  return {
    text,
    shouldTransfer,
    confidence: context ? 0.9 : 0.6,
  }
}

/**
 * Execute a calendar tool
 */
async function executeCalendarTool(
  toolName: string,
  args: Record<string, unknown>,
  businessId: string
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
  
  try {
    switch (toolName) {
      case 'check_availability': {
        const response = await fetch(`${baseUrl}/api/calendar/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            date: args.date,
          }),
        })
        return await response.json()
      }
      
      case 'book_appointment': {
        const response = await fetch(`${baseUrl}/api/calendar/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            date: args.date,
            time: args.time,
            customerName: args.customer_name,
            customerPhone: args.customer_phone,
            serviceType: args.service_type,
          }),
        })
        return await response.json()
      }
      
      case 'get_next_available': {
        const response = await fetch(`${baseUrl}/api/calendar/next-available`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            preferredTime: args.preferred_time,
          }),
        })
        return await response.json()
      }
      
      default:
        return { success: false, message: 'Herramienta no reconocida' }
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error)
    return { 
      success: false, 
      message: 'Ha habido un problema técnico. Por favor, inténtalo de nuevo.' 
    }
  }
}

/**
 * Get relevant business context from Pinecone
 */
export async function getBusinessContext(
  businessId: string,
  query: string
): Promise<string> {
  try {
    // Generate embedding for the query
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    
    // Query Pinecone
    const index = pinecone.index(INDEX_NAME)
    const results = await index.namespace(`biz_${businessId}`).query({
      vector: embedding.data[0].embedding,
      topK: 5,
      includeMetadata: true,
    })
    
    // Extract text from results
    return results.matches
      .filter(m => m.score && m.score > 0.7) // Only relevant results
      .map(m => m.metadata?.text || '')
      .join('\n\n')
  } catch (error) {
    console.error('Error querying Pinecone:', error)
    return ''
  }
}

/**
 * Index business content in Pinecone
 */
export async function indexBusinessContent(
  businessId: string,
  texts: string[],
  source: string = 'manual'
): Promise<number> {
  if (!texts.length) return 0
  
  // Generate embeddings
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  
  // Prepare vectors
  const vectors = texts.map((text, i) => ({
    id: `${businessId}-${source}-${Date.now()}-${i}`,
    values: embeddings.data[i].embedding,
    metadata: {
      text: text.slice(0, 2000), // Truncate for storage
      source,
      businessId,
      indexedAt: new Date().toISOString(),
    },
  }))
  
  // Upsert to Pinecone
  const index = pinecone.index(INDEX_NAME)
  await index.namespace(`biz_${businessId}`).upsert(vectors)
  
  return vectors.length
}

/**
 * Delete all business content from Pinecone
 */
export async function deleteBusinessContent(businessId: string): Promise<void> {
  const index = pinecone.index(INDEX_NAME)
  await index.namespace(`biz_${businessId}`).deleteAll()
}

// Helper functions

function buildSystemPrompt(
  businessName: string,
  context: string,
  channel: 'voice' | 'whatsapp',
  enableCalendar?: boolean
): string {
  const channelInstructions = channel === 'voice'
    ? 'Mantén las respuestas muy breves (1-2 oraciones). Habla de forma natural y conversacional.'
    : 'Puedes usar respuestas más detalladas. Usa emojis moderadamente.'
  
  const calendarInstructions = enableCalendar
    ? `
GESTIÓN DE CITAS:
- Puedes consultar la disponibilidad del calendario y reservar citas
- Cuando el cliente pregunte por citas disponibles, usa la herramienta check_availability
- Si quiere saber los próximos huecos sin fecha específica, usa get_next_available
- Cuando confirme una reserva, usa book_appointment pidiendo nombre y datos de contacto
- Siempre confirma los detalles de la cita al cliente después de reservar`
    : ''
  
  return `Eres una recepcionista AI profesional para ${businessName}.

${context ? `INFORMACIÓN DEL NEGOCIO:\n${context}\n` : ''}

INSTRUCCIONES:
- Responde en español de manera natural y profesional
- ${channelInstructions}
- Si no tienes información para responder, ofrece transferir a un humano
- Usa un tono cálido y amigable
- Nunca inventes información que no esté en el contexto
${calendarInstructions}`
}

function checkShouldTransfer(response: string, context: string): boolean {
  const transferPhrases = [
    'transferir',
    'humano',
    'persona',
    'no tengo información',
    'no puedo ayudar',
  ]
  
  const lowerResponse = response.toLowerCase()
  return transferPhrases.some(phrase => lowerResponse.includes(phrase)) || !context
}
