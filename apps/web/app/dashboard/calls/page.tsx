'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  Search,
  Filter,
  Calendar,
  Clock,
  ChevronRight,
  PhoneOutgoing,
  PhoneIncoming,
  MessageSquare,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

// Mock data
const allCalls = [
  {
    id: '1',
    caller: '+34 612 345 678',
    callerName: 'Ana Martínez',
    time: '14:32',
    date: 'Hoy',
    fullDate: '2024-01-15',
    duration: '3:24',
    status: 'completed',
    outcome: 'appointment',
    sentiment: 'positive',
    summary: 'Reservó cita para limpieza dental el martes a las 10:00. Preguntó por el precio y confirmó que tiene seguro Sanitas.',
  },
  {
    id: '2',
    caller: '+34 623 456 789',
    callerName: null,
    time: '14:09',
    date: 'Hoy',
    fullDate: '2024-01-15',
    duration: '1:45',
    status: 'completed',
    outcome: 'info',
    sentiment: 'neutral',
    summary: 'Preguntó por horarios y precios de blanqueamiento. No reservó pero dijo que llamaría la próxima semana.',
  },
  {
    id: '3',
    caller: '+34 634 567 890',
    callerName: 'Carlos López',
    time: '13:21',
    date: 'Hoy',
    fullDate: '2024-01-15',
    duration: '0:45',
    status: 'transferred',
    outcome: 'transfer',
    sentiment: 'urgent',
    summary: 'Urgencia dental - dolor intenso. Transferido al Dr. García inmediatamente.',
  },
  {
    id: '4',
    caller: '+34 645 678 901',
    callerName: 'Laura Fernández',
    time: '11:15',
    date: 'Hoy',
    fullDate: '2024-01-15',
    duration: '2:12',
    status: 'completed',
    outcome: 'appointment',
    sentiment: 'positive',
    summary: 'Reservó revisión para su hijo de 8 años. Primera visita, preguntó por especialista infantil.',
  },
  {
    id: '5',
    caller: '+34 656 789 012',
    callerName: null,
    time: '10:03',
    date: 'Hoy',
    fullDate: '2024-01-15',
    duration: '0:32',
    status: 'missed',
    outcome: 'missed',
    sentiment: 'unknown',
    summary: 'Llamada perdida - el cliente colgó antes de conectar con el AI.',
  },
  {
    id: '6',
    caller: '+34 667 890 123',
    callerName: 'Pedro Sánchez',
    time: '18:45',
    date: 'Ayer',
    fullDate: '2024-01-14',
    duration: '4:12',
    status: 'completed',
    outcome: 'appointment',
    sentiment: 'positive',
    summary: 'Reservó cita para ortodoncia. Interesado en Invisalign, se le envió información por WhatsApp.',
  },
  {
    id: '7',
    caller: '+34 678 901 234',
    callerName: 'María Gómez',
    time: '16:30',
    date: 'Ayer',
    fullDate: '2024-01-14',
    duration: '1:55',
    status: 'completed',
    outcome: 'info',
    sentiment: 'neutral',
    summary: 'Consulta sobre tratamiento de conducto. Pidió presupuesto que se enviará por email.',
  },
]

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'appointment', label: 'Con cita' },
  { id: 'info', label: 'Consultas' },
  { id: 'transfer', label: 'Transferidas' },
  { id: 'missed', label: 'Perdidas' },
]

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter calls
  const filteredCalls = allCalls.filter(call => {
    const matchesSearch = 
      call.caller.includes(searchQuery) ||
      call.callerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.summary.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = activeFilter === 'all' || call.outcome === activeFilter
    
    return matchesSearch && matchesFilter
  })

  // Group calls by date
  const groupedCalls = filteredCalls.reduce((groups, call) => {
    const date = call.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(call)
    return groups
  }, {} as Record<string, typeof allCalls>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Llamadas</h1>
          <p className="text-slate-400 mt-1">Historial completo de llamadas atendidas por tu AI</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por teléfono, nombre o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
        </div>
        
        {/* Filter toggle (mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300"
        >
          <Filter className="w-5 h-5" />
          Filtros
        </button>
        
        {/* Filters (desktop) */}
        <div className="hidden sm:flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeFilter === filter.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile filters */}
      {showFilters && (
        <div className="sm:hidden flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeFilter === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{allCalls.length}</p>
          <p className="text-sm text-slate-400">Total llamadas</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">
            {allCalls.filter(c => c.outcome === 'appointment').length}
          </p>
          <p className="text-sm text-slate-400">Citas reservadas</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">
            {allCalls.filter(c => c.outcome === 'info').length}
          </p>
          <p className="text-sm text-slate-400">Consultas</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400">
            {allCalls.filter(c => c.outcome === 'missed' || c.outcome === 'transfer').length}
          </p>
          <p className="text-sm text-slate-400">Requieren atención</p>
        </div>
      </div>

      {/* Calls List */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        {Object.entries(groupedCalls).length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Phone className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-lg font-medium text-white mb-2">No hay llamadas</p>
            <p className="text-slate-400">No se encontraron llamadas con estos filtros</p>
          </div>
        ) : (
          Object.entries(groupedCalls).map(([date, calls]) => (
            <div key={date}>
              {/* Date header */}
              <div className="px-5 py-3 bg-white/5 border-b border-white/10">
                <p className="text-sm font-medium text-slate-400">{date}</p>
              </div>
              
              {/* Calls */}
              <div className="divide-y divide-white/5">
                {calls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/dashboard/calls/${call.id}`}
                    className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
                  >
                    {/* Status icon */}
                    <div className={`p-3 rounded-xl shrink-0 ${
                      call.outcome === 'appointment' 
                        ? 'bg-emerald-500/20' 
                        : call.outcome === 'transfer'
                        ? 'bg-amber-500/20'
                        : call.outcome === 'missed'
                        ? 'bg-red-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      {call.outcome === 'appointment' ? (
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      ) : call.outcome === 'transfer' ? (
                        <PhoneOutgoing className="w-5 h-5 text-amber-400" />
                      ) : call.outcome === 'missed' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    
                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-white">
                          {call.callerName || call.caller}
                        </p>
                        
                        {/* Outcome badge */}
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
                        {call.outcome === 'missed' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                            Perdida
                          </span>
                        )}
                        
                        {/* Sentiment indicator */}
                        {call.sentiment === 'positive' && (
                          <span className="w-2 h-2 bg-emerald-400 rounded-full" title="Sentimiento positivo" />
                        )}
                        {call.sentiment === 'urgent' && (
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Urgente" />
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-400 line-clamp-1">{call.summary}</p>
                    </div>
                    
                    {/* Meta */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm text-white">{call.time}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {call.duration}
                      </div>
                    </div>
                    
                    {/* Play button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        // Play audio
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Play className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
