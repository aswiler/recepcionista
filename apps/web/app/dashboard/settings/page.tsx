'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Settings,
  Building2,
  Phone,
  Bot,
  Calendar,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Clock,
  MessageSquare,
  Volume2,
  Sparkles,
  Loader2,
  XCircle
} from 'lucide-react'

const settingsSections = [
  {
    id: 'business',
    title: 'Negocio',
    description: 'Información de tu empresa',
    icon: Building2,
    color: 'blue',
  },
  {
    id: 'ai',
    title: 'Recepcionista AI',
    description: 'Personalidad, respuestas y comportamiento',
    icon: Bot,
    color: 'purple',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: 'Conecta tu número de WhatsApp Business',
    icon: MessageSquare,
    color: 'green',
  },
  {
    id: 'phone',
    title: 'Teléfono',
    description: 'Número y configuración de llamadas',
    icon: Phone,
    color: 'emerald',
  },
  {
    id: 'calendar',
    title: 'Calendario',
    description: 'Integraciones y disponibilidad',
    icon: Calendar,
    color: 'amber',
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Alertas y resúmenes',
    icon: Bell,
    color: 'pink',
  },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('business')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ajustes</h1>
        <p className="text-slate-400 mt-1">Configura tu recepcionista AI</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeSection === section.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  section.color === 'blue' ? 'bg-blue-500/20' :
                  section.color === 'purple' ? 'bg-purple-500/20' :
                  section.color === 'green' ? 'bg-green-500/20' :
                  section.color === 'emerald' ? 'bg-emerald-500/20' :
                  section.color === 'amber' ? 'bg-amber-500/20' :
                  'bg-pink-500/20'
                }`}>
                  <section.icon className={`w-4 h-4 ${
                    section.color === 'blue' ? 'text-blue-400' :
                    section.color === 'purple' ? 'text-purple-400' :
                    section.color === 'green' ? 'text-green-400' :
                    section.color === 'emerald' ? 'text-emerald-400' :
                    section.color === 'amber' ? 'text-amber-400' :
                    'text-pink-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-xs text-slate-500 truncate">{section.description}</p>
                </div>
              </button>
            ))}
          </nav>

          {/* Plan info */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Plan Pro</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">1.250 minutos restantes este mes</p>
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              <CreditCard className="w-3 h-3" />
              Gestionar suscripción
            </Link>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'business' && <BusinessSettings />}
          {activeSection === 'ai' && <AISettings />}
          {activeSection === 'whatsapp' && <WhatsAppSettings />}
          {activeSection === 'phone' && <PhoneSettings />}
          {activeSection === 'calendar' && <CalendarSettings />}
          {activeSection === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  )
}

function BusinessSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Información del negocio</h3>
          <p className="text-sm text-slate-400 mt-1">Esta información se usa para personalizar tu recepcionista</p>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del negocio
            </label>
            <input
              type="text"
              defaultValue="Clínica Dental García"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sitio web
            </label>
            <input
              type="url"
              defaultValue="https://clinicadentalgarcia.es"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              defaultValue="Calle Gran Vía 45, 28013 Madrid"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Zona horaria
              </label>
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50">
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="Atlantic/Canary">Atlantic/Canary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Idioma
              </label>
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50">
                <option value="es-ES">Español (España)</option>
                <option value="ca">Catalán</option>
                <option value="eu">Euskera</option>
                <option value="gl">Gallego</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-white/5 border-t border-white/10 flex justify-end">
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

function AISettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Personalidad de tu AI</h3>
          <p className="text-sm text-slate-400 mt-1">Define cómo habla y se comporta tu recepcionista</p>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del asistente
            </label>
            <input
              type="text"
              defaultValue="Lucía"
              placeholder="Ej: María, Sofía, etc."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Saludo inicial
            </label>
            <textarea
              rows={2}
              defaultValue="¡Hola! Gracias por llamar a Clínica Dental García. ¿En qué puedo ayudarte?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tono de comunicación
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Formal', 'Cercano', 'Muy cercano'].map((tone, i) => (
                <button
                  key={tone}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    i === 1
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Voz
            </label>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Volume2 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Lucía (España)</p>
                <p className="text-sm text-slate-400">Voz femenina, acento castellano</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-purple-400 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors">
                Cambiar
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-white/5 border-t border-white/10 flex justify-end">
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Knowledge Base */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Base de conocimiento</h3>
          <p className="text-sm text-slate-400 mt-1">Información que tu AI usa para responder</p>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-medium text-white">Conocimiento indexado</p>
                <p className="text-sm text-slate-400">Última actualización: hace 2 días</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors">
              Actualizar
            </button>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-slate-300">Servicios y precios</span>
              <span className="text-xs text-slate-500">12 items</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-slate-300">Preguntas frecuentes</span>
              <span className="text-xs text-slate-500">24 items</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-slate-300">Horarios y ubicación</span>
              <span className="text-xs text-slate-500">3 items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatsAppSettings() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')

  // For MVP: Manual connection
  // Later: Replace with Meta Embedded Signup
  const handleConnect = async () => {
    if (!phoneNumberId.trim()) {
      setError('Introduce el Phone Number ID de Meta')
      return
    }
    
    setIsConnecting(true)
    setError('')
    
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'demo_business', // TODO: Get from session
          phoneNumberId: phoneNumberId.trim(),
          phoneNumber: phoneNumber.trim() || null,
        }),
      })
      
      if (!response.ok) throw new Error('Connection failed')
      
      setIsConnected(true)
    } catch (err) {
      setError('Error al conectar. Verifica tus credenciales.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/connect?businessId=demo_business', {
        method: 'DELETE',
      })
      setIsConnected(false)
      setPhoneNumberId('')
      setPhoneNumber('')
    } catch (err) {
      setError('Error al desconectar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Conexión WhatsApp Business</h3>
          <p className="text-sm text-slate-400 mt-1">Conecta tu número de WhatsApp Business existente</p>
        </div>
        
        <div className="p-5">
          {isConnected ? (
            // Connected state
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-white">{phoneNumber || 'WhatsApp Business'}</p>
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Conectado y recibiendo mensajes
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Desconectar
                </button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-white">Phone Number ID:</span> {phoneNumberId}
                </p>
              </div>
            </div>
          ) : (
            // Not connected state
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                <div className="p-3 rounded-xl bg-slate-500/20">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">No conectado</p>
                  <p className="text-sm text-slate-400">Conecta tu número de WhatsApp Business</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tu número de WhatsApp Business
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+34 612 345 678"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
                <p className="text-xs text-slate-500 mt-1">El número que ya tienes en WhatsApp Business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number ID (de Meta Business)
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="Ej: 123456789012345"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Encuéntralo en Meta Business Suite → WhatsApp → Configuración de API
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Conectar WhatsApp
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">¿Cómo funciona?</h3>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">1</div>
            <div>
              <p className="font-medium text-white">Usa tu número existente</p>
              <p className="text-sm text-slate-400">Tu número de WhatsApp Business se conecta directamente. No necesitas cambiar de número.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">2</div>
            <div>
              <p className="font-medium text-white">AI responde automáticamente</p>
              <p className="text-sm text-slate-400">Cuando un cliente escribe a tu WhatsApp, nuestra AI responde con la información de tu negocio.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">3</div>
            <div>
              <p className="font-medium text-white">Reserva citas y responde FAQs</p>
              <p className="text-sm text-slate-400">La AI puede agendar citas, responder preguntas frecuentes y transferir a ti cuando sea necesario.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide Link */}
      <a
        href="https://business.facebook.com/settings/whatsapp-business-accounts"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white">Obtener Phone Number ID</p>
            <p className="text-sm text-slate-400">Ir a Meta Business Suite</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </a>
    </div>
  )
}

function PhoneSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Número de teléfono</h3>
          <p className="text-sm text-slate-400 mt-1">Tu línea de recepcionista AI</p>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-white">+34 910 123 456</p>
              <p className="text-sm text-emerald-400">Activo · Madrid, España</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Horario de atención</h3>
          <p className="text-sm text-slate-400 mt-1">Cuándo está activa tu recepcionista</p>
        </div>
        
        <div className="p-5 space-y-3">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
            <div key={day} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
              <span className="w-24 text-sm font-medium text-slate-300">{day}</span>
              {i < 5 ? (
                <>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    defaultValue="19:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </>
              ) : i === 5 ? (
                <>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    defaultValue="14:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </>
              ) : (
                <span className="text-sm text-slate-500">Cerrado</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-5 bg-white/5 border-t border-white/10 flex justify-end">
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors">
            Guardar horario
          </button>
        </div>
      </div>
    </div>
  )
}

function CalendarSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Integraciones de calendario</h3>
          <p className="text-sm text-slate-400 mt-1">Conecta tu calendario para gestión automática de citas</p>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Google Calendar */}
          <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Google Calendar</p>
              <p className="text-sm text-emerald-400">Conectado · clinicadentalgarcia@gmail.com</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Outlook */}
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-[#0078D4] flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Outlook Calendar</p>
              <p className="text-sm text-slate-400">No conectado</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors">
              Conectar
            </button>
          </div>
        </div>
      </div>

      <Link
        href="/integrations"
        className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white">Gestionar integraciones</p>
            <p className="text-sm text-slate-400">Conecta más calendarios y CRMs</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </Link>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Notificaciones por email</h3>
          <p className="text-sm text-slate-400 mt-1">Recibe alertas y resúmenes en tu correo</p>
        </div>
        
        <div className="divide-y divide-white/5">
          {[
            { title: 'Resumen diario', description: 'Recibe un resumen de llamadas cada mañana', enabled: true },
            { title: 'Nueva cita reservada', description: 'Notificación cuando la AI reserve una cita', enabled: true },
            { title: 'Llamada transferida', description: 'Cuando una llamada se transfiera a humano', enabled: true },
            { title: 'Llamadas perdidas', description: 'Alerta de llamadas que no se pudieron atender', enabled: false },
            { title: 'Resumen semanal', description: 'Estadísticas y métricas cada lunes', enabled: true },
          ].map((notification, i) => (
            <div key={i} className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-white">{notification.title}</p>
                <p className="text-sm text-slate-400">{notification.description}</p>
              </div>
              <button
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  notification.enabled ? 'bg-blue-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    notification.enabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold text-white">Notificaciones WhatsApp</h3>
          <p className="text-sm text-slate-400 mt-1">Recibe alertas urgentes por WhatsApp</p>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">+34 612 345 678</p>
              <p className="text-sm text-emerald-400">WhatsApp verificado</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
