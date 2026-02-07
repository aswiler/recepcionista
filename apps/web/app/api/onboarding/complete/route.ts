import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, businesses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { indexBusinessContent } from '@/lib/ai/brain'

export const dynamic = 'force-dynamic'

/**
 * Complete onboarding - save all collected data to database
 * POST /api/onboarding/complete
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      industry,
      website,
      description,
      voiceId,
      voiceName,
      services,
      hours,
      faqs,
      differentiators,
    } = body

    // User name/email comes from OAuth session, no need to update here

    // Check if business already exists for this user
    const [existingBusiness] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, session.user.id))
      .limit(1)

    let businessId: string

    if (existingBusiness) {
      // Update existing business
      businessId = existingBusiness.id
      await db.update(businesses)
        .set({
          name: businessName || existingBusiness.name,
          industry: industry || existingBusiness.industry,
          website: website || existingBusiness.website,
          description: description || existingBusiness.description,
          voiceId: voiceId || existingBusiness.voiceId,
          voiceName: voiceName || existingBusiness.voiceName,
          hours: hours || existingBusiness.hours,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, existingBusiness.id))
    } else {
      // Create new business
      businessId = `biz_${Date.now()}_${Math.random().toString(36).slice(2)}`
      await db.insert(businesses).values({
        id: businessId,
        userId: session.user.id,
        name: businessName || 'Mi negocio',
        industry: industry,
        website: website,
        description: description,
        voiceId: voiceId,
        voiceName: voiceName,
        hours: hours,
      })
    }

    // Index business content in Pinecone for RAG
    try {
      const textsToIndex: string[] = []
      
      // Add business description
      if (description) {
        textsToIndex.push(`Descripción del negocio: ${description}`)
      }
      
      // Add services
      if (services && Array.isArray(services)) {
        services.forEach((service: { name: string; description?: string; price?: string }) => {
          let text = `Servicio: ${service.name}`
          if (service.description) text += `. ${service.description}`
          if (service.price) text += `. Precio: ${service.price}`
          textsToIndex.push(text)
        })
      }
      
      // Add FAQs
      if (faqs && Array.isArray(faqs)) {
        faqs.forEach((faq: { question: string; answer: string }) => {
          textsToIndex.push(`Pregunta frecuente: ${faq.question}\nRespuesta: ${faq.answer}`)
        })
      }
      
      // Add differentiators
      if (differentiators && Array.isArray(differentiators)) {
        textsToIndex.push(`Lo que nos hace únicos: ${differentiators.join('. ')}`)
      }
      
      if (textsToIndex.length > 0) {
        await indexBusinessContent(businessId, textsToIndex, 'onboarding')
        
        // Mark business as indexed
        await db.update(businesses)
          .set({ isIndexed: true, lastIndexedAt: new Date() })
          .where(eq(businesses.id, businessId))
      }
    } catch (indexError) {
      console.error('Error indexing business content:', indexError)
      // Don't fail the whole request if indexing fails
    }

    return NextResponse.json({ 
      success: true,
      businessId,
      message: 'Onboarding completed successfully'
    })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
