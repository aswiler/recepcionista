import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface ServiceDetail {
  name: string
  description?: string
  price?: string
  duration?: string
  popular?: boolean
}

interface FAQ {
  question: string
  answer: string
  category?: string
}

interface ScrapedData {
  businessName: string
  businessType: string
  tagline?: string
  description: string
  valueProposition: string
  targetAudience: string
  services: ServiceDetail[]
  hours?: string
  phone?: string
  email?: string
  address?: string
  website: string
  faqs: FAQ[]
  differentiators: string[]
  commonObjections: { objection: string; response: string }[]
  bookingInfo?: string
  paymentMethods?: string[]
  languages?: string[]
}

/**
 * Deep scrape a website and extract comprehensive business information
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    console.log(`🔍 Scraping: ${url}`)

    // 1. Get website content (with fallbacks)
    const content = await scrapeWebsite(url)
    console.log(`📄 Got ${content.length} chars`)

    // 2. Extract comprehensive data with GPT
    const scrapedData = await extractComprehensiveData(url, content)

    console.log(`✅ Extracted: ${scrapedData.businessName} with ${scrapedData.faqs.length} FAQs`)

    return NextResponse.json({ scrapedData })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    )
  }
}

/**
 * Scrape website with multiple fallbacks
 */
async function scrapeWebsite(url: string): Promise<string> {
  // Try Firecrawl first (with timeout)
  const apiKey = process.env.FIRECRAWL_API_KEY
  
  if (apiKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          pageOptions: {
            onlyMainContent: true,
          },
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (scrapeResponse.ok) {
        const data = await scrapeResponse.json()
        const content = data.data?.markdown || data.data?.content || ''
        if (content.length > 100) {
          console.log('✅ Firecrawl succeeded')
          return content
        }
      }
    } catch (e) {
      console.log('⚠️ Firecrawl failed, trying direct fetch:', e instanceof Error ? e.message : 'unknown')
    }
  }

  // Fallback: Direct HTML fetch
  try {
    console.log('📡 Trying direct fetch...')
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecepcionistaBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    
    if (response.ok) {
      const html = await response.text()
      // Extract text content from HTML (basic extraction)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 30000)
      
      console.log('✅ Direct fetch succeeded')
      return textContent
    }
  } catch (e) {
    console.log('⚠️ Direct fetch failed:', e instanceof Error ? e.message : 'unknown')
  }

  // Last resort: Return URL for GPT to infer from domain
  console.log('⚠️ All methods failed, GPT will infer from URL')
  return `Website URL: ${url}. Please infer business information based on the domain name and generate helpful FAQs for a typical business of this type.`
}

/**
 * Extract comprehensive business data using GPT
 */
async function extractComprehensiveData(
  websiteUrl: string,
  content: string
): Promise<ScrapedData> {
  const prompt = `Eres un experto en análisis de negocios. Analiza exhaustivamente este sitio web y extrae TODA la información posible para configurar un asistente virtual de atención al cliente.

SITIO WEB: ${websiteUrl}

CONTENIDO:
${content.slice(0, 30000)}

---

Extrae la información en el siguiente formato JSON. Para los campos que no encuentres explícitamente, INFIERE valores razonables basándote en el tipo de negocio y la industria:

{
  "businessName": "nombre exacto del negocio",
  "businessType": "tipo de negocio (ej: software, clínica, restaurante, etc.)",
  "tagline": "slogan o frase principal si existe",
  "description": "descripción detallada de qué hace el negocio (2-3 oraciones)",
  "valueProposition": "propuesta de valor principal - qué problema resuelve y para quién",
  "targetAudience": "público objetivo principal",
  
  "services": [
    {
      "name": "nombre del servicio/producto",
      "description": "descripción breve",
      "price": "precio si está disponible",
      "duration": "duración si aplica",
      "popular": true/false
    }
  ],
  
  "hours": "horario de atención si está disponible",
  "phone": "teléfono si está disponible",
  "email": "email de contacto si está disponible",
  "address": "dirección si está disponible",
  "website": "${websiteUrl}",
  
  "faqs": [
    {
      "question": "pregunta frecuente",
      "answer": "respuesta completa y útil",
      "category": "categoría (servicios, precios, proceso, soporte, etc.)"
    }
  ],
  
  "differentiators": ["qué hace único a este negocio vs competidores"],
  
  "commonObjections": [
    {
      "objection": "objeción típica de clientes potenciales",
      "response": "cómo responder a esa objeción"
    }
  ],
  
  "bookingInfo": "información sobre cómo agendar/contratar (si aplica)",
  "paymentMethods": ["métodos de pago aceptados"],
  "languages": ["idiomas en los que opera"]
}

INSTRUCCIONES IMPORTANTES PARA FAQs:
1. Genera AL MENOS 10-15 FAQs relevantes
2. Incluye FAQs sobre:
   - Qué hace el negocio y para quién
   - Precios y planes disponibles
   - Proceso de contratación/compra
   - Soporte y garantías
   - Diferenciación vs competencia
   - Requisitos técnicos (si aplica)
   - Tiempos de entrega/implementación
   - Formas de contacto y horarios
   - Preguntas específicas del sector
3. Las respuestas deben ser completas, no genéricas
4. Si no hay info explícita, genera FAQs que un cliente típico preguntaría

INSTRUCCIONES PARA OBJECIONES:
1. Genera 3-5 objeciones comunes que clientes potenciales podrían tener
2. Proporciona respuestas persuasivas pero honestas

Responde SOLO con el JSON, sin texto adicional.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Eres un experto en análisis de negocios y configuración de asistentes virtuales. Tu trabajo es extraer la máxima información posible de sitios web para que un asistente de IA pueda atender clientes de forma efectiva. 

IMPORTANTE - ESPAÑOL DE ESPAÑA:
- Escribe EXCLUSIVAMENTE en español de España (castellano peninsular)
- Usa "vosotros" cuando sea apropiado, "ordenador" en lugar de "computadora", "móvil" en lugar de "celular"
- Usa expresiones y vocabulario típicos de España
- Evita traducciones literales del inglés
- Las frases deben sonar como las escribiría un hablante nativo de España
- Para FAQs y descripciones, usa un tono claro, directo y profesional
- NO uses español latinoamericano

Siempre:
- Genera FAQs detalladas y útiles
- Infiere información razonable cuando no esté explícita
- Sé específico al tipo de negocio e industria
- El español debe ser perfecto y natural`,
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}')
    
    // Ensure minimum structure
    return {
      businessName: parsed.businessName || 'Negocio',
      businessType: parsed.businessType || 'negocio',
      tagline: parsed.tagline,
      description: parsed.description || '',
      valueProposition: parsed.valueProposition || '',
      targetAudience: parsed.targetAudience || '',
      services: parsed.services || [],
      hours: parsed.hours,
      phone: parsed.phone,
      email: parsed.email,
      address: parsed.address,
      website: websiteUrl,
      faqs: parsed.faqs || [],
      differentiators: parsed.differentiators || [],
      commonObjections: parsed.commonObjections || [],
      bookingInfo: parsed.bookingInfo,
      paymentMethods: parsed.paymentMethods,
      languages: parsed.languages || ['Español'],
    }
  } catch {
    return {
      businessName: 'Negocio',
      businessType: 'negocio',
      description: '',
      valueProposition: '',
      targetAudience: '',
      services: [],
      website: websiteUrl,
      faqs: [],
      differentiators: [],
      commonObjections: [],
    }
  }
}
