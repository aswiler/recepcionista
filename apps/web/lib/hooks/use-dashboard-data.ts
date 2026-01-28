'use client'

import { useState, useEffect, useCallback } from 'react'

// Types
export interface DashboardStats {
  totalCalls: number
  callsChange: number
  appointmentsBooked: number
  appointmentsChange: number
  avgCallDuration: string
  durationChange: number
  missedCalls: number
  missedChange: number
}

export interface Call {
  id: string
  caller: string
  callerName: string | null
  time: string
  date?: string
  fullDate?: string
  duration: string
  status: string
  outcome: string
  sentiment: string
  summary: string
}

export interface CallStats {
  total: number
  appointments: number
  info: number
  attention: number
}

export interface BusinessData {
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

export interface InsightsData {
  weeklyStats: Array<{ day: string; calls: number; appointments: number }>
  hourlyDistribution: Array<{ hour: string; calls: number }>
  customerSentiment: { positive: number; neutral: number; negative: number }
  totalCalls: number
  appointmentsBooked: number
  conversionRate: number
  avgDuration: string
}

// Hook for dashboard stats
export function useDashboardStats(range: 'today' | 'week' | 'month' = 'week') {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/stats?range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook for calls list
export function useCalls(options: {
  recent?: boolean
  limit?: number
  filter?: string
} = {}) {
  const [calls, setCalls] = useState<Call[]>([])
  const [stats, setStats] = useState<CallStats>({ total: 0, appointments: 0, info: 0, attention: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options.recent) params.set('recent', 'true')
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.filter && options.filter !== 'all') params.set('filter', options.filter)
      
      const res = await fetch(`/api/dashboard/calls?${params}`)
      if (!res.ok) throw new Error('Failed to fetch calls')
      const data = await res.json()
      setCalls(data.calls || [])
      if (data.stats) setStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [options.recent, options.limit, options.filter])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  return { calls, stats, loading, error, refetch: fetchCalls }
}

// Hook for business data
export function useBusinessData() {
  const [data, setData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/business')
      if (!res.ok) throw new Error('Failed to fetch business')
      const businessData = await res.json()
      setData(businessData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBusiness()
  }, [fetchBusiness])

  return { data, loading, error, refetch: fetchBusiness }
}

// Hook for insights data
export function useInsightsData() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/insights')
      if (!res.ok) throw new Error('Failed to fetch insights')
      const insightsData = await res.json()
      setData(insightsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return { data, loading, error, refetch: fetchInsights }
}
