'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ArrowRight, Loader2, Sparkles } from 'lucide-react'

export default function OnboardingStart() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [skipWebsite, setSkipWebsite] = useState(false)

  // Normalize URL - add https:// if missing
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
    setIsLoading(true)

    try {
      // If website provided, scrape it first
      if (websiteUrl && !skipWebsite) {
        const normalizedUrl = normalizeUrl(websiteUrl)
        const response = await fetch('/api/onboarding/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl }),
        })

        if (!response.ok) {
          throw new Error('Failed to scrape website')
        }

        const { scrapedData } = await response.json()
        
        // Store scraped data in session storage for interview
        sessionStorage.setItem('scrapedData', JSON.stringify(scrapedData))
      }

      // Go to interview page
      router.push('/onboarding/interview')
    } catch (error) {
      console.error('Error:', error)
      // Still continue to interview even if scrape fails
      router.push('/onboarding/interview')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-6">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Vamos a conocer tu negocio
            </h1>
            <p className="text-lg text-blue-200">
              Tu recepcionista AI aprenderá todo sobre ti en una breve conversación
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Tu sitio web (opcional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="tuempresa.com"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl 
                             text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent"
                    disabled={skipWebsite}
                  />
                </div>
                <p className="mt-2 text-sm text-blue-300/70">
                  Si tienes web, la analizaremos para aprender más rápido
                </p>
              </div>

              {/* Skip website option */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipWebsite}
                  onChange={(e) => {
                    setSkipWebsite(e.target.checked)
                    if (e.target.checked) setWebsiteUrl('')
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 
                           focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-blue-200">
                  No tengo web, prefiero explicarlo por voz
                </span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 
                         bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
                         text-white font-semibold rounded-xl transition-all
                         hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando tu web...
                  </>
                ) : (
                  <>
                    Empezar entrevista
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* What to expect */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-blue-200 mb-3">
                ¿Qué va a pasar?
              </h3>
              <ul className="space-y-2 text-sm text-blue-300/70">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">1.</span>
                  Tendrás una conversación por voz con tu AI (~5 min)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  Te preguntará sobre tus servicios, horarios, etc.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">3.</span>
                  Aprenderá todo lo necesario para atender a tus clientes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">4.</span>
                  Podrás revisar y editar la información después
                </li>
              </ul>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-blue-300/50 text-sm">
            <span>🔒 Datos encriptados</span>
            <span>🇪🇺 GDPR compliant</span>
            <span>🇪🇸 Español nativo</span>
          </div>
        </div>
      </div>
    </main>
  )
}
