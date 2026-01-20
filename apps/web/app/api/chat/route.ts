import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface Message {
  role: 'assistant' | 'user'
  text: string
}

/**
 * AI Chat for the onboarding interview
 * Uses GPT-4o to conduct a natural conversation about the business
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, topic, scrapedData } = await request.json()

    const systemPrompt = `Eres una asistente amable que está entrevistando a un dueño de negocio para configurar su recepcionista AI.

INFORMACIÓN DEL NEGOCIO YA RECOPILADA:
${scrapedData || 'Ninguna'}

TU OBJETIVO:
- Recopilar información sobre el negocio de forma natural y conversacional
- Preguntar sobre: servicios, precios, horarios, cómo agendar citas, preguntas frecuentes, y cuándo transferir a un humano
- Ser breve y conciso en tus respuestas (2-3 oraciones máximo)
- Ser cálida y profesional

IMPORTANTE - ESPAÑOL DE ESPAÑA:
- Habla EXCLUSIVAMENTE en español de España (castellano peninsular)
- Usa "vosotros" cuando sea apropiado, "ordenador" en lugar de "computadora", "móvil" en lugar de "celular"
- Usa expresiones y vocabulario típicos de España
- El tono debe ser profesional pero cercano, como hablarías con un cliente en España
- Evita traducciones literales del inglés
- NO uses español latinoamericano

TEMA ACTUAL: ${topic || 'general'}

INSTRUCCIONES:
- Si el usuario da información útil, agradece brevemente y pasa a la siguiente pregunta
- Si no entiendes algo, pide que lo repita de forma amable
- Después de cubrir un tema, responde con la información y pregunta sobre el siguiente
- Cuando tengas suficiente información de todos los temas, indica que la entrevista está completa

Responde en JSON con este formato:
{
  "text": "Tu respuesta aquí",
  "topicComplete": true/false,
  "interviewComplete": true/false
}`

    const formattedMessages = messages.map((m: Message) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(content)
      return NextResponse.json({
        text: parsed.text || 'Lo siento, no entendí. ¿Puedes repetir?',
        topicComplete: parsed.topicComplete || false,
        interviewComplete: parsed.interviewComplete || false,
      })
    } catch {
      return NextResponse.json({
        text: content,
        topicComplete: false,
        interviewComplete: false,
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
