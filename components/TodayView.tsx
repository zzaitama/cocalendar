"use client"

import { useState, useEffect } from "react"
import { EventCard } from "@/components/EventCard"
import { todayRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

interface TodayViewProps {
  initialEvents: CalendarEvent[]
}

export function TodayView({ initialEvents }: TodayViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const { start, end } = todayRange()
        const res = await fetch(`/api/events?start=${start}&end=${end}`)
        if (!res.ok) throw new Error("fetch failed")
        const data: CalendarEvent[] = await res.json()
        setEvents(data)
        setStale(false)
      } catch {
        setStale(true)
      }
    }

    const interval = setInterval(poll, 30_000)
    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const allDay = events.filter((e) => e.isAllDay)
  const upcoming = events.filter((e) => !e.isAllDay && new Date(e.end) > now)
  const nextUp = upcoming[0] ?? null
  const later = upcoming.slice(1)
  const hasAnything = allDay.length > 0 || upcoming.length > 0

  if (!hasAnything) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-3xl text-gray-500">Nothing today — enjoy the day!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 px-8 pb-32">
      {stale && (
        <p className="text-right text-gray-600 text-sm pt-2">Sync paused — check connection</p>
      )}

      {allDay.length > 0 && (
        <section>
          <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">All Day</p>
          <div className="flex flex-col gap-3">
            {allDay.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {nextUp && (
        <section>
          <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">Next Up</p>
          <EventCard event={nextUp} featured />
        </section>
      )}

      {later.length > 0 && (
        <section>
          <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">Later Today</p>
          <div className="flex flex-col gap-3">
            {later.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
