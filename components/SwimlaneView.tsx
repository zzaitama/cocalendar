"use client"

import { useRef, useEffect } from "react"
import { format, differenceInMinutes } from "date-fns"
import type { CalendarEvent } from "@/types"

const START_HOUR = 6
const END_HOUR = 23
const PX_PER_HOUR = 64
const PX_PER_MIN = PX_PER_HOUR / 60

// Google Calendar colorId → color name
const GCAL_COLOR_NAMES: Record<string, string> = {
  "1": "Lavender",
  "2": "Sage",
  "3": "Grape",
  "4": "Flamingo",
  "5": "Banana",
  "6": "Tangerine",
  "7": "Peacock",
  "8": "Graphite",
  "9": "Blueberry",
  "10": "Basil",
  "11": "Tomato",
}

// Google Calendar color name → hex
const GCAL_COLOR_HEX: Record<string, string> = {
  Lavender: "#7986CB",
  Sage: "#33B679",
  Grape: "#8E24AA",
  Flamingo: "#E67C73",
  Banana: "#F6BF26",
  Tangerine: "#F4511E",
  Peacock: "#039BE5",
  Graphite: "#616161",
  Blueberry: "#3F51B5",
  Basil: "#0F9D58",
  Tomato: "#D50000",
}

export const LANE_CONFIG = [
  { name: "Daddy",   googleColor: "Sage" },      // gcalColorId 2 = green
  { name: "Mommy",   googleColor: "Peacock" },   // gcalColorId 7 = blue
  { name: "Colette", googleColor: "Flamingo" },  // gcalColorId 4 = pink
  { name: "Monti",   googleColor: "Banana" },    // gcalColorId 5 = yellow
  { name: "Family",  googleColor: "Grape" },     // gcalColorId 3 = purple
]

// colorIds that belong to a named lane
const LANE_COLOR_IDS = new Set(
  LANE_CONFIG.map(l => Object.entries(GCAL_COLOR_NAMES).find(([, n]) => n === l.googleColor)?.[0] ?? "")
)

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
      {/* Lane headers */}
      <div className="flex shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="w-14 shrink-0" />
        {LANE_CONFIG.map(lane => (
          <div
            key={lane.name}
            className="flex-1 py-2 text-center text-base font-semibold border-l border-gray-200 dark:border-gray-800 truncate px-1"
            style={{ color: GCAL_COLOR_HEX[lane.googleColor] }}
          >
            {lane.name}
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32">
        <div className="flex" style={{ height: gridH }}>

          {/* Time gutter */}
          <div className="w-14 shrink-0 relative">
            {hours.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start pointer-events-none"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              >
                <span className="text-gray-400 dark:text-gray-600 text-xs w-full text-right pr-2 -mt-2 select-none tabular-nums">
                  {hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Lane columns */}
          <div className="flex flex-1 relative">
            {LANE_CONFIG.map(lane => {
              const laneColorId = Object.entries(GCAL_COLOR_NAMES).find(([, n]) => n === lane.googleColor)?.[0] ?? ""
              const laneColor = GCAL_COLOR_HEX[lane.googleColor]
              const laneEvents = timed.filter(e => e.colorId === laneColorId)
              const sharedEvents = timed.filter(e => !LANE_COLOR_IDS.has(e.colorId))

              return (
                <div
                  key={lane.name}
                  className="flex-1 relative border-l border-gray-200 dark:border-gray-800"
                >
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-800 pointer-events-none"
                      style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                    />
                  ))}

                  {/* Lane-owned events */}
                  {laneEvents.map(e => {
                    const top = topPx(e)
                    const height = heightPx(e)
                    return (
                      <button
                        key={e.id}
                        onClick={() => onEventClick(e)}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden text-left z-10"
                        style={{
                          top,
                          height,
                          backgroundColor: laneColor + "cc",
                          borderLeft: `3px solid ${laneColor}`,
                        }}
                      >
                        <div className="px-1 py-0.5 min-w-0">
                          <p className="text-white font-semibold text-xs leading-tight truncate">{e.title}</p>
                          {height >= 40 && (
                            <p className="text-white/80 text-xs leading-tight truncate">
                              {format(new Date(e.start), "h:mm")}–{format(new Date(e.end), "h:mm a")}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {/* Shared events — colorId not in any lane, shown at reduced opacity */}
                  {sharedEvents.map(e => {
                    const top = topPx(e)
                    const height = heightPx(e)
                    return (
                      <button
                        key={`shared-${e.id}`}
                        onClick={() => onEventClick(e)}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden text-left"
                        style={{
                          top,
                          height,
                          backgroundColor: "#64748bcc",
                          borderLeft: "3px solid #64748b",
                          opacity: 0.4,
                        }}
                      >
                        <div className="px-1 py-0.5 min-w-0">
                          <p className="text-white font-semibold text-xs leading-tight truncate">{e.title}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}

            {/* Now line spanning all 4 columns */}
            {showNowLine && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
