"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, differenceInMinutes, startOfDay, endOfDay, addDays, subDays } from "date-fns"
import { EventModal } from "@/components/EventModal"
import { SwimlaneView } from "@/components/SwimlaneView"
import { USERS } from "@/lib/config"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create"; defaultTime?: string; defaultDate?: string }
  | { mode: "edit"; event: CalendarEvent }

interface TodayViewProps {
  initialEvents: CalendarEvent[]
  targetDate?: string
}

const START_HOUR = 6
const END_HOUR = 23
const PX_PER_HOUR = 64
const PX_PER_MIN = PX_PER_HOUR / 60

function topPx(ev: CalendarEvent): number {
  const d = new Date(ev.start)
  const mins = (d.getHours() - START_HOUR) * 60 + d.getMinutes()
  return Math.max(0, mins * PX_PER_MIN)
}

function heightPx(ev: CalendarEvent): number {
  const mins = differenceInMinutes(new Date(ev.end), new Date(ev.start))
  return Math.max(24, mins * PX_PER_MIN)
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

function localTodayRange(targetDate?: string): { start: string; end: string } {
  const base = targetDate ? new Date(targetDate + "T12:00:00") : new Date()
  return {
    start: startOfDay(base).toISOString(),
    end: endOfDay(base).toISOString(),
  }
}

function getColor(colorId: string) {
  return USERS.find(u => u.gcalColorId === colorId)?.color ?? "#64748b"
}

// ── Mobile Agenda View ──────────────────────────────────────────────────────
function AgendaView({
  events,
  onEventClick,
  onAddAtTime,
}: {
  events: CalendarEvent[]
  onEventClick: (e: CalendarEvent) => void
  onAddAtTime: () => void
}) {
  const allDay = events.filter(e => e.isAllDay)
  const timed = events.filter(e => !e.isAllDay).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )
  const now = new Date()

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 pb-24">
        <p className="text-5xl">🗓️</p>
        <p className="text-gray-400 font-semibold text-lg">Nothing scheduled</p>
        <button
          onClick={onAddAtTime}
          className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-base"
        >
          + Add event
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
          {allDay.map(e => {
            const color = getColor(e.colorId)
            return (
              <button
                key={e.id}
                onClick={() => onEventClick(e)}
                className="w-full text-left px-4 py-3 rounded-2xl font-semibold text-white text-base"
                style={{ backgroundColor: color }}
              >
                {e.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Timed events */}
      <div className="flex flex-col px-4 pt-2 gap-2">
        {timed.map(e => {
          const color = getColor(e.colorId)
          const start = new Date(e.start)
          const end = new Date(e.end)
          const isPast = end < now
          const isNow = start <= now && now <= end
          return (
            <button
              key={e.id}
              onClick={() => onEventClick(e)}
              className={`w-full text-left rounded-2xl overflow-hidden flex transition-opacity ${isPast && !isNow ? "opacity-50" : ""}`}
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="flex-1 px-4 py-3"
                style={{ backgroundColor: color + "18" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 dark:text-white text-base leading-tight flex-1">
                    {e.title}
                  </p>
                  {isNow && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      NOW
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium mt-0.5" style={{ color }}>
                  {format(start, "h:mm a")} – {format(end, "h:mm a")}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main TodayView ──────────────────────────────────────────────────────────
export function TodayView({ initialEvents, targetDate }: TodayViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)
  const [viewMode, setViewMode] = useState<"day" | "swimlane">("day")
  const [currentDate, setCurrentDate] = useState<string | undefined>(targetDate)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Swipe tracking
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const isViewingToday = !currentDate

  const fetchNow = useCallback(async (date?: string) => {
    try {
      const { start, end } = localTodayRange(date ?? currentDate)
      const res = await fetch(`/api/events?start=${start}&end=${end}`)
      if (res.status === 401) { window.location.href = "/api/auth/signin"; return }
      if (!res.ok) throw new Error("fetch failed")
      setEvents(await res.json())
      setLastFetchedAt(Date.now())
    } catch { /* stale indicator */ }
  }, [currentDate])

  useEffect(() => { fetchNow() }, [fetchNow])
  useEffect(() => {
    const interval = setInterval(fetchNow, 30_000)
    return () => clearInterval(interval)
  }, [fetchNow])
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current || !isViewingToday) return
    const top = nowTopPx()
    const viewH = scrollRef.current.clientHeight
    scrollRef.current.scrollTop = Math.max(0, top - viewH / 3)
  }, [isViewingToday])

  function navigateDay(dir: 1 | -1) {
    const base = currentDate ? new Date(currentDate + "T12:00:00") : new Date()
    const next = dir === 1 ? addDays(base, 1) : subDays(base, 1)
    const nextStr = format(next, "yyyy-MM-dd")
    const todayStr = format(new Date(), "yyyy-MM-dd")
    const newDate = nextStr === todayStr ? undefined : nextStr
    setCurrentDate(newDate)
    setEvents([])
    fetchNow(newDate)
  }

  // Swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) > 60 && dy < 60) {
      navigateDay(dx < 0 ? 1 : -1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const stale = tick - lastFetchedAt > 120_000
  const now = new Date(tick)
  const allDay = events.filter(e => e.isAllDay)
  const timed = events.filter(e => !e.isAllDay)
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const gridH = (END_HOUR - START_HOUR + 1) * PX_PER_HOUR
  const nowTop = nowTopPx()
  const showNowLine = isViewingToday && now.getHours() >= START_HOUR && now.getHours() <= END_HOUR

  const displayDate = currentDate
    ? format(new Date(currentDate + "T12:00:00"), "EEEE, MMMM d")
    : format(now, "EEEE, MMMM d")

  return (
    <>
      <div
        className="flex flex-col flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Header row ── */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0">
          {/* Mobile: prev/next arrows */}
          <button
            onClick={() => navigateDay(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-lg shrink-0"
            aria-label="Previous day"
          >‹</button>

          <button
            onClick={() => setCurrentDate(undefined)}
            className={`text-gray-950 dark:text-white font-semibold text-base flex-1 text-left transition-opacity ${isViewingToday ? "" : "opacity-60"}`}
          >
            {displayDate}
            {!isViewingToday && (
              <span className="ml-2 text-xs text-blue-500 font-bold">← Today</span>
            )}
          </button>

          <button
            onClick={() => navigateDay(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-lg shrink-0"
            aria-label="Next day"
          >›</button>

          <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 shrink-0">
            {(["day", "swimlane"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  viewMode === mode
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className={`text-xs shrink-0 hidden sm:block ${stale ? "text-amber-500" : "text-gray-400 dark:text-gray-600"}`}>
            {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
          </p>
        </div>

        {/* ── All-day strip (desktop / timeline view) ── */}
        {allDay.length > 0 && (
          <div className="shrink-0 px-4 pb-2 border-b border-gray-200 dark:border-gray-800 hidden sm:block">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {allDay.map(e => {
                const color = getColor(e.colorId)
                return (
                  <button
                    key={e.id}
                    onClick={() => setModal({ mode: "edit", event: e })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 text-white"
                    style={{ backgroundColor: color }}
                  >
                    <span className="truncate max-w-[160px]">{e.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MOBILE: Agenda view ── */}
        <div className="flex sm:hidden flex-col flex-1 overflow-hidden">
          <AgendaView
            events={events}
            onEventClick={e => setModal({ mode: "edit", event: e })}
            onAddAtTime={() => setModal({ mode: "create", defaultDate: currentDate })}
          />
        </div>

        {/* ── DESKTOP: Swimlane or timeline ── */}
        {viewMode === "swimlane" && (
          <div className="hidden sm:flex flex-col flex-1 overflow-hidden">
            <SwimlaneView
              events={events}
              isToday={isViewingToday}
              onEventClick={e => setModal({ mode: "edit", event: e })}
            />
          </div>
        )}

        <div ref={scrollRef} className={`flex-1 overflow-y-auto pb-32 hidden sm:block${viewMode === "swimlane" ? " !hidden" : ""}`}>
          <div className="relative" style={{ height: gridH }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start pointer-events-none"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              >
                <span className="text-gray-400 dark:text-gray-600 text-xs w-14 text-right pr-2 -mt-2 select-none shrink-0 tabular-nums">
                  {hourLabel(h)}
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
              </div>
            ))}

            {showNowLine && (
              <div
                className="absolute left-14 right-0 flex items-center pointer-events-none z-20"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}

            {timed.map(e => {
              const color = getColor(e.colorId)
              const top = topPx(e)
              const height = heightPx(e)
              const isShort = height < 40
              return (
                <button
                  key={e.id}
                  onClick={() => setModal({ mode: "edit", event: e })}
                  className="absolute left-14 right-2 rounded-lg overflow-hidden text-left"
                  style={{
                    top,
                    height,
                    backgroundColor: color + "cc",
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div className="px-2 py-1 min-w-0">
                    <p className="text-white font-semibold text-xs leading-tight truncate">{e.title}</p>
                    {!isShort && (
                      <p className="text-white/80 text-xs leading-tight truncate">
                        {format(new Date(e.start), "h:mm")}–{format(new Date(e.end), "h:mm a")}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Floating + button (mobile only) ── */}
      <button
        onClick={() => setModal({ mode: "create", defaultDate: currentDate })}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-3xl font-light shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add event"
      >
        +
      </button>

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          defaultDate={modal.mode === "create" ? (modal as { defaultDate?: string }).defaultDate : undefined}
          onClose={() => setModal(null)}
          onSaved={() => fetchNow()}
        />
      )}
    </>
  )
}
