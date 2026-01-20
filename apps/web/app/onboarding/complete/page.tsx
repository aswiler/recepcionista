'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Check, 
  Edit2, 
  Plus, 
  Mic, 
  Phone, 
  ArrowRight,
  Clock,
  DollarSign,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  Target,
  Zap
} from 'lucide-react'

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

interface LearnedInfo {
  businessName?: string
  businessType?: string
  tagline?: string
  description?: string
  valueProposition?: string
  targetAudience?: string
  services?: ServiceDetail[]
  hours?: string | { day: string; open: string; close: string }[]
  phone?: string
  email?: string
  address?: string
  faqs?: FAQ[]
  differentiators?: string[]
  commonObjections?: { objection: string; response: string }[]
  bookingInfo?: string
  paymentMethods?: string[]
  languages?: string[]
  appointmentRules?: string
  tone?: string
}

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [info, setInfo] = useState<LearnedInfo>({})
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set([0, 1, 2]))

  useEffect(() => {
    // Try to load learned info from interview
    const storedLearned = sessionStorage.getItem('learnedInfo')
    if (storedLearned) {
      setInfo(JSON.parse(storedLearned))
      return
    }

    // If no learned info, try scraped data from website
    const storedScraped = sessionStorage.getItem('scrapedData')
    if (storedScraped) {
      try {
        const scraped = JSON.parse(storedScraped)
        setInfo({
          businessName: scraped.businessName || scraped.name || 'Tu negocio',
          businessType: scraped.businessType || scraped.industry || 'negocio',
          tagline: scraped.tagline,
          description: scraped.description,
          valueProposition: scraped.valueProposition,
          targetAudience: scraped.targetAudience,
          services: Array.isArray(scraped.services) 
            ? scraped.services.map((s: string | ServiceDetail) => 
                typeof s === 'string' ? { name: s } : s
              )
            : [],
          hours: scraped.hours,
          phone: scraped.phone,
          email: scraped.email,
          address: scraped.address,
          faqs: scraped.faqs || [],
          differentiators: scraped.differentiators || [],
          commonObjections: scraped.commonObjections || [],
          bookingInfo: scraped.bookingInfo,
          paymentMethods: scraped.paymentMethods,
          languages: scraped.languages,
          appointmentRules: scraped.appointmentRules || '',
          tone: scraped.tone || 'Profesional y amable',
        })
        return
      } catch (e) {
        console.error('Error parsing scraped data:', e)
      }
    }

    // Fallback: prompt user to add info
    setInfo({
      businessName: 'Tu negocio',
      businessType: 'negocio',
      services: [],
      faqs: [],
      differentiators: [],
      commonObjections: [],
      tone: 'Profesional y amable',
    })
  }, [])

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const startTestCall = () => {
    alert('¡Llamada de prueba iniciada! Tu teléfono sonará en unos segundos.')
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  const faqsByCategory = (info.faqs || []).reduce((acc, faq) => {
    const cat = faq.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            ¡Tu recepcionista está lista!
          </h1>
          <p className="text-lg text-blue-200">
            Esto es lo que aprendió. Puedes editar cualquier cosa.
          </p>
          
          {/* Stats summary */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="px-4 py-2 bg-white/10 rounded-full text-blue-200">
              <span className="font-semibold text-white">{info.services?.length || 0}</span> servicios
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-blue-200">
              <span className="font-semibold text-white">{info.faqs?.length || 0}</span> FAQs
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-blue-200">
              <span className="font-semibold text-white">{info.differentiators?.length || 0}</span> diferenciadores
            </div>
          </div>
        </div>

        {/* Learned Info Cards */}
        <div className="space-y-6">
          {/* Business Info */}
          <InfoCard
            title="Tu negocio"
            icon={<MessageCircle className="w-5 h-5" />}
            onEdit={() => setEditingSection('business')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-white">{info.businessName}</p>
                {info.tagline && (
                  <p className="text-blue-300 italic mt-1">"{info.tagline}"</p>
                )}
                <p className="text-blue-400 text-sm mt-1">{info.businessType}</p>
              </div>
              
              {info.description && (
                <p className="text-blue-200">{info.description}</p>
              )}
              
              {info.valueProposition && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                    <Target className="w-4 h-4" />
                    Propuesta de valor
                  </div>
                  <p className="text-white">{info.valueProposition}</p>
                </div>
              )}

              {info.targetAudience && (
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <span className="font-medium">Público objetivo:</span>
                  {info.targetAudience}
                </div>
              )}
            </div>
          </InfoCard>

          {/* Services */}
          <InfoCard
            title="Servicios"
            icon={<DollarSign className="w-5 h-5" />}
            onEdit={() => setEditingSection('services')}
            onAdd={() => {/* Add service modal */}}
            badge={info.services?.length ? `${info.services.length} servicios` : undefined}
          >
            <div className="grid gap-3">
              {info.services?.map((service, i) => (
                <div 
                  key={i}
                  className="flex items-start justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{service.name}</span>
                      {service.popular && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-blue-300/70 text-sm mt-1">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-blue-300 ml-4">
                    {service.price && (
                      <span className="font-semibold text-green-400">{service.price}</span>
                    )}
                    {service.duration && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!info.services || info.services.length === 0) && (
                <p className="text-blue-300/50 text-center py-4">
                  No se detectaron servicios. Haz clic en + para añadir.
                </p>
              )}
            </div>
          </InfoCard>

          {/* FAQs - Expanded section */}
          <InfoCard
            title="Preguntas frecuentes (FAQs)"
            icon={<HelpCircle className="w-5 h-5" />}
            onEdit={() => setEditingSection('faqs')}
            onAdd={() => {/* Add FAQ modal */}}
            badge={info.faqs?.length ? `${info.faqs.length} preguntas` : undefined}
          >
            <div className="space-y-6">
              {Object.entries(faqsByCategory).map(([category, faqs]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {faqs.map((faq, i) => {
                      const globalIndex = (info.faqs || []).indexOf(faq)
                      const isExpanded = expandedFaqs.has(globalIndex)
                      
                      return (
                        <div 
                          key={i}
                          className="bg-white/5 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFaq(globalIndex)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
                          >
                            <span className="text-white font-medium pr-4">{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <p className="text-blue-200">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {(!info.faqs || info.faqs.length === 0) && (
                <p className="text-blue-300/50 text-center py-4">
                  No se generaron FAQs. Haz clic en + para añadir.
                </p>
              )}
            </div>
          </InfoCard>

          {/* Differentiators */}
          {info.differentiators && info.differentiators.length > 0 && (
            <InfoCard
              title="Diferenciadores"
              icon={<Zap className="w-5 h-5" />}
              onEdit={() => setEditingSection('differentiators')}
            >
              <div className="grid gap-3">
                {info.differentiators.map((diff, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg"
                  >
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white">{diff}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Common Objections */}
          {info.commonObjections && info.commonObjections.length > 0 && (
            <InfoCard
              title="Objeciones comunes"
              icon={<Shield className="w-5 h-5" />}
              onEdit={() => setEditingSection('objections')}
              badge="Tu AI sabrá responder"
            >
              <div className="space-y-4">
                {info.commonObjections.map((obj, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg">
                    <p className="text-orange-300 font-medium mb-2">
                      "🤔 {obj.objection}"
                    </p>
                    <p className="text-blue-200 text-sm pl-4 border-l-2 border-green-500/50">
                      ✅ {obj.response}
                    </p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Contact & Hours */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hours */}
            <InfoCard
              title="Horarios"
              icon={<Clock className="w-5 h-5" />}
              onEdit={() => setEditingSection('hours')}
            >
              {info.hours ? (
                typeof info.hours === 'string' ? (
                  <p className="text-blue-200">{info.hours}</p>
                ) : (
                  <div className="space-y-2">
                    {info.hours.map((h, i) => (
                      <div key={i} className="flex justify-between text-white">
                        <span className="text-blue-300">{h.day}</span>
                        <span>{h.open} - {h.close}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-blue-300/50">No especificado</p>
              )}
            </InfoCard>

            {/* Contact Info */}
            <InfoCard
              title="Contacto"
              icon={<Globe className="w-5 h-5" />}
              onEdit={() => setEditingSection('contact')}
            >
              <div className="space-y-2 text-sm">
                {info.phone && (
                  <div className="flex items-center gap-2 text-white">
                    <Phone className="w-4 h-4 text-blue-400" />
                    {info.phone}
                  </div>
                )}
                {info.email && (
                  <div className="flex items-center gap-2 text-white">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    {info.email}
                  </div>
                )}
                {info.address && (
                  <p className="text-blue-300">{info.address}</p>
                )}
                {info.languages && info.languages.length > 0 && (
                  <p className="text-blue-400">
                    Idiomas: {info.languages.join(', ')}
                  </p>
                )}
                {!info.phone && !info.email && !info.address && (
                  <p className="text-blue-300/50">No especificado</p>
                )}
              </div>
            </InfoCard>
          </div>

          {/* Booking Info */}
          {info.bookingInfo && (
            <InfoCard
              title="Cómo reservar/contratar"
              icon={<Clock className="w-5 h-5" />}
              onEdit={() => setEditingSection('booking')}
            >
              <p className="text-blue-200">{info.bookingInfo}</p>
            </InfoCard>
          )}
        </div>

        {/* Add More by Voice */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                ¿Falta algo?
              </h3>
              <p className="text-blue-200 text-sm mt-1">
                Añade más información hablando con tu AI
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 
                             text-white font-medium rounded-full transition-all">
              <Mic className="w-5 h-5" />
              Añadir por voz
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={startTestCall}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 
                     text-white font-semibold rounded-full transition-all w-full sm:w-auto
                     justify-center"
          >
            <Phone className="w-5 h-5" />
            Hacer llamada de prueba
          </button>
          
          <button
            onClick={goToDashboard}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 
                     text-white font-semibold rounded-full transition-all w-full sm:w-auto
                     justify-center border border-white/20"
          >
            Ir al dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  )
}

function InfoCard({ 
  title, 
  icon, 
  children, 
  onEdit, 
  onAdd,
  badge
}: { 
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  onEdit?: () => void
  onAdd?: () => void
  badge?: string
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">{icon}</div>
          <h3 className="font-semibold text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button 
              onClick={onAdd}
              className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {onEdit && (
            <button 
              onClick={onEdit}
              className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
