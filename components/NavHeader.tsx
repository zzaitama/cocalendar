"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { formatDate } from "@/lib/utils"
import type { WeatherData } from "@/lib/weather"

interface NavHeaderProps {
  activePage: "day" | "week" | "month"
}

export function NavHeader({ activePage }: NavHeaderProps) {
  const [now, setNow] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showWeather, setShowWeather] = useState(false)

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
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-gray-400 text-2xl" suppressHydrationWarning>
              {formatDate(now)}
            </p>
            {activePage === "day" && weather && (
              <button
                onClick={() => setShowWeather(true)}
                className="text-2xl text-gray-400 hover:text-gray-200 transition-colors min-h-14 px-2 flex items-center gap-1"
                aria-label="Weather detail"
              >
                <span>{weather.icon}</span>
                <span>{weather.current}°F</span>
              </button>
            )}
          </div>
          <p className="text-white font-bold tabular-nums leading-none mt-1" suppressHydrationWarning>
            <span className="text-7xl">{format(now, "h:mm")}</span>
            <span className="text-4xl text-gray-400 ml-2">{format(now, "a")}</span>
          </p>
        </div>

        <nav className="flex gap-3">
          {([["Day", "/", "day"], ["Week", "/week", "week"], ["Month", "/month", "month"]] as const).map(
            ([label, href, page]) => (
              <Link
                key={page}
                href={href}
                className={`px-6 py-4 rounded-xl text-2xl font-semibold min-h-14 flex items-center transition-colors ${
                  activePage === page
                    ? "bg-white text-gray-950"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {label}
              </Link>
            )
          )}
        </nav>
      </header>

      {showWeather && weather && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setShowWeather(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-white text-2xl font-semibold">Today&apos;s Weather</p>
              <button
                onClick={() => setShowWeather(false)}
                className="w-10 h-10 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-center mb-8">
              <p className="text-6xl mb-2">{weather.icon}</p>
              <p className="text-5xl font-bold text-white tabular-nums">{weather.current}°F</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["Morning", weather.morning],
                  ["Afternoon", weather.afternoon],
                  ["Evening", weather.evening],
                ] as const
              ).map(([label, period]) => (
                <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm mb-2">{label}</p>
                  <p className="text-2xl mb-1">{period.icon}</p>
                  <p className="text-white font-semibold tabular-nums">{period.hi}°</p>
                  <p className="text-gray-500 tabular-nums">{period.lo}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
