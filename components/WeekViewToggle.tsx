"use client"

import { useState, useEffect } from "react"
import { WeekView } from "@/components/WeekView"
import { CardWeekView } from "@/components/CardWeekView"
import type { CalendarEvent } from "@/types"

interface WeekViewToggleProps {
  initialEvents: CalendarEvent[]
  initialWeekStart: string
}

type ViewMode = "grid" | "cards"

export function WeekViewToggle({ initialEvents, initialWeekStart }: WeekViewToggleProps) {
  const [mode, setMode] = useState<ViewMode>("grid")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (isMobile) {
      // Always use cards on mobile — grid is unusable
      setMode("cards")
      return
    }
    const saved = localStorage.getItem("week-view-mode") as ViewMode | null
    if (saved === "grid" || saved === "cards") setMode(saved)
  }, [isMobile])

  function switchMode(next: ViewMode) {
    setMode(next)
    localStorage.setItem("week-view-mode", next)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toggle pill — desktop only */}
      {!isMobile && (
        <div className="flex justify-center py-2 shrink-0 border-b border-stone-200 dark:border-gray-800 bg-[#FAF9F7] dark:bg-gray-950">
          <div className="flex gap-0.5 bg-stone-100 dark:bg-gray-800 rounded-2xl p-1">
            <button
              onClick={() => switchMode("grid")}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                mode === "grid"
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-stone-400 dark:text-gray-500 hover:text-stone-600"
              }`}
            >
              ⏱ Grid
            </button>
            <button
              onClick={() => switchMode("cards")}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                mode === "cards"
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-stone-400 dark:text-gray-500 hover:text-stone-600"
              }`}
            >
              🗂 Cards
            </button>
          </div>
        </div>
      )}

      {mode === "grid" ? (
        <WeekView initialEvents={initialEvents} initialWeekStart={initialWeekStart} />
      ) : (
        <CardWeekView initialEvents={initialEvents} initialWeekStart={initialWeekStart} />
      )}
    </div>
  )
}
