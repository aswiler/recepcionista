'use client'

import { useState, useEffect, use } from 'react'
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
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface CallData {
  id: string
  caller: string
  callerName: string | null
  time: string
  date: string
  duration: string
  status: string
  outcome: string
  sentiment: string
  sentimentScore: number
  summary: string
  transcript: Array<{ speaker: string; text: string }>
  tags: string[]
  appointmentDetails: {
    date: string
    time: string
    service: string
    notes?: string
  } | null
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="w-32 h-5 bg-white/10 rounded animate-pulse" />
      
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="w-48 h-7 bg-white/10 rounded mb-2 animate-pulse" />
            <div className="w-32 h-5 bg-white/10 rounded mb-3 animate-pulse" />
            <div className="w-64 h-4 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-white/10 rounded mb-2 animate-pulse" />
                  <div className="w-full h-16 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="w-full h-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [callData, setCallData] = useState<CallData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCall() {
      try {
        setLoading(true)
        const res = await fetch(`/api/dashboard/calls/${resolvedParams.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Llamada no encontrada')
          }
          throw new Error('Error al cargar la llamada')
        }
        const data = await res.json()
        setCallData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCall()
  }, [resolvedParams.id])

  // Parse duration to seconds
  const parseDuration = (duration: string) => {
    const parts = duration.split(':')
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0')
  }

  const totalSeconds = callData ? parseDuration(callData.duration) : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyTranscript = () => {
    if (!callData) return
    const text = callData.transcript.map(t => 
      `${t.speaker === 'ai' ? 'AI' : 'Cliente'}: ${t.text}`
    ).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error || !callData) {
    return (
      <div className="space-y-6">
        <Link 
          href="/dashboard/calls"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a llamadas
        </Link>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-lg font-medium text-white mb-2">
            {error || 'Llamada no encontrada'}
          </p>
          <p className="text-slate-400">
            La llamada que buscas no existe o no tienes acceso a ella.
          </p>
        </div>
      </div>
    )
  }

  const getSentimentColor = () => {
    switch (callData.sentiment) {
      case 'positive': return 'bg-emerald-400'
      case 'negative': return 'bg-red-400'
      default: return 'bg-amber-400'
    }
  }

  const getSentimentLabel = () => {
    switch (callData.sentiment) {
      case 'positive': return 'Positivo'
      case 'negative': return 'Negativo'
      default: return 'Neutral'
    }
  }

  const getOutcomeInfo = () => {
    switch (callData.outcome) {
      case 'appointment':
        return { icon: CheckCircle2, label: 'Cita reservada', color: 'emerald' }
      case 'transfer':
        return { icon: PhoneOutgoing, label: 'Transferida', color: 'amber' }
      default:
        return { icon: MessageSquare, label: 'Consulta atendida', color: 'blue' }
    }
  }

  const outcomeInfo = getOutcomeInfo()
  const OutcomeIcon = outcomeInfo.icon

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
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${outcomeInfo.color}-500/20 border border-${outcomeInfo.color}-500/30`}>
                <OutcomeIcon className={`w-5 h-5 text-${outcomeInfo.color}-400`} />
                <span className={`font-medium text-${outcomeInfo.color}-400`}>{outcomeInfo.label}</span>
              </div>
              
              {/* Sentiment */}
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSentimentColor()}`} />
                  <span className="text-sm text-slate-300">{getSentimentLabel()}</span>
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
        {totalSeconds > 0 && (
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
        )}
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
            {callData.transcript.length > 0 && (
              <button 
                onClick={copyTranscript}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            )}
          </div>
          
          <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
            {callData.transcript.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Transcripción no disponible</p>
              </div>
            ) : (
              callData.transcript.map((message, index) => (
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
              ))
            )}
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
          {callData.tags.length > 0 && (
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
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-medium text-white mb-3">Acciones rápidas</p>
            <div className="space-y-2">
              <a 
                href={`tel:${callData.caller}`}
                className="w-full flex items-center gap-3 p-3 text-left text-sm text-slate-300 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Llamar al cliente
              </a>
              <a 
                href={`https://wa.me/${callData.caller.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3 text-left text-sm text-slate-300 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
