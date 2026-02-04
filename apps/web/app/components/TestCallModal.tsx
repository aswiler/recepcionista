'use client'

import { useState, useEffect } from 'react'
import { 
  Phone, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  PhoneCall,
  Sparkles
} from 'lucide-react'

interface TestCallModalProps {
  isOpen: boolean
  onClose: () => void
  businessId?: string
  businessName?: string
  defaultPhone?: string
}

type CallStatus = 'idle' | 'checking' | 'ready' | 'calling' | 'success' | 'error'

export default function TestCallModal({ 
  isOpen, 
  onClose, 
  businessId,
  businessName,
  defaultPhone = ''
}: TestCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone)
  const [status, setStatus] = useState<CallStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null)
  
  // Check if test call service is available
  useEffect(() => {
    if (isOpen) {
      checkAvailability()
    }
  }, [isOpen])
  
  const checkAvailability = async () => {
    setStatus('checking')
    try {
      const response = await fetch('/api/voice/test-call')
      const data = await response.json()
      
      setServiceAvailable(data.available)
      if (!data.available) {
        setError(data.message || 'Servicio no disponible')
        setStatus('error')
      } else {
        setStatus('ready')
        setError(null)
      }
    } catch {
      setServiceAvailable(false)
      setError('No se pudo verificar el servicio')
      setStatus('error')
    }
  }
  
  const initiateCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Introduce tu número de teléfono')
      return
    }
    
    setStatus('calling')
    setError(null)
    
    try {
      const response = await fetch('/api/voice/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          businessId,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setStatus('success')
      } else {
        setError(data.error || 'No se pudo iniciar la llamada')
        setStatus('error')
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setStatus('error')
    }
  }
  
  const handleClose = () => {
    setStatus('idle')
    setError(null)
    onClose()
  }
  
  const formatPhoneInput = (value: string) => {
    // Allow digits, +, spaces, and common separators
    const cleaned = value.replace(/[^\d+\s()-]/g, '')
    setPhoneNumber(cleaned)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Llamada de prueba</h2>
              <p className="text-blue-200 text-sm">Habla con tu recepcionista AI</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {status === 'checking' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
              <p className="text-blue-200">Verificando servicio...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="p-4 bg-green-500/20 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                ¡Llamada iniciada!
              </h3>
              <p className="text-blue-200 mb-6">
                Recibirás una llamada en tu teléfono<br />
                <span className="font-medium text-white">{phoneNumber}</span><br />
                en unos segundos.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/10 px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4" />
                <span>Tu AI receptionist te va a llamar</span>
              </div>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
          
          {(status === 'ready' || status === 'error' || status === 'idle') && serviceAvailable !== false && (
            <>
              {businessName && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-blue-300">
                    Tu recepcionista de <span className="font-medium text-white">{businessName}</span> te llamará
                  </p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Tu número de teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => formatPhoneInput(e.target.value)}
                    placeholder="+34 612 345 678"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl
                             text-white placeholder-white/40 focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-lg"
                    disabled={status === 'calling'}
                  />
                </div>
                <p className="mt-2 text-xs text-blue-300/70">
                  Usa formato internacional con código de país (+34 para España)
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
              
              <button
                onClick={initiateCall}
                disabled={status === 'calling' || !phoneNumber.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 
                         bg-green-500 hover:bg-green-600 disabled:bg-green-500/30 
                         disabled:cursor-not-allowed text-white font-semibold rounded-xl 
                         transition-all shadow-lg shadow-green-500/30
                         hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {status === 'calling' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando llamada...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-5 h-5" />
                    Llamar ahora
                  </>
                )}
              </button>
              
              <p className="mt-4 text-center text-xs text-blue-300/60">
                La llamada es gratuita y durará aproximadamente 1-2 minutos
              </p>
            </>
          )}
          
          {serviceAvailable === false && status !== 'checking' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Servicio no disponible
              </h3>
              <p className="text-blue-200 mb-4">
                {error || 'El servicio de llamadas de prueba no está disponible en este momento.'}
              </p>
              <button
                onClick={checkAvailability}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
