'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight, Loader2, Globe, Briefcase } from 'lucide-react'

const INDUSTRIES = [
  { value: 'real-estate', label: 'Inmobiliaria' },
  { value: 'healthcare', label: 'Salud y Medicina' },
  { value: 'restaurant', label: 'Restaurante / Hostelería' },
  { value: 'retail', label: 'Comercio / Tienda' },
  { value: 'professional', label: 'Servicios Profesionales' },
  { value: 'beauty', label: 'Belleza y Bienestar' },
  { value: 'automotive', label: 'Automoción' },
  { value: 'legal', label: 'Legal / Abogados' },
  { value: 'fitness', label: 'Gimnasio / Fitness' },
  { value: 'education', label: 'Educación / Formación' },
  { value: 'other', label: 'Otro' },
]

export default function OnboardingStep1() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    websiteUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'El nombre de tu negocio es requerido'
    }
    if (!formData.industry) {
      newErrors.industry = 'Selecciona una industria'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim()
    if (!normalized) return ''
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }
    return normalized
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      // Store form data in session storage
      const onboardingData = {
        ...formData,
        websiteUrl: normalizeUrl(formData.websiteUrl),
      }
      sessionStorage.setItem('onboardingData', JSON.stringify(onboardingData))

      // If website provided, scrape it
      if (formData.websiteUrl) {
        try {
          const response = await fetch('/api/onboarding/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizeUrl(formData.websiteUrl) }),
          })

          if (response.ok) {
            const { scrapedData } = await response.json()
            sessionStorage.setItem('scrapedData', JSON.stringify(scrapedData))
          }
        } catch (error) {
          console.error('Error scraping website:', error)
          // Continue anyway
        }
      }

      // Go to voice selection (Step 2)
      router.push('/onboarding/voice')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">1</div>
            <div className="w-12 h-1 bg-white/20 rounded" />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/50 text-sm">2</div>
            <div className="w-12 h-1 bg-white/20 rounded" />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/50 text-sm">3</div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-6">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Cuéntanos sobre tu negocio
            </h1>
            <p className="text-lg text-blue-200">
              Esta información ayudará a tu recepcionista AI a representarte mejor
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Nombre de tu negocio *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Clínica Dental García"
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl 
                             text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent
                             ${errors.businessName ? 'border-red-500' : 'border-white/20'}`}
                  />
                </div>
                {errors.businessName && <p className="mt-1 text-sm text-red-400">{errors.businessName}</p>}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Industria *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <select
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl 
                             text-white focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent appearance-none
                             ${errors.industry ? 'border-red-500' : 'border-white/20'}
                             ${!formData.industry ? 'text-blue-300/50' : ''}`}
                  >
                    <option value="" className="bg-slate-800">Selecciona tu industria</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind.value} value={ind.value} className="bg-slate-800">
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.industry && <p className="mt-1 text-sm text-red-400">{errors.industry}</p>}
              </div>

              {/* Website URL (optional) */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Sitio web <span className="text-blue-300/50">(opcional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    value={formData.websiteUrl}
                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    placeholder="tuempresa.com"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl 
                             text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-sm text-blue-300/50">
                  Si tienes web, la analizaremos para entrenar a tu AI más rápido
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 
                         bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
                         text-white font-semibold rounded-xl transition-all
                         hover:scale-[1.02] active:scale-[0.98] mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {formData.websiteUrl ? 'Analizando tu web...' : 'Continuando...'}
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-blue-300/50 text-sm">
            <span>🔒 Datos encriptados</span>
            <span>🇪🇺 GDPR compliant</span>
          </div>
        </div>
      </div>
    </main>
  )
}
