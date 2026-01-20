/**
 * Website Scraper for Onboarding
 * 
 * Uses Firecrawl to scrape business websites and extract information
 */

import OpenAI from 'openai'
import { indexBusinessContent } from './brain'

const openai = new OpenAI()

interface ScrapedBusinessData {
  name: string
  description: string
  services: string[]
  hours: { day: string; open: string; close: string }[]
  phone?: string
  address?: string
  faqs: { question: string; answer: string }[]
}

/**
 * Scrape a website and extract business information
 */
export async function scrapeAndLearn(
  businessId: string,
  websiteUrl: string
): Promise<ScrapedBusinessData> {
  // 1. Scrape website with Firecrawl
  const content = await scrapeWebsite(websiteUrl)
  
  // 2. Extract structured data with GPT-4o-mini
  const businessData = await extractBusinessData(content)
  
  // 3. Index content in Pinecone for RAG
  const textsToIndex = [
    `Nombre del negocio: ${businessData.name}`,
    `Descripción: ${businessData.description}`,
    ...businessData.services.map(s => `Servicio: ${s}`),
    ...businessData.faqs.map(f => `Pregunta: ${f.question}\nRespuesta: ${f.answer}`),
    businessData.phone ? `Teléfono: ${businessData.phone}` : '',
    businessData.address ? `Dirección: ${businessData.address}` : '',
  ].filter(Boolean)
  
  await indexBusinessContent(businessId, textsToIndex, 'website')
  
  return businessData
}

/**
 * Scrape website content using Firecrawl
 */
async function scrapeWebsite(url: string): Promise<string> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  
  if (!firecrawlKey) {
    throw new Error('FIRECRAWL_API_KEY not set')
  }
  
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
      },
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Firecrawl error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data?.markdown || data.data?.content || ''
}

/**
 * Extract structured business data using GPT-4o-mini
 */
async function extractBusinessData(content: string): Promise<ScrapedBusinessData> {
  const prompt = `Analiza el siguiente contenido de un sitio web y extrae información del negocio.

CONTENIDO:
${content.slice(0, 10000)}

Extrae la información en formato JSON:
{
  "name": "nombre del negocio",
  "description": "descripción breve del negocio",
  "services": ["servicio1", "servicio2"],
  "hours": [{"day": "Lunes", "open": "09:00", "close": "18:00"}],
  "phone": "teléfono si está disponible",
  "address": "dirección si está disponible",
  "faqs": [{"question": "pregunta frecuente", "answer": "respuesta"}]
}

Responde SOLO con el JSON, sin texto adicional.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'Eres un experto en análisis de negocios. Extrae información estructurada de sitios web. Responde siempre en español.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })
  
  const text = response.choices[0].message.content || '{}'
  
  try {
    return JSON.parse(text) as ScrapedBusinessData
  } catch {
    return {
      name: 'Negocio',
      description: 'Información extraída del sitio web',
      services: [],
      hours: [],
      faqs: [],
    }
  }
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
      'Servicios: Limpieza dental, empastes, endodoncia, ortodoncia, implantes, blanqueamiento.',
      'Horario típico: Lunes a Viernes de 9:00 a 20:00.',
      'Aceptamos citas el mismo día para urgencias dentales.',
    ],
    salon: [
      'Somos un salón de belleza y peluquería.',
      'Servicios: Corte de pelo, tinte, mechas, peinados, manicura, pedicura, tratamientos capilares.',
      'Horario típico: Martes a Sábado de 10:00 a 20:00.',
      'Recomendamos reservar cita con antelación, especialmente para fines de semana.',
    ],
    restaurant: [
      'Somos un restaurante que ofrece comida de calidad.',
      'Aceptamos reservas para grupos y eventos especiales.',
      'Horario típico: Almuerzo de 13:00 a 16:00, Cena de 20:00 a 23:00.',
      'Disponemos de menú del día y carta a la carta.',
    ],
    plumber: [
      'Somos fontaneros profesionales con servicio de urgencias.',
      'Servicios: Reparación de fugas, instalación de tuberías, desatascos, calentadores, grifería.',
      'Servicio de urgencias 24 horas.',
      'Presupuesto sin compromiso.',
    ],
    healthcare: [
      'Somos una clínica médica con atención personalizada.',
      'Servicios: Consulta médica general, especialidades, análisis, revisiones.',
      'Horario típico: Lunes a Viernes de 9:00 a 20:00.',
      'Trabajamos con las principales aseguradoras.',
    ],
  }
  
  const content = templates[industry] || templates.healthcare
  await indexBusinessContent(businessId, content, 'template')
}
