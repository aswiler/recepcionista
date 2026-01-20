/**
 * LLM using Groq
 * 
 * Fast inference (~50ms) with Llama 3.3 70B
 */

import Groq from 'groq-sdk'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GenerateParams {
  systemPrompt: string
  userMessage: string
  history: Message[]
}

export class GroqLLM {
  private client: Groq

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  async generate(params: GenerateParams): Promise<string> {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: params.userMessage },
    ]

    const startTime = Date.now()
    
    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast and smart
      messages,
      max_tokens: 150, // Short for voice
      temperature: 0.7,
    })

    const latency = Date.now() - startTime
    console.log(`⚡ Groq latency: ${latency}ms`)

    return response.choices[0]?.message?.content || ''
  }
}
