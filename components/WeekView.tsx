"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { addDays, isSameDay, startOfDay, isToday, format, isPast, isFuture, startOfWeek } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { PersonFilter } from "@/components/PersonFilter"
import { weekRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

const PERSON_COLORS: Record<string, string> = {
  "1": "#2196F3",
  "2": "#4CAF50",
  "3": "#9C27B0",
  "5": "#FF69B4",
}

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface WeekViewProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

function UpcomingSidebar({ events, now }: { events: CalendarEvent[]; now: Date }) {
  // Get next 3 upcoming timed events from now onwards
  const upcoming = events
    .filter(e => !e.isAllDay && new Date(e.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  // Current event (happening right now)
  const current = events.find(e => !e.isAllDay && new Date(e.start) <= now && now < new Date(e.end))

  const color = (e: CalendarEvent) => PERSON_COLORS[e.colorId] ?? "#64748b"

  function timeLabel(e: CalendarEvent) {
    const start = new Date(e.start)
    const isThisWeek = isSameDay(start, now)
    if (isThisWeek) return format(start, "h:mm a")
    return format(start, "EEE h:mm a")
  }

  function minutesUntil(e: CalendarEvent) {
    const diff = Math.round((new Date(e.start).getTime() - now.getTime()) / 60000)
    if (diff < 60) return `${diff}m`
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-gray-200 dark:border-gray-800 px-4 py-4 gap-4 overflow-y-auto">
      <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 font-semibold">Upcoming</p>

      {/* Now */}
      {current && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Now</p>
          <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: color(current) + "22", borderLeft: `3px solid ${color(current)}` }}>
            <p className="text-gray-950 dark:text-white font-semibold text-sm leading-tight">{current.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(current.start), "h:mm")} – {format(new Date(current.end), "h:mm a")}
            </p>
          </div>
        </div>
      )}

      {/* Next 3 */}
      {upcoming.length === 0 && !current ? (
        <p className="text-gray-400 dark:text-gray-600 text-sm">No more events this week</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.length > 0 && (
            <p className="text-xs text-gray-400 uppercase tracking-wider">Next up</p>
          )}
          {upcoming.map((e, i) => (
            <div key={e.id} className="flex flex-col gap-0.5 group cursor-pointer" onClick={() => {}}>
              <div
                className="rounded-xl p-3 flex flex-col gap-1 transition-opacity"
                style={{ backgroundColor: color(e) + "18", borderLeft: `3px solid ${color(e)}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-950 dark:text-white font-semibold text-sm leading-tight flex-1">{e.title}</p>
                  <span className="text-xs font-mono text-gray-400 shrink-0">{minutesUntil(e)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{timeLabel(e)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini week summary */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">This week</p>
        <p className="text-2xl font-bold text-gray-950 dark:text-white tabular-nums">
          {events.filter(e => !e.isAllDay).length}
        </p>
        <p className="text-xs text-gray-400">events total</p>
      </div>
    </aside>
  )
}

export function WeekView({ initialEvents, initialWeekStart }: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date(initialWeekStart)))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])

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
      // lastFetchedAt stays stale
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

  const stale = tick - lastFetchedAt > 120_000
  const now = new Date(tick)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function eventsForDay(day: Date): CalendarEvent[] {
    const source = selectedPeople.length === 0 ? events : events.filter(e => selectedPeople.includes(e.colorId))
    return source.filter((e) => {
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

  const goToThisWeek = () => {
    const thisWeek = startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setWeekStart(thisWeek)
    fetchNow(thisWeek)
  }

  const isCurrentWeek = isSameDay(weekStart, startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 })))
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Main week grid */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 shrink-0">
            <button
              onClick={goToPrev}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-3xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous week"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-base md:text-xl text-gray-600 dark:text-gray-300">{weekLabel}</p>
              <div className="flex items-center justify-center gap-3 mt-0.5">
                <p className={`text-sm ${stale ? "text-amber-500" : "text-gray-500 dark:text-gray-600"}`}>
                  {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
                </p>
                {!isCurrentWeek && (
                  <button onClick={goToThisWeek} className="text-xs text-blue-500 hover:text-blue-600 font-medium underline underline-offset-2">
                    This week
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={goToNext}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-3xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next week"
            >
              ›
            </button>
          </div>

          <PersonFilter selected={selectedPeople} onChange={setSelectedPeople} />

          <div className="flex-1 overflow-x-auto px-2 md:px-4 pb-24">
            <div className="grid grid-cols-7 gap-1.5 md:gap-2 min-w-[560px]">
              {days.map((day) => {
                const dayEvents = eventsForDay(day)
                const today = isToday(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex flex-col rounded-xl p-2 md:p-3 ${
                      today ? "bg-gray-50 dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700" : ""
                    }`}
                  >
                    <Link
                      href={`/?date=${format(day, "yyyy-MM-dd")}`}
                      className="text-center mb-2 md:mb-3 flex flex-col items-center min-h-12 md:min-h-14 justify-center"
                    >
                      <p className={`text-xs uppercase tracking-widest ${today ? "text-gray-950 dark:text-white" : "text-gray-500"}`}>
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-2xl md:text-3xl font-bold tabular-nums leading-tight ${today ? "text-gray-950 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {format(day, "d")}
                      </p>
                    </Link>
                    <div className="flex flex-col gap-1 md:gap-1.5">
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

        {/* Right sidebar — next 3 events */}
        <UpcomingSidebar events={events} now={now} />
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
