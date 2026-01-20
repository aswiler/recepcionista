'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Phone, 
  Calendar,
  Clock,
  Play,
  Pause,
  Download,
  Share2,
  User,
  Bot,
  CheckCircle2,
  MessageSquare,
  PhoneOutgoing,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react'

// Mock call data
const callData = {
  id: '1',
  caller: '+34 612 345 678',
  callerName: 'Ana Martínez',
  time: '14:32',
  date: 'Hoy, 15 de Enero 2024',
  duration: '3:24',
  status: 'completed',
  outcome: 'appointment',
  sentiment: 'positive',
  sentimentScore: 0.85,
  summary: 'La cliente llamó para reservar una cita de limpieza dental. Preguntó por disponibilidad el martes y se le ofreció hueco a las 10:00. Confirmó que tiene seguro Sanitas y se le informó que está cubierto. Reserva confirmada.',
  appointmentDetails: {
    date: 'Martes, 17 de Enero',
    time: '10:00',
    service: 'Limpieza dental',
    notes: 'Cliente con seguro Sanitas'
  },
  tags: ['cita reservada', 'seguro sanitas', 'limpieza'],
  transcript: [
    { speaker: 'ai', text: '¡Hola! Gracias por llamar a Clínica Dental García. ¿En qué puedo ayudarte?' },
    { speaker: 'customer', text: 'Hola, quería pedir cita para una limpieza.' },
    { speaker: 'ai', text: '¡Por supuesto! Estaré encantada de ayudarte. ¿Tienes algún día de preferencia?' },
    { speaker: 'customer', text: 'Pues si puede ser el martes me vendría bien, por la mañana.' },
    { speaker: 'ai', text: 'Perfecto, déjame comprobar la disponibilidad para el martes por la mañana...' },
    { speaker: 'ai', text: 'Tenemos hueco a las 10:00 o a las 11:30. ¿Cuál te viene mejor?' },
    { speaker: 'customer', text: 'A las 10 me viene genial.' },
    { speaker: 'ai', text: 'Estupendo. ¿Me puedes confirmar tu nombre completo?' },
    { speaker: 'customer', text: 'Ana Martínez.' },
    { speaker: 'ai', text: '¿Y tienes algún seguro dental, Ana?' },
    { speaker: 'customer', text: 'Sí, tengo Sanitas.' },
    { speaker: 'ai', text: '¡Perfecto! La limpieza está cubierta con Sanitas, así que no tendrás que pagar nada. Te confirmo la cita para el martes 17 de enero a las 10:00. ¿Necesitas algo más?' },
    { speaker: 'customer', text: 'No, eso es todo. Muchas gracias.' },
    { speaker: 'ai', text: '¡A ti! Te enviaremos un recordatorio por WhatsApp el día antes. ¡Hasta el martes!' },
    { speaker: 'customer', text: 'Vale, adiós.' },
  ]
}

export default function CallDetailPage({ params }: { params: { id: string } }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [copied, setCopied] = useState(false)

  const totalSeconds = 204 // 3:24

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyTranscript = () => {
    const text = callData.transcript.map(t => 
      `${t.speaker === 'ai' ? 'AI' : 'Cliente'}: ${t.text}`
    ).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link 
        href="/dashboard/calls"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a llamadas
      </Link>

      {/* Header Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Caller info */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-white">
                  {callData.callerName?.split(' ').map(n => n[0]).join('') || '?'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {callData.callerName || callData.caller}
                </h1>
                <p className="text-slate-400">{callData.caller}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {callData.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {callData.time} · {callData.duration}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Status & actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Outcome badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Cita reservada</span>
              </div>
              
              {/* Sentiment */}
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-slate-300">Positivo</span>
                  <span className="text-xs text-slate-500">{Math.round(callData.sentimentScore * 100)}%</span>
                </div>
              </div>

              {/* Actions */}
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors flex items-center justify-center shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(currentTime / totalSeconds) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={totalSeconds}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="text-sm text-slate-400 shrink-0 w-20 text-right">
              {formatTime(currentTime)} / {formatTime(totalSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transcript - 2 columns */}
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Transcripción</h3>
            </div>
            <button 
              onClick={copyTranscript}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          
          <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
            {callData.transcript.map((message, index) => (
              <div 
                key={index}
                className={`flex gap-3 ${message.speaker === 'ai' ? '' : 'flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.speaker === 'ai' 
                    ? 'bg-blue-500/20' 
                    : 'bg-purple-500/20'
                }`}>
                  {message.speaker === 'ai' ? (
                    <Bot className="w-4 h-4 text-blue-400" />
                  ) : (
                    <User className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className={`flex-1 max-w-[85%] ${message.speaker === 'ai' ? '' : 'text-right'}`}>
                  <p className="text-xs text-slate-500 mb-1">
                    {message.speaker === 'ai' ? 'AI Recepcionista' : callData.callerName || 'Cliente'}
                  </p>
                  <p className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                    message.speaker === 'ai'
                      ? 'bg-white/5 text-slate-200 rounded-tl-none'
                      : 'bg-blue-500/20 text-blue-100 rounded-tr-none'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Resumen AI</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300 leading-relaxed">{callData.summary}</p>
            </div>
          </div>

          {/* Appointment Details */}
          {callData.appointmentDetails && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-emerald-500/20">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Cita reservada</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Fecha</span>
                  <span className="text-sm font-medium text-white">{callData.appointmentDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Hora</span>
                  <span className="text-sm font-medium text-white">{callData.appointmentDetails.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Servicio</span>
                  <span className="text-sm font-medium text-white">{callData.appointmentDetails.service}</span>
                </div>
                {callData.appointmentDetails.notes && (
                  <div className="pt-3 border-t border-emerald-500/20">
                    <p className="text-xs text-slate-400 mb-1">Notas</p>
                    <p className="text-sm text-slate-300">{callData.appointmentDetails.notes}</p>
                  </div>
                )}
                <button className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Ver en calendario
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-medium text-white mb-3">Etiquetas</p>
            <div className="flex flex-wrap gap-2">
              {callData.tags.map((tag, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 text-sm bg-white/5 text-slate-300 rounded-lg border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-medium text-white mb-3">Acciones rápidas</p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 text-left text-sm text-slate-300 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <Phone className="w-4 h-4" />
                Llamar al cliente
              </button>
              <button className="w-full flex items-center gap-3 p-3 text-left text-sm text-slate-300 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <MessageSquare className="w-4 h-4" />
                Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
