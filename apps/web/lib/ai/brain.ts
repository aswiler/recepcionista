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
}

/**
 * Generate a response for a customer query
 */
export async function generateResponse(
  businessId: string,
  businessName: string,
  userMessage: string,
  channel: 'voice' | 'whatsapp' = 'voice'
): Promise<AIResponse> {
  // 1. Get relevant context from Pinecone
  const context = await getBusinessContext(businessId, userMessage)
  
  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt(businessName, context, channel)
  
  // 3. Generate response with OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Fast and cheap
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: channel === 'voice' ? 150 : 300, // Shorter for voice
    temperature: 0.7,
  })
  
  const text = response.choices[0].message.content || 'Lo siento, no he entendido.'
  
  // 4. Check if should transfer to human
  const shouldTransfer = checkShouldTransfer(text, context)
  
  return {
    text,
    shouldTransfer,
    confidence: context ? 0.9 : 0.6,
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
  channel: 'voice' | 'whatsapp'
): string {
  const channelInstructions = channel === 'voice'
    ? 'Mantén las respuestas muy breves (1-2 oraciones). Habla de forma natural y conversacional.'
    : 'Puedes usar respuestas más detalladas. Usa emojis moderadamente.'
  
  return `Eres una recepcionista AI profesional para ${businessName}.

${context ? `INFORMACIÓN DEL NEGOCIO:\n${context}\n` : ''}

INSTRUCCIONES:
- Responde en español de manera natural y profesional
- ${channelInstructions}
- Si no tienes información para responder, ofrece transferir a un humano
- Usa un tono cálido y amigable
- Nunca inventes información que no esté en el contexto`
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
