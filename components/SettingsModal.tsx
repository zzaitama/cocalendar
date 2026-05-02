"use client"

import { useEffect } from "react"
import { USERS } from "@/lib/config"
import { useTheme, type ThemeOverride } from "@/context/ThemeContext"

interface SettingsModalProps {
  onClose: () => void
}

const THEME_OPTIONS: { label: string; value: ThemeOverride }[] = [
  { label: "Auto", value: "auto" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
]

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { override, effectiveTheme, setOverride } = useTheme()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Appearance</p>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700 dark:text-gray-300">Theme</p>
            <p className="text-gray-500 text-sm capitalize">{effectiveTheme} now</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {THEME_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setOverride(value)}
                className={`flex-1 py-3 text-base font-semibold transition-colors ${
                  override === value
                    ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Family</p>
          <div className="flex flex-col gap-2">
            {USERS.map(user => (
              <div key={user.id} className="flex items-center gap-3 py-1">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-gray-800 dark:text-gray-200 text-lg">{user.name}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Edit in <code className="text-gray-600 dark:text-gray-400">lib/config.ts</code>
          </p>
        </section>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Sync</p>
          <div className="flex flex-col gap-1.5 text-gray-700 dark:text-gray-300">
            <p>Day / Week: every 30 seconds</p>
            <p>Month: every 60 seconds</p>
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">About</p>
          <div className="flex flex-col gap-1 text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-950 dark:text-white">CoCalendar</p>
            <p>Version 1.0.0</p>
            <p className="text-gray-500">Built for Raspberry Pi kiosk</p>
          </div>
        </section>
      </div>
    </div>
  )
}
