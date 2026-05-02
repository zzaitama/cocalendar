"use client"

import { useState, useEffect, useCallback } from "react"
import { addDays, isSameDay, startOfDay, isToday, format } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { weekRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

interface WeekViewProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

export function WeekView({ initialEvents, initialWeekStart }: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date(initialWeekStart)))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [stale, setStale] = useState(false)

  const fetchEvents = useCallback(async (anchor: Date) => {
    try {
      const { start, end } = weekRange(anchor)
      const res = await fetch(`/api/events?start=${start}&end=${end}`)
      if (!res.ok) throw new Error("fetch failed")
      const data: CalendarEvent[] = await res.json()
      setEvents(data)
      setStale(false)
    } catch {
      setStale(true)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => fetchEvents(weekStart), 30_000)
    return () => clearInterval(interval)
  }, [weekStart, fetchEvents])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function eventsForDay(day: Date): CalendarEvent[] {
    return events.filter((e) => {
      if (e.isAllDay) {
        const eStart = startOfDay(new Date(e.start))
        const eEnd = startOfDay(new Date(e.end))
        const d = startOfDay(day)
        return d >= eStart && d < eEnd
      }
      return isSameDay(new Date(e.start), day)
    })
  }

  const goToPrev = () => {
    const prev = addDays(weekStart, -7)
    setWeekStart(prev)
    fetchEvents(prev)
  }

  const goToNext = () => {
    const next = addDays(weekStart, 7)
    setWeekStart(next)
    fetchEvents(next)
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-8 py-4">
        <button
          onClick={goToPrev}
          className="w-14 h-14 rounded-xl bg-gray-800 text-white text-3xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-xl text-gray-300">{weekLabel}</p>
          {stale && (
            <p className="text-sm text-gray-600 mt-0.5">Sync paused — check connection</p>
          )}
        </div>
        <button
          onClick={goToNext}
          className="w-14 h-14 rounded-xl bg-gray-800 text-white text-3xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="flex-1 overflow-x-auto px-4 pb-24">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col rounded-xl p-3 ${
                  today ? "bg-gray-900 ring-1 ring-gray-700" : ""
                }`}
              >
                <div className="text-center mb-3">
                  <p
                    className={`text-xs uppercase tracking-widest ${
                      today ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-3xl font-bold tabular-nums leading-tight ${
                      today ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {dayEvents.map((e) => (
                    <EventCard key={e.id} event={e} compact />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
