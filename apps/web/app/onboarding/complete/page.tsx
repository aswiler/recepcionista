'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
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
  Zap,
  Volume2,
  Loader2
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

interface OnboardingData {
  businessName: string
  industry: string
  websiteUrl: string
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
  const { data: session, status } = useSession()
  const [info, setInfo] = useState<LearnedInfo>({})
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set([0, 1, 2]))
  const [isSaving, setIsSaving] = useState(false)
  const [showWebTest, setShowWebTest] = useState(false)

  useEffect(() => {
    // Load onboarding data (from step 1)
    const storedOnboarding = sessionStorage.getItem('onboardingData')
    if (storedOnboarding) {
      setOnboardingData(JSON.parse(storedOnboarding))
    }

    // Load selected voice (from step 2)
    const voiceId = sessionStorage.getItem('selectedVoice')
    const voiceName = sessionStorage.getItem('selectedVoiceName')
    if (voiceId) {
      setSelectedVoice({ id: voiceId, name: voiceName || 'Voz seleccionada' })
    }

    // SMART MERGE: Combine scraped data + interview learned data
    // Priority: Interview data > Scraped data > Onboarding form data
    
    let baseInfo: LearnedInfo = {
      businessName: 'Tu negocio',
      businessType: 'negocio',
      services: [],
      faqs: [],
      differentiators: [],
      commonObjections: [],
      tone: 'Profesional y amable',
    }
    
    // 1. Start with onboarding form data
    if (storedOnboarding) {
      const data = JSON.parse(storedOnboarding)
      baseInfo.businessName = data.businessName || baseInfo.businessName
      baseInfo.businessType = data.industry || baseInfo.businessType
    }
    
    // 2. Layer in scraped data from website
    const storedScraped = sessionStorage.getItem('scrapedData')
    if (storedScraped) {
      try {
        const scraped = JSON.parse(storedScraped)
        baseInfo = {
          ...baseInfo,
          businessName: scraped.businessName || scraped.name || baseInfo.businessName,
          businessType: scraped.businessType || scraped.industry || baseInfo.businessType,
          tagline: scraped.tagline,
          description: scraped.description,
          valueProposition: scraped.valueProposition,
          targetAudience: scraped.targetAudience,
          services: Array.isArray(scraped.services) 
            ? scraped.services.map((s: string | ServiceDetail) => 
                typeof s === 'string' ? { name: s } : s
              )
            : baseInfo.services,
          hours: scraped.hours,
          phone: scraped.phone,
          email: scraped.email,
          address: scraped.address,
          faqs: scraped.faqs || baseInfo.faqs,
          differentiators: scraped.differentiators || baseInfo.differentiators,
          commonObjections: scraped.commonObjections || baseInfo.commonObjections,
          bookingInfo: scraped.bookingInfo,
          paymentMethods: scraped.paymentMethods,
          languages: scraped.languages,
        }
      } catch (e) {
        console.error('Error parsing scraped data:', e)
      }
    }
    
    // 3. Finally, layer in interview learned data (highest priority)
    const storedLearned = sessionStorage.getItem('learnedInfo')
    if (storedLearned) {
      try {
        const learned = JSON.parse(storedLearned)
        
        // Merge learned data, preferring learned values when they exist
        baseInfo = {
          ...baseInfo,
          businessName: learned.businessName || baseInfo.businessName,
          businessType: learned.businessType || baseInfo.businessType,
          description: learned.description || baseInfo.description,
          // For arrays, merge if interview has data, otherwise keep scraped
          services: (learned.services && learned.services.length > 0) 
            ? mergeServices(baseInfo.services || [], learned.services)
            : baseInfo.services,
          hours: learned.hours || baseInfo.hours,
          faqs: (learned.faqs && learned.faqs.length > 0)
            ? mergeFaqs(baseInfo.faqs || [], learned.faqs)
            : baseInfo.faqs,
          appointmentRules: learned.appointmentProcess || learned.appointmentRules || baseInfo.appointmentRules,
          tone: learned.tone || baseInfo.tone,
          // Transfer rules from interview
          ...(learned.transferRules && { transferRules: learned.transferRules }),
        }
      } catch (e) {
        console.error('Error parsing learned info:', e)
      }
    }
    
    setInfo(baseInfo)
  }, [])
  
  // Helper function to merge services arrays
  const mergeServices = (existing: ServiceDetail[], newServices: ServiceDetail[]): ServiceDetail[] => {
    const merged = [...existing]
    for (const newService of newServices) {
      const existingIndex = merged.findIndex(s => 
        s.name.toLowerCase() === newService.name.toLowerCase()
      )
      if (existingIndex >= 0) {
        // Update existing service with new info
        merged[existingIndex] = { ...merged[existingIndex], ...newService }
      } else {
        // Add new service
        merged.push(newService)
      }
    }
    return merged
  }
  
  // Helper function to merge FAQs arrays
  const mergeFaqs = (existing: FAQ[], newFaqs: FAQ[]): FAQ[] => {
    const merged = [...existing]
    for (const newFaq of newFaqs) {
      const existingIndex = merged.findIndex(f => 
        f.question.toLowerCase().includes(newFaq.question.toLowerCase().slice(0, 20)) ||
        newFaq.question.toLowerCase().includes(f.question.toLowerCase().slice(0, 20))
      )
      if (existingIndex >= 0) {
        // Update existing FAQ with new info
        merged[existingIndex] = { ...merged[existingIndex], ...newFaq }
      } else {
        // Add new FAQ
        merged.push(newFaq)
      }
    }
    return merged
  }

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

  const goToDashboard = async () => {
    setIsSaving(true)
    
    try {
      // Save all onboarding data to database
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Business info (user name/email comes from OAuth session)
          businessName: onboardingData?.businessName || info.businessName,
          industry: onboardingData?.industry || info.businessType,
          website: onboardingData?.websiteUrl,
          description: info.description,
          
          // Voice selection
          voiceId: selectedVoice?.id,
          voiceName: selectedVoice?.name,
          
          // Learned data
          services: info.services,
          hours: info.hours,
          faqs: info.faqs,
          differentiators: info.differentiators,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save onboarding data:', errorData)
        alert('Error al guardar los datos. Por favor, inténtalo de nuevo.')
        setIsSaving(false)
        return
      }

      // Success! Clear session storage
      sessionStorage.removeItem('onboardingData')
      sessionStorage.removeItem('scrapedData')
      sessionStorage.removeItem('selectedVoice')
      sessionStorage.removeItem('selectedVoiceId')
      sessionStorage.removeItem('selectedVoiceName')
      sessionStorage.removeItem('selectedVoiceLanguage')
      sessionStorage.removeItem('interviewMessages')
      sessionStorage.removeItem('interviewState')
      sessionStorage.removeItem('learnedInfo')

      // Go to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      alert('Error de conexión. Por favor, inténtalo de nuevo.')
      setIsSaving(false)
    }
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

          {/* Selected Voice */}
          {selectedVoice && (
            <InfoCard
              title="Voz de tu recepcionista"
              icon={<Volume2 className="w-5 h-5" />}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedVoice.name}</p>
                  <p className="text-blue-300/70 text-sm">Voz de ElevenLabs</p>
                </div>
              </div>
            </InfoCard>
          )}

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
        <div className="mt-12 flex flex-col items-center gap-6">
          {/* Web-based test call */}
          <button
            onClick={() => setShowWebTest(true)}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 
                     text-white font-semibold rounded-full transition-all w-full sm:w-auto
                     justify-center"
          >
            <Mic className="w-5 h-5" />
            Probar tu recepcionista
          </button>
          
          {/* Auth section - show OAuth buttons or dashboard button */}
          {status === 'unauthenticated' ? (
            <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <h3 className="text-lg font-semibold text-white text-center mb-4">
                Guarda tu recepcionista
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/onboarding/complete' })}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 
                           text-gray-800 font-medium rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>
                <button
                  onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/onboarding/complete' })}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#2F2F2F] hover:bg-[#3F3F3F] 
                           text-white font-medium rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  Continuar con Microsoft
                </button>
              </div>
              <p className="text-blue-300/60 text-sm text-center mt-4">
                Tu progreso se guardará automáticamente
              </p>
            </div>
          ) : (
            <button
              onClick={goToDashboard}
              disabled={isSaving || status === 'loading'}
              className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 
                       text-white font-semibold rounded-full transition-all w-full sm:w-auto
                       justify-center disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Guardar e ir al dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Web Test Modal - TODO: implement web-based voice test */}
      {showWebTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Probar tu recepcionista</h3>
            <p className="text-blue-200 mb-6">
              Habla con tu recepcionista AI usando el micrófono de tu navegador.
            </p>
            <p className="text-yellow-300 text-sm mb-4">
              (Próximamente - Esta función está en desarrollo)
            </p>
            <button
              onClick={() => setShowWebTest(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
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
