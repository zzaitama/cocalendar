"use client"

import { useState, useEffect, useCallback } from "react"
import { addDays, addMonths, format, isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { USERS } from "@/lib/config"
import { monthRange } from "@/lib/utils"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import type { CalendarEvent } from "@/types"

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MAX_DOTS = 3

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface MonthViewProps {
  initialEvents: CalendarEvent[]
  initialMonthStart: string
}

export function MonthView({ initialEvents }: MonthViewProps) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)

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
    const interval = setInterval(() => fetchNow(monthStart), 60_000)
    return () => clearInterval(interval)
  }, [monthStart, fetchNow])

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const stale = tick - lastFetchedAt > 120_000

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
  const selectedEvents = eventsForDay(selectedDate)
  const selectedDateLabel = format(selectedDate, "EEEE, MMMM d")
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Section 1 — Calendar grid (fixed) */}
        <div className="shrink-0 px-4 pt-2 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrev}
              className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-3xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-xl text-gray-600 dark:text-gray-300">{monthLabel}</p>
              <p className={`text-sm mt-0.5 ${stale ? "text-amber-500" : "text-gray-500 dark:text-gray-600"}`}>
                {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
              </p>
            </div>
            <button
              onClick={goToNext}
              className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-3xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(d => (
              <p key={d} className="text-center text-xs uppercase tracking-widest text-gray-500 py-1">
                {d}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map(day => {
              const dayEvents = eventsForDay(day)
              const inMonth = isSameMonth(day, monthStart)
              const today = isToday(day)
              const selected = isSameDay(day, selectedDate)
              const overflow = dayEvents.length > MAX_DOTS ? dayEvents.length - MAX_DOTS : 0
              const dots = dayEvents.slice(0, MAX_DOTS)

              const circleClass =
                today && selected ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                : selected        ? "bg-indigo-500 text-white"
                : today           ? "ring-2 ring-gray-950 dark:ring-white text-gray-950 dark:text-white"
                :                   "text-gray-600 dark:text-gray-400"

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(startOfDay(day))}
                  className={`flex flex-col items-center py-1 rounded-xl transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                    !inMonth ? "opacity-30" : ""
                  }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-0.5 ${circleClass}`}>
                    {format(day, "d")}
                  </span>
                  <div className="flex gap-0.5 justify-center h-2">
                    {dots.map((e, i) => {
                      const user = USERS.find(u => u.gcalColorId === e.colorId)
                      return (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: user?.color ?? "#64748b" }}
                        />
                      )
                    })}
                    {overflow > 0 && (
                      <span className="text-xs text-gray-600 leading-none">+{overflow}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-800 shrink-0" />

        {/* Section 2 — Event list (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-4">{selectedDateLabel}</p>
          {selectedEvents.length === 0 ? (
            <p className="text-2xl text-gray-500 dark:text-gray-600">Nothing scheduled</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedEvents.map(e => (
                <EventCard
                  key={e.id}
                  event={e}
                  onClick={() => setModal({ mode: "edit", event: e })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddButton onClick={() => setModal({ mode: "create" })} />

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          defaultDate={modal.mode === "create" ? selectedDateStr : undefined}
          onClose={() => setModal(null)}
          onSaved={() => fetchNow(monthStart)}
        />
      )}
    </>
  )
}
