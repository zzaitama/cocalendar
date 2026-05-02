"use client"

import { useRef, useEffect, useState } from "react"
import { format, addMinutes, differenceInMinutes } from "date-fns"
import { USERS } from "@/lib/config"
import type { CalendarEvent } from "@/types"

const PX_PER_30MIN = 56
const START_HOUR = 6
const END_HOUR = 24
const LONG_PRESS_MS = 500

interface TimeGridProps {
  events: CalendarEvent[]
  isToday?: boolean
  onEventDrop: (ev: CalendarEvent, start: string, end: string) => Promise<void>
  onEventClick: (ev: CalendarEvent) => void
}

function topPx(ev: CalendarEvent) {
  const d = new Date(ev.start)
  return ((d.getHours() - START_HOUR) * 60 + d.getMinutes()) / 30 * PX_PER_30MIN
}

function heightPx(ev: CalendarEvent) {
  return Math.max(PX_PER_30MIN, differenceInMinutes(new Date(ev.end), new Date(ev.start)) / 30 * PX_PER_30MIN)
}

function hourLabel(h: number) {
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

export function TimeGrid({ events, isToday = true, onEventDrop, onEventClick }: TimeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragInfo = useRef<{ event: CalendarEvent; startY: number } | null>(null)
  const deltaSlots = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dragVisual, setDragVisual] = useState<{ id: string; slots: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const now = new Date()
    const t = ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) / 30 * PX_PER_30MIN
    containerRef.current.scrollTop = Math.max(0, t - containerRef.current.clientHeight / 3)
  }, [])

  function handlePointerDown(e: React.PointerEvent, ev: CalendarEvent) {
    if (ev.isAllDay) return
    const startY = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    isDragging.current = false
    deltaSlots.current = 0
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true
      dragInfo.current = { event: ev, startY }
      setDragVisual({ id: ev.id, slots: 0 })
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e: React.PointerEvent, ev: CalendarEvent) {
    if (!isDragging.current || dragInfo.current?.event.id !== ev.id) return
    const slots = Math.round((e.clientY - dragInfo.current.startY) / PX_PER_30MIN)
    deltaSlots.current = slots
    setDragVisual({ id: ev.id, slots })
  }

  function handlePointerUp(ev: CalendarEvent) {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!isDragging.current) {
      onEventClick(ev)
    } else if (deltaSlots.current !== 0 && dragInfo.current) {
      const mins = deltaSlots.current * 30
      const newStart = addMinutes(new Date(ev.start), mins)
      const newEnd = addMinutes(new Date(ev.end), mins)
      if (newStart.getHours() >= START_HOUR && newEnd.getHours() <= END_HOUR) {
        void onEventDrop(ev, newStart.toISOString(), newEnd.toISOString())
      }
    }
    isDragging.current = false
    dragInfo.current = null
    deltaSlots.current = 0
    setDragVisual(null)
  }

  function handlePointerCancel() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    isDragging.current = false
    dragInfo.current = null
    deltaSlots.current = 0
    setDragVisual(null)
  }

  const totalH = (END_HOUR - START_HOUR) * 2 * PX_PER_30MIN
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const now = new Date()
  const nowTop = ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) / 30 * PX_PER_30MIN
  const showNow = now.getHours() >= START_HOUR && now.getHours() < END_HOUR

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto pb-32">
      <div className="relative" style={{ height: totalH }}>

        {hours.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-center pointer-events-none"
            style={{ top: (h - START_HOUR) * 2 * PX_PER_30MIN }}
          >
            <span className="text-gray-600 text-xs w-14 text-right pr-3 select-none shrink-0">
              {hourLabel(h)}
            </span>
            <div className="flex-1 border-t border-gray-800" />
          </div>
        ))}

        {isToday && showNow && (
          <div
            className="absolute left-14 right-0 flex items-center pointer-events-none z-20"
            style={{ top: nowTop }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
            <div className="flex-1 border-t-2 border-red-500" />
          </div>
        )}

        {events.filter(e => !e.isAllDay).map(e => {
          const isDrag = dragVisual?.id === e.id
          const t = topPx(e) + (isDrag ? (dragVisual?.slots ?? 0) * PX_PER_30MIN : 0)
          const h = heightPx(e)
          const user = USERS.find(u => u.gcalColorId === e.colorId)
          const color = user?.color ?? "#64748b"
          return (
            <div
              key={e.id}
              className={`absolute left-14 right-2 rounded-lg overflow-hidden ${isDrag ? "z-10 shadow-2xl" : ""}`}
              style={{
                top: t,
                height: h,
                backgroundColor: "#1e293b",
                borderLeft: `4px solid ${color}`,
                touchAction: "none",
                transform: isDrag ? "scale(1.02)" : undefined,
                transition: isDrag ? "none" : "top 0.15s ease",
                userSelect: "none",
              }}
              onPointerDown={ev => handlePointerDown(ev, e)}
              onPointerMove={ev => handlePointerMove(ev, e)}
              onPointerUp={() => handlePointerUp(e)}
              onPointerCancel={handlePointerCancel}
            >
              <div className="px-2 py-1.5 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight truncate">{e.title}</p>
                <p className="text-gray-400 text-xs">{format(new Date(e.start), "h:mm a")}</p>
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
