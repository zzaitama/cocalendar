"use client"

import { useRef, useEffect } from "react"
import { useAvatar } from "@/context/AvatarContext"
import { USERS } from "@/lib/config"
import { format, differenceInMinutes } from "date-fns"
import type { CalendarEvent } from "@/types"

const START_HOUR = 6
const END_HOUR = 23
const PX_PER_HOUR = 64
const PX_PER_MIN = PX_PER_HOUR / 60

// Derive lanes directly from USERS config — single source of truth, never drifts
const LANE_CONFIG = USERS.map(u => ({
  name: u.name,
  colorId: u.gcalColorId,
  color: u.color,
}))

const LANE_COLOR_IDS = new Set(LANE_CONFIG.map(l => l.colorId))

interface SwimlaneViewProps {
  events: CalendarEvent[]
  isToday: boolean
  onEventClick: (ev: CalendarEvent) => void
}

function topPx(ev: CalendarEvent): number {
  const d = new Date(ev.start)
  return Math.max(0, ((d.getHours() - START_HOUR) * 60 + d.getMinutes()) * PX_PER_MIN)
}

function heightPx(ev: CalendarEvent): number {
  return Math.max(24, differenceInMinutes(new Date(ev.end), new Date(ev.start)) * PX_PER_MIN)
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

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function LaneHeaders() {
  const { getAvatar } = useAvatar()
  return (
    <div className="flex shrink-0 border-b border-stone-200 dark:border-gray-800 bg-[#FAF9F7] dark:bg-gray-950">
      <div className="w-14 shrink-0" />
      {LANE_CONFIG.map(lane => {
        const user = USERS.find(u => u.name === lane.name)
        const emoji = user ? getAvatar(user.id) : ""
        return (
          <div
            key={lane.name}
            className="flex-1 py-2 text-center text-base font-bold border-l border-stone-200 dark:border-gray-800 truncate px-1 flex flex-col items-center justify-center gap-0.5"
            style={{ color: lane.color }}
          >
            {emoji && <span className="text-lg leading-none">{emoji}</span>}
            <span>{lane.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SwimlaneView({ events, isToday, onEventClick }: SwimlaneViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current || !isToday) return
    const top = nowTopPx()
    const viewH = scrollRef.current.clientHeight
    scrollRef.current.scrollTop = Math.max(0, top - viewH / 3)
  }, [isToday])

  const timed = events.filter(e => !e.isAllDay)
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const gridH = (END_HOUR - START_HOUR + 1) * PX_PER_HOUR
  const now = new Date()
  const nowTop = nowTopPx()
  const showNowLine = isToday && now.getHours() >= START_HOUR && now.getHours() <= END_HOUR

  return (
    <>
      <LaneHeaders />

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32 bg-[#FAF9F7] dark:bg-gray-950">
        <div className="flex" style={{ height: gridH }}>

          {/* Time gutter */}
          <div className="w-14 shrink-0 relative">
            {hours.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start pointer-events-none"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              >
                <span className="text-stone-300 dark:text-gray-700 text-xs w-full text-right pr-2 -mt-2 select-none tabular-nums font-semibold">
                  {hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Lane columns */}
          <div className="flex flex-1 relative">
            {LANE_CONFIG.map(lane => {
              const laneEvents = timed.filter(e => e.colorId === lane.colorId)
              const sharedEvents = timed.filter(e => !LANE_COLOR_IDS.has(e.colorId))
              const rgb = hexToRgb(lane.color)

              return (
                <div
                  key={lane.name}
                  className="flex-1 relative border-l border-stone-200 dark:border-gray-800"
                >
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-stone-100 dark:border-gray-800/80 pointer-events-none"
                      style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                    />
                  ))}

                  {/* Lane-owned events — pastel style matching the rest of the app */}
                  {laneEvents.map(e => {
                    const top = topPx(e)
                    const height = heightPx(e)
                    return (
                      <button
                        key={e.id}
                        onClick={() => onEventClick(e)}
                        className="absolute left-0.5 right-0.5 rounded-2xl overflow-hidden text-left z-10 transition-all hover:brightness-95"
                        style={{
                          top,
                          height,
                          backgroundColor: `rgba(${rgb}, 0.15)`,
                          borderLeft: `3px solid ${lane.color}`,
                        }}
                      >
                        <div className="px-2 py-0.5 min-w-0">
                          <p className="font-bold text-xs leading-tight truncate" style={{ color: lane.color }}>
                            {e.title}
                          </p>
                          {height >= 40 && (
                            <p className="text-xs leading-tight truncate font-semibold" style={{ color: lane.color, opacity: 0.7 }}>
                              {format(new Date(e.start), "h:mm")}–{format(new Date(e.end), "h:mm a")}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {/* Shared / unassigned events */}
                  {sharedEvents.map(e => {
                    const top = topPx(e)
                    const height = heightPx(e)
                    return (
                      <button
                        key={`shared-${e.id}`}
                        onClick={() => onEventClick(e)}
                        className="absolute left-0.5 right-0.5 rounded-2xl overflow-hidden text-left opacity-40"
                        style={{
                          top,
                          height,
                          backgroundColor: "rgba(100,116,139,0.15)",
                          borderLeft: "3px solid #64748b",
                        }}
                      >
                        <div className="px-2 py-0.5 min-w-0">
                          <p className="text-stone-600 font-bold text-xs leading-tight truncate">{e.title}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}

            {/* Now line */}
            {showNowLine && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 -ml-1 shrink-0" />
                <div className="flex-1 border-t-2 border-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
