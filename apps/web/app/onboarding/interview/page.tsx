'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Check, 
  Circle,
  Loader2,
  MessageCircle,
  ArrowLeft,
  Clock,
  Sparkles,
  Building2,
  Calendar,
  HelpCircle,
  Phone,
  Users
} from 'lucide-react'

interface Message {
  role: 'assistant' | 'user'
  text: string
}

interface ExtractedInfo {
  businessName?: string
  businessType?: string
  description?: string
  services?: Array<{
    name: string
    description?: string
    price?: string
    duration?: string
  }>
  hours?: string
  appointmentProcess?: string
  cancellationPolicy?: string
  faqs?: Array<{ question: string; answer: string }>
  transferRules?: {
    urgencies?: string[]
    complexCases?: string[]
  }
  tone?: string
  specialInstructions?: string
}

interface InterviewState {
  currentPhase: string
  phasesCompleted: string[]
  extractedInfo: ExtractedInfo
  questionsAskedInPhase: number
  totalExchanges: number
  confidence: Record<string, number>
}

interface Progress {
  current: number
  total: number
  percentage: number
}

const INTERVIEW_PHASES = [
  { id: 'intro', label: 'Confirmación', icon: Building2, color: 'blue' },
  { id: 'services', label: 'Servicios', icon: Sparkles, color: 'purple' },
  { id: 'hours', label: 'Horarios', icon: Clock, color: 'green' },
  { id: 'appointments', label: 'Citas', icon: Calendar, color: 'orange' },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'pink' },
  { id: 'escalation', label: 'Transferencias', icon: Phone, color: 'red' },
]

export default function InterviewPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'complete'>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [businessType, setBusinessType] = useState<string>('')
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null)
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 6, percentage: 0 })
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({})
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>('3-5 min')
  const [startTime, setStartTime] = useState<number | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for onboarding data and load voice selection
  useEffect(() => {
    const onboardingData = sessionStorage.getItem('onboardingData')
    if (!onboardingData) {
      router.push('/onboarding')
      return
    }

    const parsed = JSON.parse(onboardingData)
    setBusinessName(parsed.businessName || '')

    // Load scraped data for business type
    const scrapedData = sessionStorage.getItem('scrapedData')
    if (scrapedData) {
      try {
        const scraped = JSON.parse(scrapedData)
        setBusinessType(scraped.businessType || parsed.industry || '')
      } catch {
        setBusinessType(parsed.industry || '')
      }
    }

    // Get the actual ElevenLabs voice ID (not the key with language suffix)
    const voiceId = sessionStorage.getItem('selectedVoiceId')
    if (voiceId) {
      console.log('🎤 Using ElevenLabs voice:', voiceId)
      setSelectedVoiceId(voiceId)
    } else {
      // Fallback: try to extract from selectedVoice (format: voiceId-language)
      const selectedVoice = sessionStorage.getItem('selectedVoice')
      if (selectedVoice) {
        const extractedId = selectedVoice.split('-')[0]
        console.log('🎤 Extracted voice ID from selectedVoice:', extractedId)
        setSelectedVoiceId(extractedId)
      }
    }
    
    // Check for resumed interview
    const savedState = sessionStorage.getItem('interviewState')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        setInterviewState(state)
        setExtractedInfo(state.extractedInfo || {})
      } catch {
        // Start fresh
      }
    }
  }, [router])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update estimated time based on progress
  useEffect(() => {
    if (startTime && progress.percentage > 0) {
      const elapsed = (Date.now() - startTime) / 1000 / 60 // minutes
      const estimatedTotal = elapsed / (progress.percentage / 100)
      const remaining = Math.max(0, estimatedTotal - elapsed)
      
      if (remaining < 1) {
        setEstimatedTimeLeft('< 1 min')
      } else {
        setEstimatedTimeLeft(`~${Math.ceil(remaining)} min`)
      }
    }
  }, [progress, startTime])

  // Save state on changes
  useEffect(() => {
    if (interviewState) {
      sessionStorage.setItem('interviewState', JSON.stringify(interviewState))
    }
  }, [interviewState])

  // Start the interview with a smart greeting
  const startInterview = async () => {
    setStatus('processing')
    setStartTime(Date.now())
    
    const scrapedData = sessionStorage.getItem('scrapedData')
    let scraped: Record<string, unknown> = {}
    try {
      if (scrapedData) scraped = JSON.parse(scrapedData)
    } catch {
      // Use empty object
    }
    
    // Generate smart greeting based on what we know
    const name = businessName || scraped.businessName as string
    const type = businessType || scraped.businessType as string
    const hasServices = scraped.services && Array.isArray(scraped.services) && scraped.services.length > 0
    
    let greeting: string
    
    if (name && type && hasServices) {
      // We know a lot - confirm and dig deeper
      greeting = `¡Hola! He revisado la información de ${name}. Veo que sois ${type === 'software' ? 'una empresa de software' : `un negocio de ${type}`}. Me gustaría confirmar algunos detalles y conocer cosas que no aparecen en vuestra web. ¿Empezamos?`
    } else if (name) {
      // We know the name but not much else
      greeting = `¡Hola! Soy la asistente de Recepcionista.com. Voy a ayudarte a configurar tu recepcionista AI para ${name}. Serán solo 3-5 minutos de preguntas. ¿Puedes contarme brevemente a qué os dedicáis?`
    } else {
      // We know nothing
      greeting = `¡Hola! Soy la asistente de Recepcionista.com. Voy a hacerte algunas preguntas para configurar tu recepcionista AI de forma personalizada. Serán unos 3-5 minutos. ¿Empezamos por el nombre de tu negocio?`
    }
    
    setMessages([{ role: 'assistant', text: greeting }])
    
    // Initialize state
    setInterviewState({
      currentPhase: 'intro',
      phasesCompleted: [],
      extractedInfo: scraped as unknown as ExtractedInfo,
      questionsAskedInPhase: 0,
      totalExchanges: 0,
      confidence: {},
    })
    
    await speakText(greeting)
    setStatus('listening')
  }

  // Text-to-speech using ElevenLabs with selected voice
  const speakText = async (text: string) => {
    setAiSpeaking(true)
    setStatus('speaking')
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voiceId: selectedVoiceId,
        })
      })
      
      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.play().catch(() => resolve())
        })
      } else {
        await browserTTS(text)
      }
    } catch {
      await browserTTS(text)
    }
    
    setAiSpeaking(false)
    setStatus('listening')
  }

  // Browser fallback TTS
  const browserTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1.0
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      speechSynthesis.speak(utterance)
    })
  }

  // Start recording from microphone
  const startRecording = async () => {
    if (isRecording || status === 'processing' || status === 'speaking') return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setStatus('listening')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('No se pudo acceder al micrófono. Por favor permite el acceso.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setStatus('processing')
    }
  }

  // Toggle recording
  const toggleRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    if (status === 'processing' || status === 'speaking') return
    
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Process audio: transcribe and get AI response
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setStatus('processing')
    
    try {
      // Convert blob to base64
      const reader = new FileReader()
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(audioBlob)
      })

      // Send to STT API
      console.log('🎤 Sending audio to STT...')
      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      })

      let userText = ''
      if (sttResponse.ok) {
        const data = await sttResponse.json()
        console.log('📝 STT response:', data)
        userText = data.text || ''
        
        // Check if STT returned an error message
        if (data.error) {
          console.error('STT error:', data.error)
        }
      } else {
        console.error('STT failed with status:', sttResponse.status)
        const errorData = await sttResponse.json().catch(() => ({}))
        console.error('STT error data:', errorData)
      }

      if (!userText) {
        console.log('⚠️ No text detected from speech')
        // Add a message to inform the user
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: 'No pude escucharte bien. ¿Puedes hablar más cerca del micrófono e intentarlo de nuevo?' 
        }])
        setStatus('listening')
        return
      }

      // Add user message
      const newMessages = [...messages, { role: 'user' as const, text: userText }]
      setMessages(newMessages)

      // Get AI response with enhanced interview state
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          topic: interviewState?.currentPhase || 'intro',
          scrapedData: sessionStorage.getItem('scrapedData'),
          interviewState: interviewState,
        })
      })

      if (aiResponse.ok) {
        const data = await aiResponse.json()
        const aiText = data.text || 'Lo siento, no entendí. ¿Puedes repetir?'
        
        setMessages(prev => [...prev, { role: 'assistant', text: aiText }])
        
        // Update state from response
        if (data.interviewState) {
          setInterviewState(data.interviewState)
        }
        
        // Update extracted info
        if (data.extractedInfo) {
          setExtractedInfo(data.extractedInfo)
          // Also save to session storage for review page
          sessionStorage.setItem('learnedInfo', JSON.stringify(data.extractedInfo))
        }
        
        // Update progress
        if (data.progress) {
          setProgress(data.progress)
        }
        
        // Check if interview is complete
        if (data.interviewComplete) {
          // Add completion message
          const completionMsg = '¡Perfecto! Ya tengo toda la información que necesito. Tu recepcionista AI va a quedar increíble. Haz clic en "Continuar" para ver el resumen.'
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: completionMsg
          }])
          setStatus('complete')
          setProgress({ current: 6, total: 6, percentage: 100 })
          
          // Save final state
          sessionStorage.setItem('interviewMessages', JSON.stringify([...newMessages, { role: 'assistant', text: aiText }, { role: 'assistant', text: completionMsg }]))
          sessionStorage.setItem('learnedInfo', JSON.stringify(data.extractedInfo || extractedInfo))
          return
        }
        
        // Speak the response
        await speakText(aiText)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      setStatus('listening')
    }
  }, [messages, interviewState, extractedInfo])

  // Skip interview
  const skipInterview = () => {
    setStatus('complete')
    setMessages([
      { role: 'assistant', text: 'Entrevista completada. Tu recepcionista está configurada con la información del sitio web.' }
    ])
  }

  const continueToReview = () => {
    sessionStorage.setItem('interviewMessages', JSON.stringify(messages))
    if (Object.keys(extractedInfo).length > 0) {
      sessionStorage.setItem('learnedInfo', JSON.stringify(extractedInfo))
    }
    router.push('/onboarding/complete')
  }

  const goBack = () => {
    router.push('/onboarding/voice')
  }

  // Get current phase index for display
  const currentPhaseIndex = INTERVIEW_PHASES.findIndex(p => p.id === interviewState?.currentPhase)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative min-h-screen flex">
        {/* Left panel - Chat */}
        <div className="flex-1 flex flex-col p-4 md:p-8">
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/50 flex items-center justify-center text-white/70 text-sm font-medium">✓</div>
              <div className="w-8 md:w-12 h-1 bg-blue-500/50 rounded" />
              <div className="w-8 h-8 rounded-full bg-blue-500/50 flex items-center justify-center text-white/70 text-sm font-medium">✓</div>
              <div className="w-8 md:w-12 h-1 bg-blue-500/50 rounded" />
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">3</div>
            </div>

            {/* Header with time estimate */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-white mb-2">
                Entrevista inteligente
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="text-blue-200">
                  Habla con tu recepcionista AI
                </span>
                {status !== 'idle' && (
                  <span className="flex items-center gap-1 text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {estimatedTimeLeft}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {status !== 'idle' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-blue-300 mb-1">
                  <span>Progreso: {progress.percentage}%</span>
                  <span>{progress.current}/{progress.total} temas</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/10 p-4 md:p-6 mb-4 overflow-y-auto max-h-[40vh] md:max-h-[45vh]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-blue-400/50 mb-4" />
                  <p className="text-white/50 mb-2">
                    Haz clic en &ldquo;Iniciar&rdquo; para comenzar
                  </p>
                  <p className="text-white/30 text-sm max-w-xs">
                    La AI te hará preguntas inteligentes adaptadas a tu tipo de negocio
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              {status === 'idle' && (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    onClick={startInterview}
                    className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 
                             text-white font-semibold rounded-full transition-all
                             hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <Sparkles className="w-5 h-5" />
                    Iniciar entrevista
                  </button>
                  <button
                    onClick={skipInterview}
                    className="px-6 py-3 text-white/60 hover:text-white font-medium transition"
                  >
                    Saltar →
                  </button>
                </div>
              )}

              {(status === 'listening' || status === 'processing' || status === 'speaking') && (
                <div className="flex flex-col items-center gap-4">
                  {/* Status indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    {status === 'listening' && !isRecording && (
                      <span className="text-blue-300">Toca para hablar</span>
                    )}
                    {status === 'listening' && isRecording && (
                      <span className="text-red-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Grabando... (toca para enviar)
                      </span>
                    )}
                    {status === 'processing' && (
                      <span className="text-yellow-300 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </span>
                    )}
                    {status === 'speaking' && (
                      <span className="text-green-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        AI hablando...
                      </span>
                    )}
                  </div>

                  {/* Mic button */}
                  <button
                    onClick={toggleRecording}
                    onTouchEnd={toggleRecording}
                    disabled={status === 'processing' || status === 'speaking'}
                    className={`p-6 rounded-full transition-all select-none touch-none ${
                      isRecording
                        ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50 animate-pulse'
                        : status === 'processing' || status === 'speaking'
                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg shadow-blue-500/30 active:scale-95'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>

                  <button
                    onClick={skipInterview}
                    className="text-sm text-white/40 hover:text-white/60 transition"
                  >
                    Terminar entrevista
                  </button>
                </div>
              )}

              {status === 'complete' && (
                <button
                  onClick={continueToReview}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 
                           text-white font-semibold rounded-full transition-all
                           hover:scale-105 active:scale-95"
                >
                  Ver resumen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Progress & Extracted Info */}
        <div className="hidden lg:flex lg:flex-col w-96 bg-black/20 border-l border-white/10 p-6 overflow-y-auto">
          {/* Phase Progress */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-blue-200 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Temas de la entrevista
            </h3>
            
            <div className="space-y-2">
              {INTERVIEW_PHASES.map((phase, index) => {
                const Icon = phase.icon
                const isCompleted = interviewState?.phasesCompleted.includes(phase.id)
                const isCurrent = phase.id === interviewState?.currentPhase && status !== 'idle'
                
                return (
                  <div
                    key={phase.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCompleted
                        ? 'bg-green-500/10 border border-green-500/20'
                        : isCurrent
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : isCurrent
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-white/5 text-white/30'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Icon className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCompleted
                        ? 'text-green-300'
                        : isCurrent
                        ? 'text-white font-medium'
                        : 'text-white/50'
                    }`}>
                      {phase.label}
                    </span>
                    {isCurrent && interviewState && (
                      <span className="ml-auto text-xs text-blue-300">
                        {interviewState.questionsAskedInPhase}/3
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Extracted Info Preview */}
          {Object.keys(extractedInfo).length > 0 && (
            <div className="mt-auto">
              <h3 className="text-sm font-medium text-blue-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Información aprendida
              </h3>
              
              <div className="space-y-3 text-sm">
                {extractedInfo.businessName && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">Negocio</div>
                    <div className="text-white">{extractedInfo.businessName}</div>
                  </div>
                )}
                
                {extractedInfo.services && extractedInfo.services.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">Servicios ({extractedInfo.services.length})</div>
                    <div className="text-white text-xs space-y-1">
                      {extractedInfo.services.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{s.name}</span>
                          {s.price && <span className="text-green-400 ml-2">{s.price}</span>}
                        </div>
                      ))}
                      {extractedInfo.services.length > 3 && (
                        <div className="text-white/40">+{extractedInfo.services.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )}
                
                {extractedInfo.hours && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">Horarios</div>
                    <div className="text-white text-xs">{extractedInfo.hours}</div>
                  </div>
                )}
                
                {extractedInfo.faqs && extractedInfo.faqs.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">FAQs aprendidas</div>
                    <div className="text-white">{extractedInfo.faqs.length} preguntas</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Check className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-green-300 text-sm">
                ¡Entrevista completada! Tu recepcionista está lista.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
