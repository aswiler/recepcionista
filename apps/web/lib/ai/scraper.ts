/**
 * Website Scraper for Onboarding - ENHANCED VERSION
 * 
 * Uses Firecrawl to scrape business websites and extract comprehensive information
 * for training the AI receptionist.
 */

import OpenAI from 'openai'
import { indexBusinessContent } from './brain'

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

interface ScrapedBusinessData {
  // Basic Info
  name: string
  businessType: string
  tagline?: string
  description: string
  
  // Value & Audience
  valueProposition: string
  targetAudience: string
  differentiators: string[]
  
  // Services
  services: ServiceDetail[]
  pricingModel?: string
  
  // Operations
  hours: { day: string; open: string; close: string }[] | string
  phone?: string
  email?: string
  address?: string
  languages?: string[]
  
  // Customer Info
  faqs: FAQ[]
  commonObjections: { objection: string; response: string }[]
  
  // Process
  bookingInfo?: string
  cancellationPolicy?: string
  paymentMethods?: string[]
  
  // Meta
  rawContent?: string
  scrapedAt?: string
}

/**
 * Scrape a website and extract comprehensive business information
 */
export async function scrapeAndLearn(
  businessId: string,
  websiteUrl: string
): Promise<ScrapedBusinessData> {
  console.log(`🔍 Starting comprehensive scrape for: ${websiteUrl}`)
  
  // 1. Scrape website with Firecrawl (with fallbacks)
  const content = await scrapeWebsite(websiteUrl)
  console.log(`📄 Got ${content.length} characters of content`)
  
  // 2. Extract structured data with GPT-4o
  const businessData = await extractComprehensiveData(websiteUrl, content)
  console.log(`✅ Extracted: ${businessData.name} (${businessData.businessType})`)
  console.log(`   - ${businessData.services.length} services`)
  console.log(`   - ${businessData.faqs.length} FAQs`)
  console.log(`   - ${businessData.differentiators.length} differentiators`)
  
  // 3. Index content in Pinecone for RAG
  const textsToIndex = buildIndexableTexts(businessData)
  await indexBusinessContent(businessId, textsToIndex, 'website')
  console.log(`📚 Indexed ${textsToIndex.length} text chunks`)
  
  return businessData
}

/**
 * Scrape website content using Firecrawl with fallbacks
 */
async function scrapeWebsite(url: string): Promise<string> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  
  // Try Firecrawl first
  if (firecrawlKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          pageOptions: {
            onlyMainContent: true,
            includeHtml: false,
          },
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const content = data.data?.markdown || data.data?.content || ''
        if (content.length > 200) {
          console.log('✅ Firecrawl succeeded')
          return content
        }
      }
    } catch (e) {
      console.log('⚠️ Firecrawl failed:', e instanceof Error ? e.message : 'unknown')
    }
  }
  
  // Fallback: Direct fetch
  try {
    console.log('📡 Trying direct fetch...')
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecepcionistaBot/1.0; +https://recepcionista.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    
    if (response.ok) {
      const html = await response.text()
      // Extract meaningful text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50000)
      
      if (textContent.length > 200) {
        console.log('✅ Direct fetch succeeded')
        return textContent
      }
    }
  } catch (e) {
    console.log('⚠️ Direct fetch failed:', e instanceof Error ? e.message : 'unknown')
  }
  
  // Last resort: Return URL for GPT to work with
  console.log('⚠️ All scraping methods failed')
  return `Website URL: ${url}. Unable to scrape content directly. Please infer business information from the domain name and generate appropriate content.`
}

/**
 * Extract comprehensive business data using GPT-4o
 */
async function extractComprehensiveData(
  websiteUrl: string,
  content: string
): Promise<ScrapedBusinessData> {
  const prompt = `Eres un experto en análisis de negocios. Tu tarea es extraer TODA la información posible del siguiente sitio web para configurar un asistente virtual de atención al cliente altamente efectivo.

SITIO WEB: ${websiteUrl}

CONTENIDO EXTRAÍDO:
${content.slice(0, 40000)}

---

Analiza el contenido y extrae la información en este formato JSON. Para campos que no estén explícitos, INFIERE valores razonables basándote en el tipo de negocio y la industria:

{
  "name": "nombre exacto del negocio",
  "businessType": "tipo específico (ej: clínica dental, restaurante italiano, empresa de software SaaS, bufete de abogados, etc.)",
  "tagline": "slogan o frase principal si existe",
  "description": "descripción detallada de qué hace el negocio, para quién, y por qué es valioso (3-4 oraciones)",
  
  "valueProposition": "propuesta de valor principal - qué problema resuelve y qué beneficio concreto ofrece",
  "targetAudience": "público objetivo específico (demografía, necesidades, características)",
  "differentiators": [
    "qué hace único a este negocio vs competidores (mínimo 3-5 puntos)",
    "ventajas competitivas claras",
    "especialización o expertise único"
  ],
  
  "services": [
    {
      "name": "nombre del servicio/producto",
      "description": "descripción concisa pero completa",
      "price": "precio o rango si está disponible",
      "duration": "duración si aplica (para servicios)",
      "popular": true si parece ser servicio estrella
    }
  ],
  "pricingModel": "modelo de precios (por hora, suscripción, proyecto, etc.)",
  
  "hours": "horario de atención en formato legible (ej: 'Lunes a Viernes 9:00-20:00, Sábados 10:00-14:00')",
  "phone": "teléfono principal",
  "email": "email de contacto",
  "address": "dirección física si tiene",
  "languages": ["idiomas en los que opera"],
  
  "faqs": [
    {
      "question": "pregunta frecuente específica y útil",
      "answer": "respuesta completa, profesional y útil (no genérica)",
      "category": "categoría (servicios, precios, proceso, soporte, horarios, etc.)"
    }
  ],
  
  "commonObjections": [
    {
      "objection": "objeción típica que tendrían clientes potenciales",
      "response": "respuesta persuasiva y honesta a esa objeción"
    }
  ],
  
  "bookingInfo": "cómo agendar, contratar o comprar (proceso paso a paso)",
  "cancellationPolicy": "política de cancelación si existe",
  "paymentMethods": ["métodos de pago aceptados"]
}

INSTRUCCIONES CRÍTICAS:

1. FAQs (GENERAR AL MENOS 15-20):
   - Incluye preguntas sobre: qué hace el negocio, precios, proceso de contratación/compra, garantías, soporte, diferenciación, requisitos, tiempos, formas de contacto
   - Las respuestas deben ser ESPECÍFICAS al negocio, no genéricas
   - Anticipa las preguntas que un cliente real haría ANTES de contratar
   - Incluye preguntas técnicas o específicas del sector

2. SERVICIOS:
   - Lista TODOS los servicios/productos que encuentres
   - Si no hay precios explícitos, no los inventes pero indica "Consultar"
   - Identifica cuáles parecen ser los más populares o destacados

3. DIFERENCIADORES:
   - Sé específico sobre qué hace único a este negocio
   - Busca: años de experiencia, especialización, tecnología, ubicación, premios, certificaciones

4. OBJECIONES (GENERAR 4-6):
   - Piensa en las dudas reales que tendría alguien antes de contratar
   - Las respuestas deben ser convincentes pero honestas

5. IDIOMA:
   - Escribe TODO en español de España (castellano peninsular)
   - Usa "vosotros", "móvil", "ordenador", etc.
   - Tono profesional pero cercano

Responde SOLO con el JSON válido.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { 
        role: 'system', 
        content: `Eres un experto en análisis de negocios y experiencia de cliente. Tu trabajo es extraer y estructurar información de sitios web para que un asistente de IA pueda atender clientes de forma excelente.

Siempre:
- Genera contenido detallado y específico
- Infiere información razonable cuando no esté explícita
- Escribe en español de España perfecto y natural
- Prioriza la utilidad práctica para atención al cliente`
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  })
  
  const text = response.choices[0].message.content || '{}'
  
  try {
    const parsed = JSON.parse(text)
    
    return {
      name: parsed.name || 'Negocio',
      businessType: parsed.businessType || 'negocio',
      tagline: parsed.tagline,
      description: parsed.description || 'Información extraída del sitio web',
      valueProposition: parsed.valueProposition || '',
      targetAudience: parsed.targetAudience || '',
      differentiators: parsed.differentiators || [],
      services: parsed.services || [],
      pricingModel: parsed.pricingModel,
      hours: parsed.hours || '',
      phone: parsed.phone,
      email: parsed.email,
      address: parsed.address,
      languages: parsed.languages || ['Español'],
      faqs: parsed.faqs || [],
      commonObjections: parsed.commonObjections || [],
      bookingInfo: parsed.bookingInfo,
      cancellationPolicy: parsed.cancellationPolicy,
      paymentMethods: parsed.paymentMethods,
      scrapedAt: new Date().toISOString(),
    }
  } catch {
    console.error('Failed to parse GPT response')
    return {
      name: 'Negocio',
      businessType: 'negocio',
      description: 'Información extraída del sitio web',
      valueProposition: '',
      targetAudience: '',
      differentiators: [],
      services: [],
      hours: '',
      faqs: [],
      commonObjections: [],
    }
  }
}

/**
 * Build indexable text chunks from business data
 */
function buildIndexableTexts(data: ScrapedBusinessData): string[] {
  const texts: string[] = []
  
  // Core business info
  texts.push(`Nombre del negocio: ${data.name}. Tipo: ${data.businessType}. ${data.description}`)
  
  if (data.valueProposition) {
    texts.push(`Propuesta de valor de ${data.name}: ${data.valueProposition}`)
  }
  
  if (data.targetAudience) {
    texts.push(`Público objetivo: ${data.targetAudience}`)
  }
  
  // Differentiators
  if (data.differentiators.length > 0) {
    texts.push(`Qué hace único a ${data.name}: ${data.differentiators.join('. ')}`)
  }
  
  // Services with full details
  for (const service of data.services) {
    let serviceText = `Servicio: ${service.name}`
    if (service.description) serviceText += `. ${service.description}`
    if (service.price) serviceText += `. Precio: ${service.price}`
    if (service.duration) serviceText += `. Duración: ${service.duration}`
    texts.push(serviceText)
  }
  
  // FAQs
  for (const faq of data.faqs) {
    texts.push(`Pregunta frecuente: ${faq.question}\nRespuesta: ${faq.answer}`)
  }
  
  // Objections
  for (const obj of data.commonObjections) {
    texts.push(`Objeción común: "${obj.objection}"\nCómo responder: ${obj.response}`)
  }
  
  // Contact and operations
  if (data.hours) {
    texts.push(`Horario de atención: ${typeof data.hours === 'string' ? data.hours : JSON.stringify(data.hours)}`)
  }
  if (data.phone) texts.push(`Teléfono de contacto: ${data.phone}`)
  if (data.email) texts.push(`Email de contacto: ${data.email}`)
  if (data.address) texts.push(`Dirección: ${data.address}`)
  
  // Booking and policies
  if (data.bookingInfo) {
    texts.push(`Cómo contratar o agendar: ${data.bookingInfo}`)
  }
  if (data.cancellationPolicy) {
    texts.push(`Política de cancelación: ${data.cancellationPolicy}`)
  }
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    texts.push(`Métodos de pago aceptados: ${data.paymentMethods.join(', ')}`)
  }
  
  return texts.filter(t => t.length > 10)
}

/**
 * Apply an industry template for businesses without websites
 */
export async function applyTemplate(
  businessId: string,
  industry: string
): Promise<void> {
  const templates: Record<string, string[]> = {
    dentist: [
      'Somos una clínica dental con servicios de odontología general y especializada.',
      'Servicios: Limpieza dental, empastes, endodoncia, ortodoncia, implantes, blanqueamiento dental, revisiones periódicas.',
      'Horario típico: Lunes a Viernes de 9:00 a 20:00. Sábados de 9:00 a 14:00.',
      'Aceptamos citas el mismo día para urgencias dentales.',
      'Trabajamos con las principales aseguradoras dentales.',
      'Primera consulta de valoración gratuita.',
      'Pregunta frecuente: ¿Cuánto cuesta una limpieza dental? - El precio de una limpieza dental varía según el caso, generalmente entre 50-80€.',
      'Pregunta frecuente: ¿Hacéis ortodoncia invisible? - Sí, ofrecemos tratamientos de ortodoncia invisible tipo Invisalign.',
    ],
    salon: [
      'Somos un salón de belleza y peluquería con servicios profesionales.',
      'Servicios: Corte de pelo, tinte, mechas, balayage, peinados, manicura, pedicura, tratamientos capilares, depilación.',
      'Horario típico: Martes a Sábado de 10:00 a 20:00.',
      'Recomendamos reservar cita con antelación, especialmente para fines de semana.',
      'Usamos productos de primeras marcas.',
      'Pregunta frecuente: ¿Cuánto cuesta un corte de pelo? - Los precios varían según el servicio, a partir de 15€ para caballeros y 25€ para señoras.',
    ],
    restaurant: [
      'Somos un restaurante que ofrece cocina de calidad con productos frescos.',
      'Aceptamos reservas para grupos y eventos especiales.',
      'Horario típico: Almuerzo de 13:00 a 16:00, Cena de 20:00 a 23:30.',
      'Disponemos de menú del día y carta a la carta.',
      'Opciones vegetarianas y para alérgicos disponibles.',
      'Pregunta frecuente: ¿Aceptáis reservas para grupos grandes? - Sí, aceptamos reservas para grupos. Para más de 10 personas, por favor contactad con antelación.',
    ],
    plumber: [
      'Somos fontaneros profesionales con servicio de urgencias 24 horas.',
      'Servicios: Reparación de fugas, instalación de tuberías, desatascos, calentadores, grifería, cisternas, averías generales.',
      'Servicio de urgencias disponible las 24 horas del día, los 7 días de la semana.',
      'Presupuesto sin compromiso. Desplazamiento incluido en el presupuesto.',
      'Pregunta frecuente: ¿Cuánto cobráis por el desplazamiento? - El desplazamiento está incluido en el presupuesto de la reparación.',
    ],
    healthcare: [
      'Somos una clínica médica con atención personalizada y profesionales cualificados.',
      'Servicios: Consulta médica general, especialidades, análisis clínicos, revisiones médicas.',
      'Horario típico: Lunes a Viernes de 9:00 a 20:00.',
      'Trabajamos con las principales aseguradoras médicas.',
      'Cita previa necesaria. Disponibilidad para urgencias según el caso.',
      'Pregunta frecuente: ¿Trabajáis con mi seguro médico? - Trabajamos con la mayoría de las aseguradoras. Consultad disponibilidad al pedir cita.',
    ],
    software: [
      'Somos una empresa de software que ayuda a empresas a digitalizar sus procesos.',
      'Ofrecemos soluciones personalizadas, implementación y soporte continuo.',
      'Disponemos de demo gratuita y prueba sin compromiso.',
      'Soporte técnico disponible en horario laboral.',
      'Pregunta frecuente: ¿Ofrecéis formación para usar el software? - Sí, incluimos formación inicial y documentación completa.',
    ],
    fitness: [
      'Somos un centro deportivo con instalaciones modernas y profesionales cualificados.',
      'Servicios: Sala de musculación, clases dirigidas, entrenamiento personal, nutrición deportiva.',
      'Horario amplio de lunes a domingo.',
      'Diferentes tipos de membresías disponibles.',
      'Pregunta frecuente: ¿Puedo probar antes de apuntarme? - Sí, ofrecemos un día de prueba gratuito.',
    ],
  }
  
  const content = templates[industry] || templates.healthcare
  await indexBusinessContent(businessId, content, 'template')
}
