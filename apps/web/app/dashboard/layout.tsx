'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Phone, 
  Calendar, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  Loader2
} from 'lucide-react'

const navigation = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Llamadas', href: '/dashboard/calls', icon: Phone },
  { name: 'Citas', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Estadísticas', href: '/dashboard/insights', icon: BarChart3 },
  { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
]

interface BusinessData {
  business: {
    id: string
    name: string
    website: string | null
    phone: string | null
    timezone: string | null
    whatsappConnected: boolean
    whatsappPhoneNumber: string | null
  } | null
  subscription: {
    plan: string
    status: string
  } | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  // Fetch business data
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch('/api/dashboard/business')
        if (res.ok) {
          const data = await res.json()
          setBusinessData(data)
        }
      } catch (error) {
        console.error('Error fetching business:', error)
      } finally {
        setLoadingBusiness(false)
      }
    }

    if (session?.user) {
      fetchBusiness()
    } else {
      setLoadingBusiness(false)
    }
  }, [session?.user])

  // Get user data from session
  const user = session?.user
  
  // Get business info
  const businessName = businessData?.business?.name || 'Mi Negocio'
  const plan = businessData?.subscription?.plan || 'starter'
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : 'Starter'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo & Business */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">Recepcionista</h1>
              <p className="text-xs text-blue-400">.com</p>
            </div>
          </Link>
          
          {/* Business selector */}
          <button className="mt-6 w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              {loadingBusiness ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-sm text-slate-400">Cargando...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-white truncate">{businessName}</p>
                  <p className="text-xs text-slate-400">Plan {planLabel}</p>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <p className="text-sm font-medium text-white mb-1">¿Necesitas ayuda?</p>
            <p className="text-xs text-slate-400 mb-3">Nuestro equipo está aquí para ti</p>
            <button className="w-full py-2 px-3 text-sm font-medium text-blue-400 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors">
              Contactar soporte
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title - shown on desktop */}
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-white">
                {navigation.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.name || 'Panel'}
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 py-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user?.name || 'Usuario'}</p>
                        <p className="text-xs text-slate-400">{user?.email || ''}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Ajustes
                        </Link>
                        <button 
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
