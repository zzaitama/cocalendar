"use client"

import { useState, useEffect } from "react"
import { USERS } from "@/lib/config"
import { useTheme, type ThemeOverride } from "@/context/ThemeContext"
import { ScreensaverSettings } from "./ScreensaverSettings"
import { AvatarPicker } from "./AvatarPicker"
import { useAvatar } from "@/context/AvatarContext"

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
  const { getAvatar } = useAvatar()
  const [editingUser, setEditingUser] = useState<string | null>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <>
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
            <div className="flex flex-col gap-1">
              {USERS.map(user => {
                const emoji = getAvatar(user.id)
                return (
                  <button
                    key={user.id}
                    onClick={() => setEditingUser(user.id)}
                    className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border-2"
                      style={{ borderColor: user.color, backgroundColor: user.color + "22" }}
                    >
                      {emoji || <span className="text-sm" style={{ color: user.color }}>?</span>}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 text-lg flex-1">{user.name}</span>
                    <span className="text-xs text-gray-400">{emoji ? "Change" : "Set avatar"} →</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Sync</p>
            <div className="flex flex-col gap-1.5 text-gray-700 dark:text-gray-300">
              <p>Day / Week: every 30 seconds</p>
              <p>Month: every 60 seconds</p>
            </div>
          </section>

          <ScreensaverSettings />

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

      {editingUser && (
        <AvatarPicker userId={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </>
  )
}
