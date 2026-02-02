'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ArrowRight, ArrowLeft, Loader2, Play, Pause, Volume2 } from 'lucide-react'

// ElevenLabs voice options - multilingual voices that work well with Spanish
const VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Profesional y clara',
    gender: 'female',
    avatar: '👩‍💼',
    sample: 'Hola, soy tu recepcionista virtual. ¿En qué puedo ayudarte hoy?',
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    description: 'Cálida y amigable',
    gender: 'female',
    avatar: '👩',
    sample: 'Bienvenido, es un placer atenderte. ¿Qué necesitas?',
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    description: 'Profesional y confiable',
    gender: 'male',
    avatar: '👨‍💼',
    sample: 'Buenos días, gracias por llamar. ¿Cómo puedo asistirte?',
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    description: 'Joven y energética',
    gender: 'female',
    avatar: '👧',
    sample: '¡Hola! Estoy aquí para ayudarte. ¿Qué te gustaría saber?',
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    description: 'Serio y formal',
    gender: 'male',
    avatar: '👨',
    sample: 'Buenas tardes. ¿En qué puedo servirle?',
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: 'Elegante y sofisticada',
    gender: 'female',
    avatar: '👩‍🦰',
    sample: 'Encantada de atenderte. ¿Cómo puedo ayudarte hoy?',
  },
]

export default function OnboardingVoiceSelection() {
  const router = useRouter()
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check for existing onboarding data
  useEffect(() => {
    const onboardingData = sessionStorage.getItem('onboardingData')
    if (!onboardingData) {
      // No business data, redirect to step 1
      router.push('/onboarding')
      return
    }
    
    // Check for previously selected voice
    const savedVoice = sessionStorage.getItem('selectedVoice')
    if (savedVoice) {
      setSelectedVoice(savedVoice)
    }
  }, [router])

  const playVoiceSample = async (voice: typeof VOICES[0]) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // If clicking the same voice that's playing, just stop
    if (playingVoice === voice.id) {
      setPlayingVoice(null)
      return
    }

    setLoadingVoice(voice.id)
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: voice.sample,
          voiceId: voice.id,
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
      setPlayingVoice(voice.id)
    } catch (error) {
      console.error('Error playing voice sample:', error)
    } finally {
      setLoadingVoice(null)
    }
  }

  const handleContinue = () => {
    if (!selectedVoice) return
    
    // Save selected voice
    sessionStorage.setItem('selectedVoice', selectedVoice)
    const voiceData = VOICES.find(v => v.id === selectedVoice)
    if (voiceData) {
      sessionStorage.setItem('selectedVoiceName', voiceData.name)
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
        <div className="w-full max-w-3xl">
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
              Selecciona la voz que mejor represente a tu negocio
            </p>
          </div>

          {/* Voice Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left
                          ${selectedVoice === voice.id 
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

                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    playVoiceSample(voice)
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                            transition-colors text-sm font-medium
                            ${playingVoice === voice.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
                >
                  {loadingVoice === voice.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : playingVoice === voice.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Reproduciendo
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Escuchar
                    </>
                  )}
                </button>

                {/* Selected indicator */}
                {selectedVoice === voice.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-8">
            <Volume2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-200">
              <strong>Consejo:</strong> Elige una voz que refleje la personalidad de tu negocio. 
              Una clínica dental puede preferir una voz profesional, mientras que un gimnasio 
              puede optar por una más energética.
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
              Atrás
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!selectedVoice}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 
                       bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/30 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-all
                       hover:scale-[1.02] active:scale-[0.98]"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
