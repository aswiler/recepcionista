'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react'

// Mock data - in production, fetch from API
const stats = {
  totalCalls: 127,
  callsChange: 12,
  appointmentsBooked: 34,
  appointmentsChange: 8,
  avgCallDuration: '2:34',
  durationChange: -15,
  missedCalls: 3,
  missedChange: -2,
}

const recentCalls = [
  {
    id: '1',
    caller: '+34 612 345 678',
    callerName: 'Ana Martínez',
    time: 'Hace 5 min',
    duration: '3:24',
    status: 'completed',
    outcome: 'appointment',
    summary: 'Reservó cita para limpieza dental el martes a las 10:00',
  },
  {
    id: '2',
    caller: '+34 623 456 789',
    callerName: null,
    time: 'Hace 23 min',
    duration: '1:45',
    status: 'completed',
    outcome: 'info',
    summary: 'Preguntó por horarios y precios de blanqueamiento',
  },
  {
    id: '3',
    caller: '+34 634 567 890',
    callerName: 'Carlos López',
    time: 'Hace 1 hora',
    duration: '0:45',
    status: 'transferred',
    outcome: 'transfer',
    summary: 'Solicitó hablar con el doctor sobre urgencia',
  },
  {
    id: '4',
    caller: '+34 645 678 901',
    callerName: null,
    time: 'Hace 2 horas',
    duration: '2:12',
    status: 'completed',
    outcome: 'appointment',
    summary: 'Reservó revisión para su hijo el viernes',
  },
]

const upcomingAppointments = [
  { time: '10:00', name: 'Ana Martínez', service: 'Limpieza dental', date: 'Mañana' },
  { time: '11:30', name: 'Pedro Sánchez', service: 'Revisión', date: 'Mañana' },
  { time: '16:00', name: 'Laura Fernández', service: 'Blanqueamiento', date: 'Miércoles' },
]

const insights = [
  { text: 'El 40% de las llamadas preguntan por blanqueamiento', type: 'trending' },
  { text: '3 clientes mencionaron problemas de parking', type: 'attention' },
  { text: 'Horario más popular: 10:00-12:00', type: 'info' },
]

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  return (
    <div className="space-y-8">
      {/* Welcome & Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">¡Buenos días, María! 👋</h1>
          <p className="text-slate-400 mt-1">Tu recepcionista AI está activa y atendiendo llamadas</p>
        </div>
        
        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.callsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.callsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.callsChange)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalCalls}</p>
          <p className="text-sm text-slate-400 mt-1">Llamadas atendidas</p>
        </div>

        {/* Appointments Booked */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.appointmentsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.appointmentsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.appointmentsChange)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.appointmentsBooked}</p>
          <p className="text-sm text-slate-400 mt-1">Citas reservadas</p>
        </div>

        {/* Avg Duration */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/20">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.durationChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stats.durationChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(stats.durationChange)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgCallDuration}</p>
          <p className="text-sm text-slate-400 mt-1">Duración media</p>
        </div>

        {/* Missed Calls */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <PhoneMissed className="w-5 h-5 text-amber-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.missedChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.missedChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(stats.missedChange)}
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.missedCalls}</p>
          <p className="text-sm text-slate-400 mt-1">Llamadas perdidas</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Calls - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Phone className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Llamadas recientes</h3>
            </div>
            <Link 
              href="/dashboard/calls"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {recentCalls.map((call) => (
              <Link
                key={call.id}
                href={`/dashboard/calls/${call.id}`}
                className="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors"
              >
                {/* Status indicator */}
                <div className={`p-2.5 rounded-xl ${
                  call.outcome === 'appointment' 
                    ? 'bg-emerald-500/20' 
                    : call.outcome === 'transfer'
                    ? 'bg-amber-500/20'
                    : 'bg-blue-500/20'
                }`}>
                  {call.outcome === 'appointment' ? (
                    <Calendar className={`w-5 h-5 ${call.outcome === 'appointment' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  ) : call.outcome === 'transfer' ? (
                    <PhoneOutgoing className="w-5 h-5 text-amber-400" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                
                {/* Call info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">
                      {call.callerName || call.caller}
                    </p>
                    {call.outcome === 'appointment' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                        Cita reservada
                      </span>
                    )}
                    {call.outcome === 'transfer' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                        Transferida
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{call.summary}</p>
                </div>
                
                {/* Time & Duration */}
                <div className="text-right shrink-0">
                  <p className="text-sm text-slate-400">{call.time}</p>
                  <p className="text-xs text-slate-500 mt-1">{call.duration}</p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Próximas citas</h3>
              </div>
              <Link 
                href="/dashboard/appointments"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver todas
              </Link>
            </div>
            
            <div className="divide-y divide-white/5">
              {upcomingAppointments.map((apt, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-lg font-bold text-white">{apt.time}</p>
                    <p className="text-xs text-slate-500">{apt.date}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{apt.name}</p>
                    <p className="text-xs text-slate-400">{apt.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Insights de tu AI</h3>
            </div>
            
            <div className="p-4 space-y-3">
              {insights.map((insight, i) => (
                <div 
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    insight.type === 'attention' 
                      ? 'bg-amber-500/10 border border-amber-500/20' 
                      : 'bg-white/5'
                  }`}
                >
                  {insight.type === 'trending' && (
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {insight.type === 'attention' && (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  {insight.type === 'info' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm text-slate-300">{insight.text}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 pt-0">
              <Link
                href="/dashboard/insights"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-purple-400 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-colors"
              >
                Ver todos los insights
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <p className="font-medium text-white">Tu recepcionista está activa</p>
            <p className="text-sm text-slate-400">Atendiendo llamadas al +34 910 123 456</p>
          </div>
        </div>
        <Link
          href="/dashboard/settings"
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configurar
        </Link>
      </div>
    </div>
  )
}

function Settings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
