"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { addDays, addMonths, format, isSameMonth, isToday, startOfMonth, startOfWeek, startOfDay } from "date-fns"
import { USERS } from "@/lib/config"
import { monthRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MAX_DOTS = 3

interface MonthViewProps {
  initialEvents: CalendarEvent[]
  initialMonthStart: string
}

export function MonthView({ initialEvents, initialMonthStart }: MonthViewProps) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date(initialMonthStart)))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())

  const fetchNow = useCallback(async (anchor: Date) => {
    try {
      const { start, end } = monthRange(anchor)
      const res = await fetch(`/api/events?start=${start}&end=${end}`)
      if (res.status === 401) {
        window.location.href = "/api/auth/signin"
        return
      }
      if (!res.ok) throw new Error("fetch failed")
      const data: CalendarEvent[] = await res.json()
      setEvents(data)
      setLastFetchedAt(Date.now())
    } catch {
      // lastFetchedAt stays stale; indicator appears after 90s
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => fetchNow(monthStart), 30_000)
    return () => clearInterval(interval)
  }, [monthStart, fetchNow])

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const stale = tick - lastFetchedAt > 90_000

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  function eventsForDay(day: Date): CalendarEvent[] {
    const d = startOfDay(day)
    return events.filter(e => {
      if (e.isAllDay) {
        const eStart = startOfDay(new Date(e.start))
        const eEnd = startOfDay(new Date(e.end))
        return d >= eStart && d < eEnd
      }
      return startOfDay(new Date(e.start)).getTime() === d.getTime()
    })
  }

  const goToPrev = () => {
    const prev = addMonths(monthStart, -1)
    setMonthStart(prev)
    fetchNow(prev)
  }

  const goToNext = () => {
    const next = addMonths(monthStart, 1)
    setMonthStart(next)
    fetchNow(next)
  }

  const monthLabel = format(monthStart, "MMMM yyyy")

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-8 py-4 shrink-0">
        <button
          onClick={goToPrev}
          className="w-14 h-14 rounded-xl bg-gray-800 text-white text-3xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-xl text-gray-300">{monthLabel}</p>
          {stale && (
            <p className="text-sm text-gray-600 mt-0.5">Sync paused — check connection</p>
          )}
        </div>
        <button
          onClick={goToNext}
          className="w-14 h-14 rounded-xl bg-gray-800 text-white text-3xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4 flex flex-col">
        <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
          {DAY_HEADERS.map(d => (
            <p key={d} className="text-center text-xs uppercase tracking-widest text-gray-500 py-1">
              {d}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
          {days.map(day => {
            const dayEvents = eventsForDay(day)
            const inMonth = isSameMonth(day, monthStart)
            const today = isToday(day)
            const overflow = dayEvents.length > MAX_DOTS ? dayEvents.length - MAX_DOTS : 0
            const dots = dayEvents.slice(0, MAX_DOTS)

            return (
              <Link
                key={day.toISOString()}
                href={`/?date=${format(day, "yyyy-MM-dd")}`}
                className={`flex flex-col items-center pt-1 pb-2 px-1 rounded-xl min-h-14 transition-colors hover:bg-gray-800 ${
                  !inMonth ? "opacity-30" : ""
                }`}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                    today
                      ? "bg-white text-gray-950"
                      : "text-gray-300"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {dots.map((e, i) => {
                    const user = USERS.find(u => u.gcalColorId === e.colorId)
                    return (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: user?.color ?? "#64748b" }}
                      />
                    )
                  })}
                  {overflow > 0 && (
                    <span className="text-xs text-gray-500 leading-none">+{overflow}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
