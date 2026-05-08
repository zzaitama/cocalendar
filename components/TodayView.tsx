"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, differenceInMinutes, startOfDay, endOfDay } from "date-fns"
import { EventModal } from "@/components/EventModal"
import { SwimlaneView } from "@/components/SwimlaneView"
import { USERS } from "@/lib/config"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create"; defaultTime?: string }
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

// Build the fetch range using the BROWSER's local time, not server UTC
function localTodayRange(targetDate?: string): { start: string; end: string } {
  const base = targetDate ? new Date(targetDate + "T12:00:00") : new Date()
  return {
    start: startOfDay(base).toISOString(),
    end: endOfDay(base).toISOString(),
  }
}

export function TodayView({ initialEvents, targetDate }: TodayViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)
  const [viewMode, setViewMode] = useState<"day" | "swimlane">("day")
  const scrollRef = useRef<HTMLDivElement>(null)

  const isViewingToday = !targetDate

  const fetchNow = useCallback(async () => {
    try {
      // Use browser-local time so the range is correct for the user's timezone
      const { start, end } = localTodayRange(targetDate)
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
      // stale indicator kicks in after 2 min
    }
  }, [targetDate])

  // Fetch immediately on mount using correct local timezone
  useEffect(() => {
    fetchNow()
  }, [fetchNow])

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

  const stale = tick - lastFetchedAt > 120_000
  const now = new Date(tick)

  const allDay = events.filter(e => e.isAllDay)
  const timed = events.filter(e => !e.isAllDay)

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const gridH = (END_HOUR - START_HOUR + 1) * PX_PER_HOUR
  const nowTop = nowTopPx()
  const showNowLine = isViewingToday && now.getHours() >= START_HOUR && now.getHours() <= END_HOUR

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Header row: date label + view toggle + sync indicator ── */}
        <div className="flex items-center gap-2 px-4 py-2 shrink-0">
          <p className="text-gray-950 dark:text-white font-semibold text-base flex-1">
            {isViewingToday
              ? format(now, "EEEE, MMMM d")
              : format(new Date(targetDate! + "T12:00:00"), "EEEE, MMMM d")}
          </p>
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
          <p className={`text-xs shrink-0 ${stale ? "text-amber-500" : "text-gray-400 dark:text-gray-600"}`}>
            {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
          </p>
        </div>

        {/* ── All-day strip ── */}
        {allDay.length > 0 && (
          <div className="shrink-0 px-4 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {allDay.map(e => {
                const color = USERS.find(u => u.gcalColorId === e.colorId)?.color ?? "#64748b"
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

        {/* ── Swimlane (desktop only when swimlane mode) ── */}
        {viewMode === "swimlane" && (
          <div className="hidden sm:flex flex-col flex-1 overflow-hidden">
            <SwimlaneView
              events={events}
              isToday={isViewingToday}
              onEventClick={e => setModal({ mode: "edit", event: e })}
            />
          </div>
        )}

        {/* ── Time grid (always on mobile; on desktop only in day mode) ── */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto pb-32${viewMode === "swimlane" ? " sm:hidden" : ""}`}>
          <div className="relative" style={{ height: gridH }}>

            {/* Hour lines + labels */}
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

            {/* Now line */}
            {showNowLine && (
              <div
                className="absolute left-14 right-0 flex items-center pointer-events-none z-20"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}

            {/* Event blocks */}
            {timed.map(e => {
              const color = USERS.find(u => u.gcalColorId === e.colorId)?.color ?? "#64748b"
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
                    <p className="text-white font-semibold text-xs leading-tight truncate">
                      {e.title}
                    </p>
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

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          onClose={() => setModal(null)}
          onSaved={fetchNow}
        />
      )}
    </>
  )
}
