"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { addDays, isSameDay, startOfDay, isToday, format } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { weekRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface WeekViewProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

export function WeekView({ initialEvents, initialWeekStart }: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date(initialWeekStart)))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)

  const fetchNow = useCallback(async (anchor: Date) => {
    try {
      const { start, end } = weekRange(anchor)
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
    const interval = setInterval(() => fetchNow(weekStart), 30_000)
    return () => clearInterval(interval)
  }, [weekStart, fetchNow])

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const stale = tick - lastFetchedAt > 90_000

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
    fetchNow(prev)
  }

  const goToNext = () => {
    const next = addDays(weekStart, 7)
    setWeekStart(next)
    fetchNow(next)
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`

  return (
    <>
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
                  <Link
                    href={`/?date=${format(day, "yyyy-MM-dd")}`}
                    className="text-center mb-3 flex flex-col items-center min-h-14 justify-center"
                  >
                    <p
                      className={`text-sm uppercase tracking-widest ${
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
                  </Link>
                  <div className="flex flex-col gap-1.5">
                    {dayEvents.map((e) => (
                      <EventCard
                        key={e.id}
                        event={e}
                        compact
                        onClick={() => setModal({ mode: "edit", event: e })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AddButton onClick={() => setModal({ mode: "create" })} />

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          onClose={() => setModal(null)}
          onSaved={() => fetchNow(weekStart)}
        />
      )}
    </>
  )
}
