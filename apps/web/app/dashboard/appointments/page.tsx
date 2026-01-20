'use client'

import { useState } from 'react'
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Plus,
  Filter
} from 'lucide-react'

// Mock appointments data
const appointments = [
  { id: '1', date: '2024-01-15', time: '09:00', name: 'Pedro García', service: 'Revisión', phone: '+34 612 345 678', bookedBy: 'ai', status: 'confirmed' },
  { id: '2', date: '2024-01-15', time: '10:00', name: 'Ana Martínez', service: 'Limpieza dental', phone: '+34 623 456 789', bookedBy: 'ai', status: 'confirmed' },
  { id: '3', date: '2024-01-15', time: '11:30', name: 'Carlos López', service: 'Blanqueamiento', phone: '+34 634 567 890', bookedBy: 'manual', status: 'confirmed' },
  { id: '4', date: '2024-01-15', time: '16:00', name: 'Laura Fernández', service: 'Ortodoncia consulta', phone: '+34 645 678 901', bookedBy: 'ai', status: 'confirmed' },
  { id: '5', date: '2024-01-16', time: '10:00', name: 'María Gómez', service: 'Empaste', phone: '+34 656 789 012', bookedBy: 'ai', status: 'pending' },
  { id: '6', date: '2024-01-16', time: '12:00', name: 'José Rodríguez', service: 'Extracción', phone: '+34 667 890 123', bookedBy: 'manual', status: 'confirmed' },
  { id: '7', date: '2024-01-17', time: '09:30', name: 'Isabel Sánchez', service: 'Limpieza dental', phone: '+34 678 901 234', bookedBy: 'ai', status: 'confirmed' },
  { id: '8', date: '2024-01-18', time: '11:00', name: 'Roberto Díaz', service: 'Revisión', phone: '+34 689 012 345', bookedBy: 'ai', status: 'confirmed' },
]

const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // Jan 15, 2024
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-15')
  const [view, setView] = useState<'week' | 'month'>('week')

  const goToPrev = () => {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date(2024, 0, 15))
    setSelectedDate('2024-01-15')
  }

  // Get week dates
  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    startOfWeek.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()

  // Get appointments for selected date
  const selectedAppointments = appointments.filter(apt => apt.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  // Count appointments per date
  const getAppointmentCount = (dateStr: string) => {
    return appointments.filter(apt => apt.date === dateStr).length
  }

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const isToday = (date: Date) => {
    const today = new Date(2024, 0, 15) // Mock today
    return formatDateKey(date) === formatDateKey(today)
  }

  const isSelected = (date: Date) => {
    return formatDateKey(date) === selectedDate
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Citas</h1>
          <p className="text-slate-400 mt-1">Gestiona las citas reservadas por tu AI</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors">
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={goToPrev}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={goToNext}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors ml-2"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              view === 'week' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              view === 'month' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid lg:grid-cols-7 gap-3">
        {weekDates.map((date, index) => {
          const dateKey = formatDateKey(date)
          const count = getAppointmentCount(dateKey)
          const selected = isSelected(date)
          const today = isToday(date)
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(dateKey)}
              className={`p-4 rounded-2xl border transition-all ${
                selected 
                  ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <p className="text-sm text-slate-400 mb-1">{daysOfWeek[index]}</p>
              <p className={`text-2xl font-bold ${today ? 'text-blue-400' : 'text-white'}`}>
                {date.getDate()}
              </p>
              {count > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${selected ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs text-slate-400">{count} citas</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Day Appointments */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <p className="text-sm text-slate-400">{selectedAppointments.length} citas programadas</p>
            </div>
          </div>
        </div>
        
        {selectedAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-lg font-medium text-white mb-2">Sin citas</p>
            <p className="text-slate-400">No hay citas programadas para este día</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {selectedAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors">
                {/* Time */}
                <div className="w-16 text-center shrink-0">
                  <p className="text-xl font-bold text-white">{apt.time}</p>
                </div>
                
                {/* Divider */}
                <div className="w-1 h-16 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">{apt.name}</p>
                    {apt.bookedBy === 'ai' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
                        Reservado por AI
                      </span>
                    )}
                    {apt.status === 'pending' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                        Pendiente confirmar
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{apt.service}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {apt.phone}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-3xl font-bold text-white">{appointments.length}</p>
          <p className="text-sm text-slate-400 mt-1">Total esta semana</p>
        </div>
        <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-3xl font-bold text-purple-400">
            {appointments.filter(a => a.bookedBy === 'ai').length}
          </p>
          <p className="text-sm text-slate-400 mt-1">Reservadas por AI</p>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-3xl font-bold text-emerald-400">
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
          <p className="text-sm text-slate-400 mt-1">Confirmadas</p>
        </div>
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-3xl font-bold text-amber-400">
            {appointments.filter(a => a.status === 'pending').length}
          </p>
          <p className="text-sm text-slate-400 mt-1">Pendientes</p>
        </div>
      </div>
    </div>
  )
}
