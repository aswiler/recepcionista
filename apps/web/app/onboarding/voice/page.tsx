'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ArrowRight, ArrowLeft, Loader2, Play, Pause, Volume2 } from 'lucide-react'

// Voice options organized by language/region
// Using ElevenLabs multilingual voices optimized for Spanish (Castilian) and Catalan
// Note: Voice IDs are from ElevenLabs Voice Library - these are placeholder IDs that should be 
// replaced with actual voice IDs from your ElevenLabs account's Voice Library
const VOICE_CATEGORIES = [
  {
    id: 'castellano',
    name: 'Español (Castellano)',
    flag: '🇪🇸',
    voices: [
      {
        id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual, works well with Spanish
        name: 'Sara',
        description: 'Profesional y equilibrada',
        gender: 'female',
        avatar: '👩‍💼',
        sample: 'Hola, soy tu recepcionista virtual. ¿En qué puedo ayudarte hoy?',
        language: 'es-ES',
      },
      {
        id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - multilingual
        name: 'María',
        description: 'Cálida y cercana',
        gender: 'female',
        avatar: '👩',
        sample: 'Bienvenido, es un placer atenderte. ¿Qué necesitas?',
        language: 'es-ES',
      },
      {
        id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - multilingual, professional
        name: 'Pablo',
        description: 'Profesional y confiable',
        gender: 'male',
        avatar: '👨‍💼',
        sample: 'Buenos días, gracias por llamar. ¿Cómo puedo asistirte?',
        language: 'es-ES',
      },
      {
        id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual, serious
        name: 'Carlos',
        description: 'Serio y formal',
        gender: 'male',
        avatar: '👨',
        sample: 'Buenas tardes. ¿En qué puedo servirle?',
        language: 'es-ES',
      },
    ],
  },
  {
    id: 'catala',
    name: 'Català',
    flag: '🏴󠁥󠁳󠁣󠁴󠁿',
    voices: [
      {
        id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
        name: 'Marta',
        description: 'Professional i equilibrada',
        gender: 'female',
        avatar: '👩‍💼',
        sample: 'Hola, soc la teva recepcionista virtual. En què puc ajudar-te avui?',
        language: 'ca',
      },
      {
        id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - multilingual
        name: 'Laia',
        description: 'Càlida i propera',
        gender: 'female',
        avatar: '👩',
        sample: 'Benvingut, és un plaer atendre\'t. Què necessites?',
        language: 'ca',
      },
      {
        id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - multilingual
        name: 'Jordi',
        description: 'Professional i fiable',
        gender: 'male',
        avatar: '👨‍💼',
        sample: 'Bon dia, gràcies per trucar. Com puc ajudar-te?',
        language: 'ca',
      },
      {
        id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
        name: 'Marc',
        description: 'Seriós i formal',
        gender: 'male',
        avatar: '👨',
        sample: 'Bona tarda. En què puc servir-lo?',
        language: 'ca',
      },
    ],
  },
]

// Flatten voices for easy lookup
const ALL_VOICES = VOICE_CATEGORIES.flatMap(cat => 
  cat.voices.map(v => ({ ...v, category: cat.id, categoryName: cat.name }))
)

export default function OnboardingVoiceSelection() {
  const router = useRouter()
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('castellano')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check for existing onboarding data
  useEffect(() => {
    const onboardingData = sessionStorage.getItem('onboardingData')
    if (!onboardingData) {
      router.push('/onboarding')
      return
    }
    
    // Check for previously selected voice
    const savedVoice = sessionStorage.getItem('selectedVoice')
    if (savedVoice) {
      setSelectedVoice(savedVoice)
      // Find which category this voice belongs to
      const voice = ALL_VOICES.find(v => `${v.id}-${v.language}` === savedVoice)
      if (voice) {
        setSelectedCategory(voice.category)
      }
    }
  }, [router])

  const currentCategory = VOICE_CATEGORIES.find(c => c.id === selectedCategory)

  const playVoiceSample = async (voice: typeof ALL_VOICES[0]) => {
    const voiceKey = `${voice.id}-${voice.language}`
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // If clicking the same voice that's playing, just stop
    if (playingVoice === voiceKey) {
      setPlayingVoice(null)
      return
    }

    setLoadingVoice(voiceKey)
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: voice.sample,
          voiceId: voice.id,
          language: voice.language,
        }),
      })

      if (!response.ok) throw new Error('TTS failed')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
      setPlayingVoice(voiceKey)
    } catch (error) {
      console.error('Error playing voice sample:', error)
    } finally {
      setLoadingVoice(null)
    }
  }

  const handleContinue = () => {
    if (!selectedVoice) return
    
    // Save selected voice (includes language suffix for uniqueness)
    sessionStorage.setItem('selectedVoice', selectedVoice)
    
    // Find voice details
    const voice = ALL_VOICES.find(v => `${v.id}-${v.language}` === selectedVoice)
    if (voice) {
      sessionStorage.setItem('selectedVoiceName', voice.name)
      sessionStorage.setItem('selectedVoiceId', voice.id)
      sessionStorage.setItem('selectedVoiceLanguage', voice.language)
    }
    
    // Go to interview (Step 3)
    router.push('/onboarding/interview')
  }

  const handleBack = () => {
    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-500/50 flex items-center justify-center text-white/70 text-sm font-medium">✓</div>
            <div className="w-12 h-1 bg-blue-500/50 rounded" />
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">2</div>
            <div className="w-12 h-1 bg-white/20 rounded" />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/50 text-sm">3</div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-6">
              <Mic className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Elige la voz de tu recepcionista
            </h1>
            <p className="text-lg text-blue-200">
              Selecciona el idioma y la voz que mejor represente a tu negocio
            </p>
          </div>

          {/* Language/Region Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {VOICE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                          ${selectedCategory === category.id
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
              >
                <span className="text-xl">{category.flag}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Voice Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {currentCategory?.voices.map((voice) => {
              const voiceKey = `${voice.id}-${voice.language}`
              const isSelected = selectedVoice === voiceKey
              const isPlaying = playingVoice === voiceKey
              const isLoading = loadingVoice === voiceKey
              
              return (
                <button
                  key={voiceKey}
                  onClick={() => setSelectedVoice(voiceKey)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                >
                  {/* Avatar and name */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{voice.avatar}</span>
                    <div>
                      <h3 className="font-semibold text-white">{voice.name}</h3>
                      <p className="text-sm text-blue-300/70">{voice.description}</p>
                    </div>
                  </div>

                  {/* Gender badge */}
                  <div className="mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      voice.gender === 'female' 
                        ? 'bg-pink-500/20 text-pink-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {voice.gender === 'female' ? 'Femenina' : 'Masculina'}
                    </span>
                  </div>

                  {/* Play button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      playVoiceSample(voice)
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                              transition-colors text-sm font-medium
                              ${isPlaying 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        {selectedCategory === 'catala' ? 'Reproduint' : 'Reproduciendo'}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {selectedCategory === 'catala' ? 'Escoltar' : 'Escuchar'}
                      </>
                    )}
                  </button>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-8">
            <Volume2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-200">
              <strong>{selectedCategory === 'catala' ? 'Consell:' : 'Consejo:'}</strong>{' '}
              {selectedCategory === 'catala' 
                ? "Tria una veu que reflecteixi la personalitat del teu negoci. Una clínica dental pot preferir una veu professional, mentre que un gimnàs pot optar per una més enèrgica."
                : "Elige una voz que refleje la personalidad de tu negocio. Una clínica dental puede preferir una voz profesional, mientras que un gimnasio puede optar por una más energética."
              }
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 py-4 px-6 
                       bg-white/10 hover:bg-white/20
                       text-white font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              {selectedCategory === 'catala' ? 'Enrere' : 'Atrás'}
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!selectedVoice}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 
                       bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/30 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-all
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              {selectedCategory === 'catala' ? 'Continuar' : 'Continuar'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
