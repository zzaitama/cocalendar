"use client"

import { useEffect, useState } from "react"
import type { ScreensaverConfig } from "@/types"

const STORAGE_KEY = "cocalendar-screensaver"
const DEFAULT_CONFIG: ScreensaverConfig = {
  idleTimeout: 5,
  clockStyle: "digital",
  mode: "bouncing",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
}

const TIMEOUT_OPTIONS = [1, 2, 5, 10, 30]

export function ScreensaverSettings() {
  const [config, setConfig] = useState<ScreensaverConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) })
    } catch { /* use defaults */ }
  }, [])

  function save(patch: Partial<ScreensaverConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event("storage"))
  }

  return (
    <section className="flex flex-col gap-4">

      {/* Mode toggle */}
      <div>
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-3 font-bold">Display Mode</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => save({ mode: "bouncing" })}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
              config.mode === "bouncing"
                ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <span className="text-2xl">🎴</span>
            <span className="text-sm font-semibold">Bouncing Photos</span>
            <span className="text-xs opacity-70 text-center leading-tight">Cards float around the screen</span>
          </button>
          <button
            onClick={() => save({ mode: "static" })}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
              config.mode === "static"
                ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-sm font-semibold">Static Display</span>
            <span className="text-xs opacity-70 text-center leading-tight">Full photo + clock &amp; weather</span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-3 font-bold">Screensaver</p>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">Idle timeout</p>
            <select
              value={config.idleTimeout}
              onChange={e => save({ idleTimeout: Number(e.target.value) })}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200"
            >
              {TIMEOUT_OPTIONS.map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          {config.mode === "bouncing" && (
            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-gray-300">Clock style</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(["digital", "analog"] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => save({ clockStyle: style })}
                    className={`px-5 py-2.5 text-base font-semibold capitalize transition-colors ${
                      config.clockStyle === style
                        ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-gray-300">Quiet hours</p>
              <button
                onClick={() => save({ quietHoursEnabled: !config.quietHoursEnabled })}
                className={`w-12 h-7 rounded-full transition-colors ${config.quietHoursEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full mx-1 transition-transform ${config.quietHoursEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {config.quietHoursEnabled && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <input type="time" value={config.quietHoursStart}
                  onChange={e => save({ quietHoursStart: e.target.value })}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2" />
                <span>to</span>
                <input type="time" value={config.quietHoursEnd}
                  onChange={e => save({ quietHoursEnd: e.target.value })}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
