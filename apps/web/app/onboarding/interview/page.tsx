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
  MessageCircle
} from 'lucide-react'

interface Message {
  role: 'assistant' | 'user'
  text: string
}

const INTERVIEW_TOPICS = [
  { id: 'intro', label: 'Información básica', done: false },
  { id: 'services', label: 'Servicios', done: false },
  { id: 'hours', label: 'Horarios', done: false },
  { id: 'appointments', label: 'Citas', done: false },
  { id: 'faqs', label: 'Preguntas frecuentes', done: false },
  { id: 'escalation', label: 'Transferencias', done: false },
]

export default function InterviewPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'complete'>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTopic, setCurrentTopic] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiSpeaking, setAiSpeaking] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start the interview with a greeting
  const startInterview = async () => {
    setStatus('processing')
    
    // Get scraped data
    const scrapedData = sessionStorage.getItem('scrapedData')
    const businessInfo = scrapedData ? JSON.parse(scrapedData) : {}
    
    // Generate greeting
    const greeting = businessInfo.businessName 
      ? `¡Hola! Veo que tu negocio es ${businessInfo.businessName}. Me encantaría conocer más sobre ti. ¿Puedes contarme brevemente qué servicios ofreces?`
      : `¡Hola! Soy tu asistente de Recepcionista.com. Voy a hacerte algunas preguntas para configurar tu recepcionista AI. ¿Puedes empezar contándome el nombre de tu negocio?`
    
    setMessages([{ role: 'assistant', text: greeting }])
    
    // Speak the greeting
    await speakText(greeting)
    setStatus('listening')
  }

  // Text-to-speech using browser API (fallback) or ElevenLabs
  const speakText = async (text: string) => {
    setAiSpeaking(true)
    setStatus('speaking')
    
    try {
      // Try ElevenLabs API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve()
          audio.onerror = () => resolve()
          audio.play().catch(() => resolve())
        })
      } else {
        // Fallback to browser TTS
        await browserTTS(text)
      }
    } catch (error) {
      // Fallback to browser TTS
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
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Process audio: transcribe and get AI response
  const processAudio = async (audioBlob: Blob) => {
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
      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      })

      let userText = ''
      if (sttResponse.ok) {
        const data = await sttResponse.json()
        userText = data.text || ''
      }

      if (!userText) {
        setStatus('listening')
        return
      }

      // Add user message
      setMessages(prev => [...prev, { role: 'user', text: userText }])
      setTranscript('')

      // Get AI response
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text: userText }],
          topic: INTERVIEW_TOPICS[currentTopic]?.id,
          scrapedData: sessionStorage.getItem('scrapedData')
        })
      })

      if (aiResponse.ok) {
        const data = await aiResponse.json()
        const aiText = data.text || 'Lo siento, no entendí. ¿Puedes repetir?'
        
        setMessages(prev => [...prev, { role: 'assistant', text: aiText }])
        
        // Check if topic is complete
        if (data.topicComplete && currentTopic < INTERVIEW_TOPICS.length - 1) {
          setCurrentTopic(prev => prev + 1)
        }
        
        // Check if interview is complete
        if (data.interviewComplete || currentTopic >= INTERVIEW_TOPICS.length - 1) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: '¡Perfecto! Ya tengo toda la información que necesito. Tu recepcionista AI está lista. Haz clic en "Continuar" para ver el resumen.'
          }])
          setStatus('complete')
          return
        }
        
        // Speak the response
        await speakText(aiText)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      setStatus('listening')
    }
  }

  // Skip interview (for demo)
  const skipInterview = () => {
    setStatus('complete')
    setMessages([
      { role: 'assistant', text: 'Entrevista completada. Tu recepcionista está configurada con la información del sitio web.' }
    ])
  }

  const continueToReview = () => {
    sessionStorage.setItem('interviewMessages', JSON.stringify(messages))
    router.push('/onboarding/complete')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative min-h-screen flex">
        {/* Left panel - Chat */}
        <div className="flex-1 flex flex-col p-8">
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Entrevista con tu AI
              </h1>
              <p className="text-blue-200">
                Habla directamente con tu recepcionista para configurarla
              </p>
            </div>

            {/* Messages area */}
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/10 p-6 mb-6 overflow-y-auto max-h-[50vh]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-blue-400/50 mb-4" />
                  <p className="text-white/50">
                    Haz clic en "Iniciar" para comenzar la entrevista
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
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
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
                <div className="flex gap-4">
                  <button
                    onClick={startInterview}
                    className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 
                             text-white font-semibold rounded-full transition-all
                             hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <Mic className="w-5 h-5" />
                    Iniciar entrevista
                  </button>
                  <button
                    onClick={skipInterview}
                    className="px-6 py-4 text-white/60 hover:text-white font-medium transition"
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
                      <span className="text-blue-300">Presiona para hablar</span>
                    )}
                    {status === 'listening' && isRecording && (
                      <span className="text-red-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Grabando... (suelta para enviar)
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
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={status === 'processing' || status === 'speaking'}
                    className={`p-6 rounded-full transition-all ${
                      isRecording
                        ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                        : status === 'processing' || status === 'speaking'
                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg shadow-blue-500/30'
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
                  Continuar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Progress */}
        <div className="w-80 bg-black/20 border-l border-white/10 p-6">
          <h3 className="text-sm font-medium text-blue-200 mb-4 uppercase tracking-wider">
            Progreso de la entrevista
          </h3>
          
          <div className="space-y-3">
            {INTERVIEW_TOPICS.map((topic, index) => (
              <div
                key={topic.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  index < currentTopic
                    ? 'bg-green-500/10'
                    : index === currentTopic && status !== 'idle'
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-white/5'
                }`}
              >
                <div className={`flex-shrink-0 ${
                  index < currentTopic
                    ? 'text-green-400'
                    : index === currentTopic && status !== 'idle'
                    ? 'text-blue-400'
                    : 'text-white/30'
                }`}>
                  {index < currentTopic ? (
                    <Check className="w-5 h-5" />
                  ) : index === currentTopic && status !== 'idle' ? (
                    <Circle className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm ${
                  index < currentTopic
                    ? 'text-green-300'
                    : index === currentTopic && status !== 'idle'
                    ? 'text-white'
                    : 'text-white/50'
                }`}>
                  {topic.label}
                </span>
              </div>
            ))}
          </div>

          {status === 'complete' && (
            <div className="mt-8 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
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
