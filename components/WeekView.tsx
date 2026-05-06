"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { addDays, isSameDay, startOfDay, isToday, format, startOfWeek, differenceInMinutes } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { PersonFilter } from "@/components/PersonFilter"
import { USERS } from "@/lib/config"
import { weekRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface WeekViewProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

// ── Constants ────────────────────────────────────────────────
const START_HOUR = 6
const END_HOUR = 23
const PX_PER_HOUR = 56
const PX_PER_MIN = PX_PER_HOUR / 60
const TIME_GUTTER = 52 // px width of left time axis

function topPx(ev: CalendarEvent): number {
  const d = new Date(ev.start)
  return Math.max(0, ((d.getHours() - START_HOUR) * 60 + d.getMinutes()) * PX_PER_MIN)
}

function heightPx(ev: CalendarEvent): number {
  return Math.max(22, differenceInMinutes(new Date(ev.end), new Date(ev.start)) * PX_PER_MIN)
}

function nowTopPx(): number {
  const n = new Date()
  return ((n.getHours() - START_HOUR) * 60 + n.getMinutes()) * PX_PER_MIN
}

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return "12 AM"
  if (h === 12) return "12 PM"
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function userColor(colorId: string): string {
  return USERS.find(u => u.gcalColorId === colorId)?.color ?? "#64748b"
}

// ── Desktop time-grid week view ──────────────────────────────
function DesktopTimeGrid({
  days,
  events,
  now,
  isCurrentWeek,
  onEventClick,
  onCreateAt,
}: {
  days: Date[]
  events: CalendarEvent[]
  now: Date
  isCurrentWeek: boolean
  onEventClick: (e: CalendarEvent) => void
  onCreateAt: (day: Date, hour: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to ~current time or 8am on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const target = isCurrentWeek ? Math.max(0, nowTopPx() - 120) : (8 - START_HOUR) * PX_PER_HOUR
    scrollRef.current.scrollTop = target
  }, [isCurrentWeek])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const gridH = (END_HOUR - START_HOUR + 1) * PX_PER_HOUR
  const showNow = isCurrentWeek && now.getHours() >= START_HOUR && now.getHours() <= END_HOUR
  const nowTop = nowTopPx()

  // Separate all-day from timed events per day
  function timedForDay(day: Date) {
    return events.filter(e => !e.isAllDay && isSameDay(new Date(e.start), day))
  }
  function allDayForDay(day: Date) {
    return events.filter(e => {
      if (!e.isAllDay) return false
      return startOfDay(day) >= startOfDay(new Date(e.start)) &&
             startOfDay(day) < startOfDay(new Date(e.end))
    })
  }

  const hasAllDay = days.some(d => allDayForDay(d).length > 0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Day header row ── */}
      <div className="flex shrink-0 border-b border-gray-200 dark:border-gray-800">
        {/* Gutter placeholder */}
        <div style={{ width: TIME_GUTTER }} className="shrink-0" />
        {days.map(day => {
          const today = isToday(day)
          return (
            <div key={day.toISOString()} className="flex-1 flex flex-col items-center py-2 border-l border-gray-200 dark:border-gray-800">
              <p className={`text-xs uppercase tracking-widest font-medium ${today ? "text-gray-950 dark:text-white" : "text-gray-400"}`}>
                {format(day, "EEE")}
              </p>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${today ? "bg-gray-950 dark:bg-white" : ""}`}>
                <p className={`text-xl font-bold tabular-nums ${today ? "text-white dark:text-gray-950" : "text-gray-500 dark:text-gray-400"}`}>
                  {format(day, "d")}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── All-day row ── */}
      {hasAllDay && (
        <div className="flex shrink-0 border-b border-gray-200 dark:border-gray-800 min-h-[32px]">
          <div style={{ width: TIME_GUTTER }} className="shrink-0 flex items-center justify-end pr-2">
            <span className="text-xs text-gray-400 dark:text-gray-600">all-day</span>
          </div>
          {days.map(day => {
            const dayAllDay = allDayForDay(day)
            return (
              <div key={day.toISOString()} className="flex-1 border-l border-gray-200 dark:border-gray-800 px-0.5 py-0.5 flex flex-col gap-0.5">
                {dayAllDay.map(e => {
                  const c = userColor(e.colorId)
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEventClick(e)}
                      className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate text-white"
                      style={{ backgroundColor: c }}
                    >
                      {e.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Scrollable time grid ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridH }}>

          {/* Time axis */}
          <div style={{ width: TIME_GUTTER }} className="shrink-0 relative select-none">
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-0 flex items-start"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              >
                <span className="text-xs text-gray-400 dark:text-gray-600 tabular-nums pr-2 -mt-2 text-right leading-none">
                  {hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1 relative">
            {days.map(day => {
              const dayTimed = timedForDay(day)
              const today = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 relative border-l border-gray-200 dark:border-gray-800 ${today ? "bg-blue-50/30 dark:bg-white/[0.02]" : ""}`}
                >
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                    >
                      <div className="border-t border-gray-100 dark:border-gray-800/80" />
                      {/* Half-hour line */}
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800/40"
                        style={{ top: PX_PER_HOUR / 2 }}
                      />
                    </div>
                  ))}

                  {/* Click-to-create zones */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
                      style={{ top: (h - START_HOUR) * PX_PER_HOUR, height: PX_PER_HOUR }}
                      onClick={() => onCreateAt(day, h)}
                    />
                  ))}

                  {/* Events */}
                  {dayTimed.map(e => {
                    const top = topPx(e)
                    const height = heightPx(e)
                    const c = userColor(e.colorId)
                    const short = height < 36
                    return (
                      <button
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                        className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden text-left z-10 shadow-sm hover:brightness-95 active:brightness-90 transition-all"
                        style={{
                          top,
                          height,
                          backgroundColor: c + "dd",
                          borderLeft: `3px solid ${c}`,
                        }}
                      >
                        <div className="px-1.5 py-0.5 min-w-0 h-full flex flex-col justify-start">
                          <p className={`text-white font-semibold leading-tight truncate ${short ? "text-xs" : "text-xs"}`}>
                            {e.title}
                          </p>
                          {!short && (
                            <p className="text-white/75 text-xs leading-tight truncate">
                              {format(new Date(e.start), "h:mm")}–{format(new Date(e.end), "h:mm a")}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}

            {/* Now indicator spanning all columns */}
            {showNow && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 -ml-1.5" />
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar: upcoming events ─────────────────────────────────
function UpcomingSidebar({ events, now }: { events: CalendarEvent[]; now: Date }) {
  const upcoming = events
    .filter(e => !e.isAllDay && new Date(e.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  const current = events.find(e => !e.isAllDay && new Date(e.start) <= now && now < new Date(e.end))

  function color(e: CalendarEvent) {
    return USERS.find(u => u.gcalColorId === e.colorId)?.color ?? "#64748b"
  }

  function countdown(e: CalendarEvent) {
    const diff = Math.round((new Date(e.start).getTime() - now.getTime()) / 60000)
    if (diff < 60) return `${diff}m`
    const h = Math.floor(diff / 60), m = diff % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-l border-gray-200 dark:border-gray-800 px-4 py-4 gap-4 overflow-y-auto">
      <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 font-semibold">Upcoming</p>

      {current && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Now</p>
          <div className="rounded-xl p-3" style={{ backgroundColor: color(current) + "22", borderLeft: `3px solid ${color(current)}` }}>
            <p className="text-gray-950 dark:text-white font-semibold text-sm leading-tight">{current.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{format(new Date(current.start), "h:mm")} – {format(new Date(current.end), "h:mm a")}</p>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Next up</p>
          {upcoming.map(e => (
            <div key={e.id} className="rounded-xl p-3" style={{ backgroundColor: color(e) + "18", borderLeft: `3px solid ${color(e)}` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-950 dark:text-white font-semibold text-sm leading-tight flex-1">{e.title}</p>
                <span className="text-xs font-mono text-gray-400 shrink-0">{countdown(e)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isSameDay(new Date(e.start), now) ? format(new Date(e.start), "h:mm a") : format(new Date(e.start), "EEE h:mm a")}
              </p>
            </div>
          ))}
        </div>
      )}

      {!current && upcoming.length === 0 && (
        <p className="text-gray-400 dark:text-gray-600 text-sm">No more events this week</p>
      )}

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">This week</p>
        <p className="text-2xl font-bold text-gray-950 dark:text-white tabular-nums">{events.filter(e => !e.isAllDay).length}</p>
        <p className="text-xs text-gray-400">events total</p>
      </div>
    </aside>
  )
}

// ── Mobile grid (unchanged) ──────────────────────────────────
function MobileWeekGrid({
  days, events, selectedDay, onSelectDay, onEditEvent, selectedPeople
}: {
  days: Date[]
  events: CalendarEvent[]
  selectedDay: Date
  onSelectDay: (d: Date) => void
  onEditEvent: (e: CalendarEvent) => void
  selectedPeople: string[]
}) {
  function eventsForDay(day: Date) {
    const source = selectedPeople.length === 0 ? events : events.filter(e => selectedPeople.includes(e.colorId))
    return source.filter(e => {
      if (e.isAllDay) {
        return startOfDay(day) >= startOfDay(new Date(e.start)) && startOfDay(day) < startOfDay(new Date(e.end))
      }
      return isSameDay(new Date(e.start), day)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const selectedEvents = eventsForDay(selectedDay)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="grid grid-cols-7 px-2 pt-1 pb-0.5">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <p key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 px-2 gap-y-1">
        {days.map(day => {
          const dayEvents = eventsForDay(day)
          const today = isToday(day)
          const selected = isSameDay(day, selectedDay)
          const pills = dayEvents.slice(0, 3)
          const overflow = dayEvents.length - 3

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-center py-1 rounded-xl transition-colors ${selected ? "bg-gray-100 dark:bg-gray-800" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-0.5 ${today ? "bg-gray-950 dark:bg-white" : ""}`}>
                <span className={`text-sm font-semibold tabular-nums ${today ? "text-white dark:text-gray-950" : selected ? "text-gray-950 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 w-full px-0.5">
                {pills.map(e => {
                  const c = USERS.find(u => u.gcalColorId === e.colorId)?.color ?? "#64748b"
                  return (
                    <div key={e.id} className="rounded-sm px-1 py-px flex items-center gap-0.5 overflow-hidden" style={{ backgroundColor: c + "33" }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                      <span className="text-xs leading-none truncate text-gray-800 dark:text-gray-200" style={{ fontSize: "9px" }}>
                        {e.isAllDay ? e.title : `${format(new Date(e.start), "h:mm")} ${e.title}`}
                      </span>
                    </div>
                  )
                })}
                {overflow > 0 && (
                  <span className="text-center text-gray-400" style={{ fontSize: "9px" }}>+{overflow}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800 mt-2">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <p className="text-gray-950 dark:text-white font-semibold text-base">
            {isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, MMMM d")}
          </p>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-base px-4 py-4">Nothing scheduled</p>
        ) : (
          <div className="flex flex-col gap-2 px-4 pb-24">
            {selectedEvents.map(e => (
              <EventCard key={e.id} event={e} onClick={() => onEditEvent(e)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main WeekView ─────────────────────────────────────────────
export function WeekView({ initialEvents, initialWeekStart }: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date(initialWeekStart)))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const ws = startOfDay(new Date(initialWeekStart))
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
    return days.find(d => isToday(d)) ?? ws
  })

  const fetchNow = useCallback(async (anchor: Date) => {
    try {
      const { start, end } = weekRange(anchor)
      const res = await fetch(`/api/events?start=${start}&end=${end}`)
      if (res.status === 401) { window.location.href = "/api/auth/signin"; return }
      if (!res.ok) throw new Error()
      setEvents(await res.json())
      setLastFetchedAt(Date.now())
    } catch {}
  }, [])

  useEffect(() => {
    const i = setInterval(() => fetchNow(weekStart), 30_000)
    return () => clearInterval(i)
  }, [weekStart, fetchNow])

  useEffect(() => {
    const i = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(i)
  }, [])

  const stale = tick - lastFetchedAt > 120_000
  const now = new Date(tick)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Apply person filter for mobile only (desktop filters inline)
  function eventsForDay(day: Date) {
    const source = selectedPeople.length === 0 ? events : events.filter(e => selectedPeople.includes(e.colorId))
    return source.filter(e => {
      if (e.isAllDay) return startOfDay(day) >= startOfDay(new Date(e.start)) && startOfDay(day) < startOfDay(new Date(e.end))
      return isSameDay(new Date(e.start), day)
    })
  }

  const filteredEvents = selectedPeople.length === 0 ? events : events.filter(e => selectedPeople.includes(e.colorId))

  const goToPrev = () => { const p = addDays(weekStart, -7); setWeekStart(p); fetchNow(p) }
  const goToNext = () => { const n = addDays(weekStart, 7); setWeekStart(n); fetchNow(n) }
  const goToThisWeek = () => {
    const t = startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setWeekStart(t); fetchNow(t); setSelectedDay(new Date())
  }
  const isCurrentWeek = isSameDay(weekStart, startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 })))
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop ── */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">
          {/* Nav bar */}
          <div className="flex items-center justify-between px-8 py-3 shrink-0 border-b border-gray-200 dark:border-gray-800">
            <button onClick={goToPrev} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Previous week">‹</button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{weekLabel}</p>
              <div className="flex items-center justify-center gap-3 mt-0.5">
                <p className={`text-xs ${stale ? "text-amber-500" : "text-gray-400 dark:text-gray-600"}`}>
                  {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
                </p>
                {!isCurrentWeek && (
                  <button onClick={goToThisWeek} className="text-xs text-blue-500 hover:text-blue-600 font-medium underline underline-offset-2">This week</button>
                )}
              </div>
            </div>
            <button onClick={goToNext} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Next week">›</button>
          </div>

          <PersonFilter selected={selectedPeople} onChange={setSelectedPeople} />

          <DesktopTimeGrid
            days={days}
            events={filteredEvents}
            now={now}
            isCurrentWeek={isCurrentWeek}
            onEventClick={e => setModal({ mode: "edit", event: e })}
            onCreateAt={(day, hour) => setModal({ mode: "create" })}
          />
        </div>

        {/* ── Mobile ── */}
        <div className="flex md:hidden flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            <button onClick={goToPrev} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-2xl flex items-center justify-center">‹</button>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{format(weekStart, "MMMM yyyy")}</p>
              {!isCurrentWeek && (
                <button onClick={goToThisWeek} className="text-xs text-blue-500 underline">Today</button>
              )}
            </div>
            <button onClick={goToNext} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-2xl flex items-center justify-center">›</button>
          </div>

          <MobileWeekGrid
            days={days}
            events={events}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onEditEvent={e => setModal({ mode: "edit", event: e })}
            selectedPeople={selectedPeople}
          />
        </div>

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
