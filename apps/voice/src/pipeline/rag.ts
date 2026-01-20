/**
 * RAG - Retrieval from Pinecone
 * 
 * Shared with web app via package
 */

import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI()
const pinecone = new Pinecone()

const INDEX_NAME = 'recepcionista'

/**
 * Get relevant business context from Pinecone
 */
export async function getBusinessContext(
  businessId: string,
  query: string
): Promise<string> {
  try {
    // Generate embedding
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

    // Filter by relevance score
    const relevant = results.matches.filter(m => m.score && m.score > 0.7)
    
    return relevant
      .map(m => m.metadata?.text || '')
      .join('\n\n')
  } catch (error) {
    console.error('RAG error:', error)
    return ''
  }
}
