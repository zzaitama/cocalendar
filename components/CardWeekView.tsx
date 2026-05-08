"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { addDays, isSameDay, startOfDay, isToday, format, startOfWeek } from "date-fns"
import { useFamily } from "@/context/FamilyContext"
import { useAvatar } from "@/context/AvatarContext"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { weekRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

type ModalState = { mode: "create"; defaultDate?: string } | { mode: "edit"; event: CalendarEvent }

interface CardWeekViewProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function CardWeekView({ initialEvents, initialWeekStart }: CardWeekViewProps) {
  const { members } = useFamily()
  const { getAvatar } = useAvatar()
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date(initialWeekStart)))
  // Mobile anchor: center day of the 3-day view
  const [anchorDay, setAnchorDay] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState(Date.now())
  const [tick, setTick] = useState(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchForRange = useCallback(async (anchor: Date) => {
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
    const i = setInterval(() => fetchForRange(weekStart), 30_000)
    return () => clearInterval(i)
  }, [weekStart, fetchForRange])

  useEffect(() => {
    const i = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(i)
  }, [])

  const stale = tick - lastFetchedAt > 120_000

  // Desktop: 7 days from weekStart
  const desktopDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  // Mobile: 3 days centered on anchorDay
  const mobileDays = [addDays(anchorDay, -1), anchorDay, addDays(anchorDay, 1)]

  // Desktop nav
  const goDesktopPrev = () => { const p = addDays(weekStart, -7); setWeekStart(p); fetchForRange(p) }
  const goDesktopNext = () => { const n = addDays(weekStart, 7); setWeekStart(n); fetchForRange(n) }
  const goDesktopToday = () => {
    const t = startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setWeekStart(t); fetchForRange(t)
  }

  // Mobile nav
  const goMobilePrev = () => { const p = addDays(anchorDay, -1); setAnchorDay(p); fetchForRange(p) }
  const goMobileNext = () => { const n = addDays(anchorDay, 1); setAnchorDay(n); fetchForRange(n) }
  const goMobileToday = () => { const t = startOfDay(new Date()); setAnchorDay(t); fetchForRange(t) }

  const isCurrentWeek = isSameDay(weekStart, startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 })))
  const isTodayAnchor = isSameDay(anchorDay, startOfDay(new Date()))

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
  const mobileDateLabel = format(anchorDay, "MMMM yyyy")

  function getEventsForDay(day: Date) {
    return events
      .filter(e => {
        if (e.isAllDay) {
          return startOfDay(day) >= startOfDay(new Date(e.start)) &&
                 startOfDay(day) < startOfDay(new Date(e.end))
        }
        return isSameDay(new Date(e.start), day)
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  function userForEvent(e: CalendarEvent) {
    return members.find(u => u.gcalColorId === e.colorId)
  }

  function handleSaved(updated?: CalendarEvent) {
    if (updated) {
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      refetchTimer.current = setTimeout(() => fetchForRange(weekStart), 2000)
    } else {
      fetchForRange(weekStart)
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) > 60 && dy < 80) {
      if (dx < 0) { goMobileNext() } else { goMobilePrev() }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  function DayColumn({ day }: { day: Date }) {
    const dayEvents = getEventsForDay(day)
    const allDayEvents = dayEvents.filter(e => e.isAllDay)
    const timedEvents = dayEvents.filter(e => !e.isAllDay)
    const today = isToday(day)
    const eventCount = dayEvents.length

    return (
      <div className={`flex flex-col flex-1 min-w-0 ${today ? "bg-amber-50/50 dark:bg-amber-900/10" : "bg-[#FAF9F7] dark:bg-gray-950"}`}>
        <div
          className="shrink-0 px-2 pt-3 pb-2 cursor-pointer"
          onClick={() => setModal({ mode: "create", defaultDate: format(day, "yyyy-MM-dd") })}
        >
          <p className={`text-xs uppercase tracking-widest font-bold text-center ${today ? "text-gray-900 dark:text-white" : "text-stone-400"}`}>
            {format(day, "EEE")}
          </p>
          <div className="flex flex-col items-center mt-0.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${today ? "bg-red-500" : ""}`}>
              <p className={`text-xl font-extrabold tabular-nums ${today ? "text-white" : "text-stone-400 dark:text-gray-400"}`}>
                {format(day, "d")}
              </p>
            </div>
            {eventCount > 0 && (
              <p className={`text-xs font-semibold mt-0.5 ${today ? "text-red-500" : "text-stone-400"}`}>
                {eventCount} {eventCount === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        </div>

        {allDayEvents.length > 0 && (
          <div className="px-1.5 pb-1.5 flex flex-col gap-1 shrink-0">
            {allDayEvents.map(e => {
              const user = userForEvent(e)
              const color = user?.color ?? "#64748b"
              return (
                <button key={e.id} onClick={() => setModal({ mode: "edit", event: e })}
                  className="w-full text-left rounded-xl px-2 py-1 text-xs font-bold truncate text-white"
                  style={{ backgroundColor: color }}
                >{e.title}</button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-1.5 px-1.5 pb-3 overflow-y-auto flex-1">
          {timedEvents.map(e => {
            const user = userForEvent(e)
            const color = user?.color ?? "#64748b"
            const rgb = hexToRgb(color)
            const emoji = user ? getAvatar(user.id) : ""
            const initial = user?.name?.[0]?.toUpperCase() ?? ""
            return (
              <button key={e.id} onClick={() => setModal({ mode: "edit", event: e })}
                className="w-full text-left rounded-2xl p-2 transition-all active:brightness-90 shrink-0"
                style={{ backgroundColor: `rgba(${rgb}, 0.13)`, borderLeft: `3px solid ${color}` }}
              >
                <p className="text-xs font-extrabold leading-tight truncate" style={{ color }}>{e.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs font-semibold leading-none" style={{ color, opacity: 0.7 }}>
                    {format(new Date(e.start), "h:mm")}–{format(new Date(e.end), "h:mm a")}
                  </p>
                  {(emoji || initial) && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: color, fontSize: "8px" }}>
                      {emoji || initial}
                    </div>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs mt-1 leading-tight line-clamp-2 font-medium" style={{ color, opacity: 0.6 }}>
                    {e.description}
                  </p>
                )}
              </button>
            )
          })}
          <button
            onClick={() => setModal({ mode: "create", defaultDate: format(day, "yyyy-MM-dd") })}
            className="w-full text-left rounded-xl px-2 py-1.5 text-xs font-semibold text-stone-300 dark:text-gray-700 hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-gray-800/50 transition-all shrink-0"
          >+ Add</button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile layout (< md) ── */}
      <div
        className="flex md:hidden flex-col flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-stone-200 dark:border-gray-800 bg-[#FAF9F7] dark:bg-gray-950">
          <button onClick={goMobilePrev} className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-white text-2xl flex items-center justify-center font-bold">‹</button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{mobileDateLabel}</p>
            <div className="flex items-center justify-center gap-3 mt-0.5">
              <p className={`text-xs font-semibold ${stale ? "text-amber-500" : "text-stone-400"}`}>
                {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
              </p>
              {!isTodayAnchor && (
                <button onClick={goMobileToday} className="text-xs text-blue-500 font-bold underline underline-offset-2">Today</button>
              )}
            </div>
          </div>
          <button onClick={goMobileNext} className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-white text-2xl flex items-center justify-center font-bold">›</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="flex h-full divide-x divide-stone-200 dark:divide-gray-800">
            {mobileDays.map(day => <DayColumn key={day.toISOString()} day={day} />)}
          </div>
        </div>
      </div>

      {/* ── Desktop layout (>= md) ── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-3 shrink-0 border-b border-stone-200 dark:border-gray-800 bg-[#FAF9F7] dark:bg-gray-950">
          <button onClick={goDesktopPrev} className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-white text-2xl flex items-center justify-center font-bold hover:bg-stone-200 transition-colors">‹</button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{weekLabel}</p>
            <div className="flex items-center justify-center gap-3 mt-0.5">
              <p className={`text-xs font-semibold ${stale ? "text-amber-500" : "text-stone-400"}`}>
                {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
              </p>
              {!isCurrentWeek && (
                <button onClick={goDesktopToday} className="text-xs text-blue-500 font-bold underline underline-offset-2">This week</button>
              )}
            </div>
          </div>
          <button onClick={goDesktopNext} className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-white text-2xl flex items-center justify-center font-bold hover:bg-stone-200 transition-colors">›</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[700px] h-full divide-x divide-stone-200 dark:divide-gray-800">
            {desktopDays.map(day => <DayColumn key={day.toISOString()} day={day} />)}
          </div>
        </div>
      </div>

      <AddButton onClick={() => setModal({ mode: "create" })} />

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          defaultDate={modal.mode === "create" ? modal.defaultDate : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
