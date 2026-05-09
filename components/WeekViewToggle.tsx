"use client"

import { useState } from "react"
import { WeekView } from "@/components/WeekView"
import { CardWeekView } from "@/components/CardWeekView"
import type { CalendarEvent } from "@/types"

interface WeekViewToggleProps {
  initialEvents: CalendarEvent[]
}

type ViewMode = "grid" | "cards"

export function WeekViewToggle({ initialEvents }: WeekViewToggleProps) {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid"
    const saved = localStorage.getItem("week-view-mode")
    return saved === "cards" ? "cards" : "grid"
  })

  function switchMode(next: ViewMode) {
    setMode(next)
    localStorage.setItem("week-view-mode", next)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Toggle pill — desktop only via CSS */}
      <div className="hidden md:flex justify-center py-2 shrink-0 border-b border-stone-200 dark:border-gray-800 bg-[#FAF9F7] dark:bg-gray-950">
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

      {/* Mobile: always CardWeekView, no toggle needed */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <CardWeekView initialEvents={initialEvents} />
      </div>

      {/* Desktop: respect saved mode preference */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">
        {mode === "grid" ? (
          <WeekView initialEvents={initialEvents} />
        ) : (
          <CardWeekView initialEvents={initialEvents} />
        )}
      </div>

    </div>
  )
}
