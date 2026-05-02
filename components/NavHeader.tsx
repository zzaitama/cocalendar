"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { formatDate } from "@/lib/utils"
import { SettingsModal } from "@/components/SettingsModal"
import type { WeatherData } from "@/lib/weather"

interface NavHeaderProps {
  activePage: "day" | "week" | "month" | "list" | "chores"
}

export function NavHeader({ activePage }: NavHeaderProps) {
  const [now, setNow] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showWeather, setShowWeather] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (activePage !== "day") return
    async function load() {
      const { fetchWeather } = await import("@/lib/weather")
      const data = await fetchWeather()
      setWeather(data)
    }
    load()
    const interval = setInterval(load, 30 * 60_000)
    return () => clearInterval(interval)
  }, [activePage])

  return (
    <>
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 dark:text-gray-400 text-2xl" suppressHydrationWarning>
              {formatDate(now)}
            </p>
            {activePage === "day" && weather && (
              <button
                onClick={() => setShowWeather(true)}
                className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors min-h-14 px-2 flex items-center gap-1"
                aria-label="Weather detail"
              >
                <span>{weather.icon}</span>
                <span>{weather.current}°F</span>
              </button>
            )}
          </div>
          <p className="text-gray-950 dark:text-white font-bold tabular-nums leading-none mt-1" suppressHydrationWarning>
            <span className="text-7xl">{format(now, "h:mm")}</span>
            <span className="text-4xl text-gray-500 dark:text-gray-400 ml-2">{format(now, "a")}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex gap-3">
            {([["Day", "/", "day"], ["Week", "/week", "week"], ["Month", "/month", "month"], ["List", "/list", "list"], ["Chores", "/chores", "chores"]] as const).map(
              ([label, href, page]) => (
                <Link
                  key={page}
                  href={href}
                  className={`px-6 py-4 rounded-xl text-2xl font-semibold min-h-14 flex items-center transition-colors ${
                    activePage === page
                      ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {label}
                </Link>
              )
            )}
          </nav>

          <button
            onClick={() => setShowSettings(true)}
            className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {showWeather && weather && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setShowWeather(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-950 dark:text-white text-2xl font-semibold">Today&apos;s Weather</p>
              <button
                onClick={() => setShowWeather(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-center mb-8">
              <p className="text-6xl mb-2">{weather.icon}</p>
              <p className="text-5xl font-bold text-gray-950 dark:text-white tabular-nums">{weather.current}°F</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["Morning", weather.morning],
                  ["Afternoon", weather.afternoon],
                  ["Evening", weather.evening],
                ] as const
              ).map(([label, period]) => (
                <div key={label} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm mb-2">{label}</p>
                  <p className="text-2xl mb-1">{period.icon}</p>
                  <p className="text-gray-950 dark:text-white font-semibold tabular-nums">{period.hi}°</p>
                  <p className="text-gray-500 tabular-nums">{period.lo}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
