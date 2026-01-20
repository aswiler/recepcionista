'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle2, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Connection {
  integration_id: string
  connection_id: string
  created_at: string
  provider: string
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nangoConfigured, setNangoConfigured] = useState(true)
  
  // For demo purposes, use a fixed business ID (in production, get from auth)
  const businessId = 'demo-business-001'
  
  // Check for success callback
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Refresh connections after successful OAuth
      fetchConnections()
    }
  }, [searchParams])
  
  // Fetch existing connections
  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/integrations/calendar?businessId=${businessId}`)
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch (err) {
      console.error('Error fetching connections:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchConnections()
  }, [])
  
  // Connect to a calendar provider
  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId)
    setError(null)
    
    try {
      // Create session token via backend
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, businessId })
      })
      const data = await res.json()
      
      console.log('Nango connect response:', data)
      
      if (!res.ok) {
        if (data.error?.includes('NANGO_SECRET_KEY')) {
          setNangoConfigured(false)
          setError('Nango no está configurado. Añade NANGO_SECRET_KEY a tu archivo .env.local')
        } else {
          setError(data.error || 'Error al conectar')
        }
        setConnecting(null)
        return
      }
      
      // Open Nango Connect popup
      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      console.log('Opening popup:', data.url)
      
      const popup = window.open(
        data.url,
        'nango-connect',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )
      
      if (!popup || popup.closed) {
        setError('El popup fue bloqueado. Por favor permite popups para este sitio.')
        setConnecting(null)
        // Fallback: open in same tab
        if (confirm('¿Quieres abrir la conexión en una nueva pestaña?')) {
          window.open(data.url, '_blank')
        }
        return
      }
      
      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer)
          setConnecting(null)
          // Refresh connections after a short delay
          setTimeout(() => fetchConnections(), 1000)
        }
      }, 500)
      
    } catch (err) {
      setError('Error al conectar con el servicio')
      console.error(err)
      setConnecting(null)
    }
  }
  
  // Disconnect a calendar
  const handleDisconnect = async (integrationId: string, connectionId: string) => {
    if (!confirm('¿Estás seguro de que quieres desconectar este calendario?')) return
    
    try {
      const res = await fetch(`/api/integrations/calendar?integrationId=${integrationId}&connectionId=${connectionId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setConnections(prev => prev.filter(c => c.connection_id !== connectionId))
      }
    } catch (err) {
      console.error('Error disconnecting:', err)
    }
  }
  
  // Check if a provider is connected
  const isConnected = (integrationId: string) => {
    return connections.some(c => c.integration_id === integrationId)
  }
  
  const getConnection = (integrationId: string) => {
    return connections.find(c => c.integration_id === integrationId)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Integraciones</h1>
          <p className="text-blue-200">
            Conecta tus herramientas para que tu recepcionista AI pueda gestionar citas automáticamente
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Setup guide if Nango not configured */}
        {!nangoConfigured && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-yellow-300 mb-2">Configuración requerida</h3>
            <p className="text-yellow-200/80 text-sm mb-3">
              Para habilitar las integraciones, necesitas configurar Nango:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-200 text-sm">
              <li>Crea una cuenta en <a href="https://app.nango.dev" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">app.nango.dev</a></li>
              <li>Ve a Settings → Environment y copia tu Secret Key</li>
              <li>Configura la integración de Google Calendar en el dashboard de Nango</li>
              <li>Añádelo a tu archivo <code className="bg-black/30 px-1 rounded">.env.local</code>:</li>
            </ol>
            <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-green-300 overflow-x-auto">
{`NANGO_SECRET_KEY=tu-secret-key`}
            </pre>
          </div>
        )}

        {/* Calendar Integrations */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Calendarios</h2>
          </div>

          <p className="text-blue-200 text-sm mb-6">
            Conecta tu calendario para que tu recepcionista pueda verificar disponibilidad y agendar citas automáticamente.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Google Calendar */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Google Calendar</h3>
                    <p className="text-sm text-blue-300/70">Sincroniza con tu calendario de Google</p>
                  </div>
                </div>
                {isConnected('google-calendar') && (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>

              {isConnected('google-calendar') ? (
                <div className="flex gap-2">
                  <span className="flex-1 py-2 px-4 bg-green-500/20 text-green-300 rounded-lg text-center text-sm">
                    Conectado
                  </span>
                  <button
                    onClick={() => {
                      const conn = getConnection('google-calendar')
                      if (conn) handleDisconnect('google-calendar', conn.connection_id)
                    }}
                    className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Desconectar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('google-calendar')}
                  disabled={connecting === 'google-calendar'}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connecting === 'google-calendar' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Conectar
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Outlook Calendar */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Outlook Calendar</h3>
                    <p className="text-sm text-blue-300/70">Sincroniza con tu calendario de Outlook</p>
                  </div>
                </div>
                {isConnected('microsoft-calendar') && (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>

              {isConnected('microsoft-calendar') ? (
                <div className="flex gap-2">
                  <span className="flex-1 py-2 px-4 bg-green-500/20 text-green-300 rounded-lg text-center text-sm">
                    Conectado
                  </span>
                  <button
                    onClick={() => {
                      const conn = getConnection('microsoft-calendar')
                      if (conn) handleDisconnect('microsoft-calendar', conn.connection_id)
                    }}
                    className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Desconectar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('microsoft-calendar')}
                  disabled={connecting === 'microsoft-calendar'}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connecting === 'microsoft-calendar' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Conectar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Próximamente</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-white font-medium">HubSpot</p>
              <p className="text-blue-300/70 text-sm">CRM</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-white font-medium">Pipedrive</p>
              <p className="text-blue-300/70 text-sm">CRM</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-white font-medium">Calendly</p>
              <p className="text-blue-300/70 text-sm">Scheduling</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
