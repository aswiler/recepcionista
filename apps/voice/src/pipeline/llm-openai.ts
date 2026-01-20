/**
 * LLM using OpenAI GPT-4o / GPT-4o-mini
 * 
 * Best quality for:
 * - Spanish language understanding
 * - Context awareness
 * - Natural conversation
 * - Complex request handling
 * - Function calling for calendar operations
 */

import OpenAI from 'openai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GenerateParams {
  systemPrompt: string
  userMessage: string
  history: Message[]
  tools?: OpenAI.Chat.ChatCompletionTool[]
}

interface GenerateResult {
  content: string
  toolCalls?: OpenAI.Chat.ChatCompletionMessageToolCall[]
}

type ModelChoice = 'gpt-4o' | 'gpt-4o-mini'

export class OpenAILLM {
  private client: OpenAI
  private model: ModelChoice

  constructor(model: ModelChoice = 'gpt-4o-mini') {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = model
  }

  async generate(params: GenerateParams): Promise<string> {
    const result = await this.generateWithTools(params)
    return result.content
  }

  /**
   * Generate response with optional tool/function calling
   */
  async generateWithTools(params: GenerateParams): Promise<GenerateResult> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: params.userMessage },
    ]

    const startTime = Date.now()

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 150,
      temperature: 0.7,
      tools: params.tools,
      tool_choice: params.tools ? 'auto' : undefined,
    })

    const latency = Date.now() - startTime
    console.log(`🧠 OpenAI ${this.model} latency: ${latency}ms`)

    const choice = response.choices[0]
    
    return {
      content: choice?.message?.content || '',
      toolCalls: choice?.message?.tool_calls,
    }
  }

  /**
   * Continue conversation after tool execution
   */
  async continueAfterToolCall(params: {
    systemPrompt: string
    history: Message[]
    toolCallId: string
    toolName: string
    toolResult: string
  }): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      // Add the assistant's tool call
      {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: params.toolCallId,
          type: 'function',
          function: {
            name: params.toolName,
            arguments: '{}', // Not needed for continuation
          },
        }],
      },
      // Add the tool result
      {
        role: 'tool',
        tool_call_id: params.toolCallId,
        content: params.toolResult,
      },
    ]

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 150,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Stream response for even lower perceived latency
   * Start speaking before full response is generated
   */
  async *generateStream(params: GenerateParams): AsyncGenerator<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history,
      { role: 'user', content: params.userMessage },
    ]

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 150,
      temperature: 0.7,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}

/**
 * Advanced: Use streaming LLM + streaming TTS for lowest latency
 * 
 * Instead of waiting for full LLM response, start TTS as soon as
 * you have a complete sentence.
 */
export async function* streamWithSentenceDetection(
  llm: OpenAILLM,
  params: GenerateParams
): AsyncGenerator<string> {
  let buffer = ''
  const sentenceEnders = /[.!?。！？]/

  for await (const chunk of llm.generateStream(params)) {
    buffer += chunk

    // Check if we have a complete sentence
    const match = buffer.match(sentenceEnders)
    if (match) {
      const endIndex = buffer.lastIndexOf(match[0]) + 1
      const sentence = buffer.slice(0, endIndex).trim()
      buffer = buffer.slice(endIndex).trim()

      if (sentence) {
        yield sentence
      }
    }
  }

  // Yield any remaining text
  if (buffer.trim()) {
    yield buffer.trim()
  }
}
