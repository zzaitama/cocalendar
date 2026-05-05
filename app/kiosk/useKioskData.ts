'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CalendarEvent } from '@/types'

export type Chore = {
  id: string
  title: string
  assignee: 'Dad' | 'Mom' | 'Colette' | 'Unassigned'
  completedAt: string | null
  completedWeek: number | null
}

export type KioskData = {
  events: CalendarEvent[]
  chores: Chore[]
  now: Date
  lastFetched: Date | null
  isStale: boolean
  toggleChore: (id: string, completed: boolean) => Promise<void>
}

export function useKioskData(): KioskData {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [now, setNow] = useState<Date>(() => new Date())
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    try {
      const [evRes, chRes] = await Promise.all([
        fetch(`/api/events?start=${todayStart.toISOString()}&end=${todayEnd.toISOString()}`),
        fetch('/api/chores'),
      ])

      if (evRes.ok) {
        const data: unknown = await evRes.json()
        setEvents(Array.isArray(data) ? (data as CalendarEvent[]) : [])
      }

      if (chRes.ok) {
        const data: unknown = await chRes.json()
        setChores(Array.isArray(data) ? (data as Chore[]) : [])
      }

      setLastFetched(new Date())
    } catch {
      // Keep stale data; stale indicator will appear after 5 min
    }
  }, [])

  // 1s clock tick
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  // 60s data poll
  useEffect(() => {
    fetchAll()
    const poll = setInterval(fetchAll, 60_000)
    return () => clearInterval(poll)
  }, [fetchAll])

  // 30-min burn-in pixel shift — imperceptible, prevents static OLED/LCD burn
  useEffect(() => {
    const shift = setInterval(() => {
      const x = Math.floor(Math.random() * 5) - 2
      const y = Math.floor(Math.random() * 5) - 2
      document.body.style.transform = `translate(${x}px, ${y}px)`
    }, 30 * 60 * 1000)
    return () => clearInterval(shift)
  }, [])

  const toggleChore = useCallback(async (id: string, completed: boolean) => {
    // Optimistic update — reconciled on next 60s poll if this fails
    setChores(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, completedAt: completed ? new Date().toISOString() : null }
          : c
      )
    )
    try {
      await fetch(`/api/chores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
    } catch {
      // Silent — next poll will reconcile
    }
  }, [])

  const isStale = lastFetched !== null && now.getTime() - lastFetched.getTime() > 5 * 60 * 1000

  return { events, chores, now, lastFetched, isStale, toggleChore }
}
