'use client'

import { useState } from 'react'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Phone,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Loader2
} from 'lucide-react'
import { useInsightsData } from '@/lib/hooks/use-dashboard-data'

// AI Insights - could be generated dynamically based on data patterns
const getAiInsights = (data: any) => {
  const insights = []
  
  if (data) {
    if (data.conversionRate > 30) {
      insights.push({
        type: 'positive',
        title: 'Excelente tasa de conversión',
        description: `El ${data.conversionRate}% de las llamadas resultan en acciones positivas. Esto está por encima del promedio.`,
        action: null,
        priority: 'low'
      })
    }
    
    if (data.totalCalls > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Analiza los patrones de llamadas',
        description: 'Revisa las horas pico para optimizar la disponibilidad de tu negocio.',
        action: 'Ver detalles',
        priority: 'medium'
      })
    }
  }

  // Default insights
  if (insights.length < 2) {
    insights.push({
      type: 'improvement',
      title: 'Configura más integraciones',
      description: 'Conecta tu calendario para permitir reservas automáticas durante las llamadas.',
      action: 'Configurar',
      priority: 'high'
    })
  }
  
  insights.push({
    type: 'info',
    title: 'Monitoreo continuo',
    description: 'Tu AI está aprendiendo de cada interacción para mejorar las respuestas.',
    action: null,
    priority: 'low'
  })

  return insights.slice(0, 4)
}

// Top questions - could come from transcript analysis
const topQuestions = [
  { question: '¿Cuáles son sus horarios?', count: 0, percentage: 0 },
  { question: '¿Tienen disponibilidad esta semana?', count: 0, percentage: 0 },
  { question: '¿Cuánto cuesta?', count: 0, percentage: 0 },
  { question: '¿Dónde están ubicados?', count: 0, percentage: 0 },
  { question: '¿Aceptan mi seguro?', count: 0, percentage: 0 },
]

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="w-32 h-5 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="p-5">
        <div className="flex items-end justify-between gap-2 h-48">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full max-w-[40px] bg-white/10 rounded-t-lg animate-pulse"
                style={{ height: `${Math.random() * 100 + 50}px` }}
              />
              <div className="w-6 h-3 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-6 h-6 bg-white/10 rounded" />
        <div className="w-12 h-4 bg-white/10 rounded" />
      </div>
      <div className="w-16 h-8 bg-white/10 rounded mb-1" />
      <div className="w-24 h-4 bg-white/10 rounded" />
    </div>
  )
}

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const { data, loading, error } = useInsightsData()

  const weeklyStats = data?.weeklyStats || []
  const hourlyDistribution = data?.hourlyDistribution || []
  const customerSentiment = data?.customerSentiment || { positive: 0, neutral: 100, negative: 0 }
  
  const maxCalls = Math.max(...weeklyStats.map(d => d.calls), 1)
  const maxHourlyCalls = Math.max(...hourlyDistribution.map(d => d.calls), 1)
  
  const aiInsights = getAiInsights(data)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas</h1>
          <p className="text-slate-400 mt-1">Analiza el rendimiento de tu recepcionista AI</p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <Phone className="w-5 h-5 text-blue-400" />
                {data && data.totalCalls > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Activo
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-white">{data?.totalCalls ?? 0}</p>
              <p className="text-sm text-slate-400">Llamadas totales</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{data?.appointmentsBooked ?? 0}</p>
              <p className="text-sm text-slate-400">Citas reservadas</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{data?.conversionRate ?? 0}%</p>
              <p className="text-sm text-slate-400">Tasa conversión</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white">{data?.avgDuration ?? '0:00'}</p>
              <p className="text-sm text-slate-400">Duración media</p>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Actividad semanal</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-400">Llamadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Citas</span>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {weeklyStats.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  Sin datos disponibles
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-48">
                  {weeklyStats.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-1 items-center">
                        {/* Calls bar */}
                        <div 
                          className="w-full max-w-[40px] bg-blue-500/80 rounded-t-lg transition-all hover:bg-blue-400"
                          style={{ height: `${(day.calls / maxCalls) * 150}px` }}
                        />
                        {/* Appointments bar */}
                        <div 
                          className="w-full max-w-[40px] bg-emerald-500/80 rounded-lg transition-all hover:bg-emerald-400"
                          style={{ height: `${(day.appointments / maxCalls) * 150}px` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{day.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hourly Distribution */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Distribución horaria</h3>
            </div>
            
            <div className="p-5">
              {hourlyDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  Sin datos disponibles
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-1 h-48">
                    {hourlyDistribution.map((hour, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className={`w-full rounded-t-sm transition-all ${
                            hour.calls === maxHourlyCalls 
                              ? 'bg-purple-500' 
                              : 'bg-purple-500/40 hover:bg-purple-500/60'
                          }`}
                          style={{ height: `${(hour.calls / maxHourlyCalls) * 150}px`, minHeight: hour.calls > 0 ? '4px' : '0' }}
                        />
                        <span className="text-xs text-slate-500">{hour.hour}h</span>
                      </div>
                    ))}
                  </div>
                  {maxHourlyCalls > 0 && (
                    <p className="text-center text-sm text-slate-400 mt-4">
                      Hora pico: <span className="text-purple-400 font-medium">
                        {hourlyDistribution.find(h => h.calls === maxHourlyCalls)?.hour || '--'}:00
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Insights de tu AI</h3>
            <p className="text-sm text-slate-400">Recomendaciones basadas en las conversaciones</p>
          </div>
        </div>
        
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => (
            <div 
              key={i}
              className={`p-4 rounded-xl border ${
                insight.type === 'alert' 
                  ? 'bg-red-500/10 border-red-500/20'
                  : insight.type === 'opportunity'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : insight.type === 'positive'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {insight.type === 'alert' && (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                {insight.type === 'opportunity' && (
                  <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                {insight.type === 'positive' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {insight.type === 'improvement' && (
                  <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                )}
                {insight.type === 'info' && (
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{insight.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                  {insight.action && (
                    <button className="flex items-center gap-1 mt-3 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      {insight.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Questions */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/10">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Preguntas más frecuentes</h3>
          </div>
          
          <div className="p-5 space-y-4">
            {topQuestions.map((q, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-300">{q.question}</p>
                  <span className="text-sm font-medium text-white">{q.count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${q.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500 text-center pt-2">
              Análisis de preguntas disponible con más datos
            </p>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/10">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Sentimiento de clientes</h3>
          </div>
          
          <div className="p-5">
            {/* Sentiment donut visualization */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  {/* Positive segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${customerSentiment.positive * 2.51} 251`}
                    strokeLinecap="round"
                  />
                  {/* Neutral segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="12"
                    strokeDasharray={`${customerSentiment.neutral * 2.51} 251`}
                    strokeDashoffset={`-${customerSentiment.positive * 2.51}`}
                    strokeLinecap="round"
                  />
                  {/* Negative segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray={`${customerSentiment.negative * 2.51} 251`}
                    strokeDashoffset={`-${(customerSentiment.positive + customerSentiment.neutral) * 2.51}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-white">{customerSentiment.positive}%</p>
                  <p className="text-xs text-slate-400">Positivo</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{customerSentiment.positive}% Positivo</p>
                    <p className="text-xs text-slate-500">Clientes satisfechos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{customerSentiment.neutral}% Neutral</p>
                    <p className="text-xs text-slate-500">Consultas informativas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{customerSentiment.negative}% Negativo</p>
                    <p className="text-xs text-slate-500">Requieren atención</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
