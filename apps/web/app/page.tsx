'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { 
  Phone, 
  MessageCircle, 
  Calendar, 
  ArrowRight, 
  Check, 
  Mic, 
  MicOff,
  Volume2,
  Play,
  Pause,
  Star,
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe
} from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      <Navbar />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-xl ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Recepcionista
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#demo" className={`font-medium transition ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
              Demo
            </a>
            <a href="#features" className={`font-medium transition ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
              Funciones
            </a>
            <a href="#pricing" className={`font-medium transition ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
              Precios
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className={`hidden sm:block font-medium transition ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/onboarding"
              className="px-5 py-2.5 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition shadow-lg shadow-black/5"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  const words = ['responde llamadas', 'agenda citas', 'contesta WhatsApp', 'nunca descansa']
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 animate-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-reveal">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-sm text-sky-200 font-medium">Tu recepcionista con IA</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
          <span className="opacity-0 animate-reveal">Siempre a tu lado,</span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="opacity-0 animate-reveal animate-reveal-delay-1 bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
              {words[currentWord]}
            </span>
          </span>
        </h1>

        <p className="mt-8 text-xl text-slate-300 max-w-2xl mx-auto opacity-0 animate-reveal animate-reveal-delay-2">
          Una recepcionista AI que atiende llamadas, responde WhatsApp, y agenda citas. 
          <span className="text-white font-medium"> Tu negocio disponible 24/7.</span>
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-reveal animate-reveal-delay-3">
          <Link
            href="/onboarding"
            className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-semibold rounded-full hover:bg-sky-50 transition-all hover:scale-105 shadow-xl shadow-sky-500/20"
          >
            Empezar gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-3 px-8 py-4 text-white font-medium hover:text-sky-300 transition"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 ml-0.5" />
            </div>
            Probar demo en vivo
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto opacity-0 animate-reveal animate-reveal-delay-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">24/7</div>
            <div className="mt-1 text-sm text-slate-400">Disponible</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">{"<2s"}</div>
            <div className="mt-1 text-sm text-slate-400">Respuesta</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">99%</div>
            <div className="mt-1 text-sm text-slate-400">Satisfacción</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1.5 h-2.5 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

function DemoSection() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'speaking'>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startDemo = async () => {
    setStatus('connecting')
    
    // Simulate connection
    await new Promise(r => setTimeout(r, 1000))
    
    const greeting = "¡Hola! Soy la recepcionista AI de Recepcionista.com. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros servicios, agendar una cita, o lo que necesites."
    setMessages([{ role: 'ai', text: greeting }])
    setStatus('active')
    
    // Speak greeting
    await speakText(greeting)
  }

  const speakText = async (text: string) => {
    setAiSpeaking(true)
    setStatus('speaking')
    
    try {
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
        // Browser fallback
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        speechSynthesis.speak(utterance)
        await new Promise(r => setTimeout(r, text.length * 50))
      }
    } catch {
      // Silent fallback
    }
    
    setAiSpeaking(false)
    setStatus('active')
  }

  const startRecording = async () => {
    if (status !== 'active') return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      alert('Por favor permite el acceso al micrófono para usar el demo.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    const reader = new FileReader()
    const base64Audio = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.readAsDataURL(audioBlob)
    })

    // STT
    const sttRes = await fetch('/api/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64Audio })
    })

    let userText = ''
    if (sttRes.ok) {
      const data = await sttRes.json()
      userText = data.text || ''
    }

    if (!userText) return

    setMessages(prev => [...prev, { role: 'user', text: userText }])

    // Get AI response
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', text: userText }],
        topic: 'demo'
      })
    })

    if (chatRes.ok) {
      const data = await chatRes.json()
      const aiText = data.text || 'Lo siento, no entendí. ¿Puedes repetir?'
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
      await speakText(aiText)
    }
  }

  return (
    <section id="demo" className="py-24 bg-gradient-to-b from-slate-50 to-white relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
            <Mic className="w-4 h-4" />
            Demo interactivo
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Habla con tu recepcionista
          </h2>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
            Prueba ahora mismo cómo suena. Sin registro, sin compromisos.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Demo card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Recepcionista AI</div>
                  <div className="text-slate-400 text-sm">
                    {status === 'idle' && 'Listo para llamar'}
                    {status === 'connecting' && 'Conectando...'}
                    {status === 'active' && 'En línea'}
                    {status === 'speaking' && 'Hablando...'}
                  </div>
                </div>
              </div>
              {(status === 'active' || status === 'speaking') && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Activo</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-6 bg-slate-50">
              {status === 'idle' ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center mb-4">
                    <Phone className="w-10 h-10 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    ¿Listo para probar?
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-sm">
                    Haz clic en "Iniciar demo" y mantén presionado el micrófono para hablar
                  </p>
                  <button
                    onClick={startDemo}
                    className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg shadow-sky-500/30"
                  >
                    Iniciar demo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-sky-500 text-white' 
                          : 'bg-white shadow-sm border border-slate-200 text-slate-800'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiSpeaking && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-slate-200">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-sky-500 rounded-full"
                              style={{
                                height: '16px',
                                animation: 'speaking 0.5s ease-in-out infinite',
                                animationDelay: `${i * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            {status !== 'idle' && (
              <div className="p-6 border-t border-slate-200 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-slate-500">
                    {isRecording ? '🔴 Grabando... suelta para enviar' : 'Mantén presionado para hablar'}
                  </p>
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={status === 'speaking'}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50' 
                        : status === 'speaking'
                        ? 'bg-slate-200 cursor-not-allowed'
                        : 'bg-sky-500 hover:bg-sky-600 hover:scale-105 shadow-lg shadow-sky-500/30'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-7 h-7 text-white" />
                    ) : (
                      <Mic className="w-7 h-7 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Audio seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Respuesta instantánea</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Español nativo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Llamadas de voz',
      description: 'Atiende llamadas con una voz natural y humana. Responde preguntas, proporciona información y transfiere cuando es necesario.',
      color: 'sky'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'WhatsApp Business',
      description: 'El mismo asistente inteligente atiende tus mensajes de WhatsApp. Una sola configuración para todos tus canales.',
      color: 'green'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Agenda automática',
      description: 'Integración con Google Calendar y Outlook. Los clientes reservan citas directamente sin intervención manual.',
      color: 'violet'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Disponible 24/7',
      description: 'Tu recepcionista nunca duerme, no toma vacaciones, y siempre responde con la misma calidad y profesionalismo.',
      color: 'orange'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Aprende de ti',
      description: 'Mejora con cada interacción. Aprende tu negocio, tus servicios, y cómo prefieres que atienda a tus clientes.',
      color: 'pink'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Transferencia inteligente',
      description: 'Sabe cuándo es momento de conectar con un humano. Transfiere llamadas o escala conversaciones automáticamente.',
      color: 'indigo'
    },
  ]

  const colorClasses: Record<string, string> = {
    sky: 'bg-sky-100 text-sky-600',
    green: 'bg-green-100 text-green-600',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  }

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Todo incluido
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Todo lo que tu negocio necesita
          </h2>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
            Una solución completa para nunca perder un cliente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-transparent hover:border-slate-200 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${colorClasses[feature.color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Cuéntanos de tu negocio',
      description: 'Comparte tu sitio web o háblanos de tu negocio. Nuestro AI aprende todo en minutos.',
      icon: <MessageCircle className="w-6 h-6" />
    },
    {
      step: '02',
      title: 'Personaliza tu asistente',
      description: 'Revisa y ajusta cómo responde. Define horarios, servicios, precios y más.',
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      step: '03',
      title: 'Conecta y listo',
      description: 'Activa tu número de teléfono y WhatsApp. Tu recepcionista empieza a trabajar.',
      icon: <Phone className="w-6 h-6" />
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Listo en 5 minutos
          </h2>
          <p className="mt-4 text-xl text-slate-600">
            Sin código, sin complicaciones
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500 text-white font-bold text-xl mb-6 shadow-lg shadow-sky-500/30">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Antes perdía llamadas porque no podía atender. Ahora mi recepcionista AI responde todo y mis clientes están encantados.",
      author: "María García",
      role: "Clínica Dental García",
      avatar: "MG"
    },
    {
      quote: "La calidad de la voz es increíble. Mis clientes no saben que es una AI. Ha sido un cambio total para mi negocio.",
      author: "Carlos Rodríguez",
      role: "Fontanería Rodríguez",
      avatar: "CR"
    },
    {
      quote: "Configuré todo en 10 minutos. Ahora recibo citas automáticamente incluso a las 3 de la mañana. Increíble.",
      author: "Ana Martínez",
      role: "Salón de Belleza Ana",
      avatar: "AM"
    },
  ]

  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Negocios que confían en nosotros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{t.author}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      description: 'Para emprendedores',
      features: [
        '500 minutos de voz',
        '1,000 mensajes WhatsApp',
        '1 número de teléfono',
        'Google Calendar',
        'Soporte por email',
      ],
      cta: 'Empezar gratis',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '79',
      description: 'Para negocios en crecimiento',
      features: [
        '2,000 minutos de voz',
        '5,000 mensajes WhatsApp',
        '3 números de teléfono',
        'Todas las integraciones',
        'Transferencia a humanos',
        'Soporte prioritario',
      ],
      cta: 'Elegir Pro',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: '199',
      description: 'Para grandes volúmenes',
      features: [
        'Minutos ilimitados',
        'Mensajes ilimitados',
        'Números ilimitados',
        'API personalizada',
        'Soporte dedicado',
        'SLA garantizado',
      ],
      cta: 'Contactar ventas',
      highlighted: false
    },
  ]

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
            7 días gratis
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Precios simples y transparentes
          </h2>
          <p className="mt-4 text-xl text-slate-600">
            Sin sorpresas. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.highlighted 
                  ? 'bg-slate-900 text-white scale-105 shadow-2xl shadow-slate-900/20' 
                  : 'bg-white shadow-lg shadow-slate-200/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-sky-500 text-white text-sm font-medium rounded-full">
                  Más popular
                </div>
              )}
              <div className={`text-sm font-medium ${plan.highlighted ? 'text-sky-400' : 'text-slate-500'}`}>
                {plan.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  €{plan.price}
                </span>
                <span className={plan.highlighted ? 'text-slate-400' : 'text-slate-500'}>/mes</span>
              </div>
              <p className={`mt-2 ${plan.highlighted ? 'text-slate-400' : 'text-slate-600'}`}>
                {plan.description}
              </p>
              
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <Check className={`w-5 h-5 ${plan.highlighted ? 'text-sky-400' : 'text-sky-500'}`} />
                    <span className={plan.highlighted ? 'text-slate-300' : 'text-slate-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/onboarding"
                className={`mt-8 block w-full py-3 rounded-xl font-semibold text-center transition-all hover:scale-105 ${
                  plan.highlighted
                    ? 'bg-sky-500 text-white hover:bg-sky-400'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-sky-500 to-blue-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white">
          ¿Listo para no perder más clientes?
        </h2>
        <p className="mt-6 text-xl text-sky-100 max-w-2xl mx-auto">
          Únete a cientos de negocios que ya atienden a sus clientes 24/7 con su recepcionista AI
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-full hover:bg-sky-50 transition-all hover:scale-105 shadow-xl"
          >
            Empezar gratis — Sin tarjeta
          </Link>
          <a
            href="#demo"
            className="px-8 py-4 text-white font-medium border-2 border-white/30 rounded-full hover:bg-white/10 transition"
          >
            Ver demo primero
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Recepcionista</span>
            </Link>
            <p className="text-slate-400 text-sm">
              Tu recepcionista AI disponible 24/7
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-slate-400 hover:text-white transition">Funciones</a></li>
              <li><a href="#pricing" className="text-slate-400 hover:text-white transition">Precios</a></li>
              <li><a href="#demo" className="text-slate-400 hover:text-white transition">Demo</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition">Sobre nosotros</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacidad</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Términos</a></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition">RGPD</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 Recepcionista.com. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
