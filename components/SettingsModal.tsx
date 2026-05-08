"use client"

import { useEffect, useState } from "react"
import { useTheme, type ThemeOverride } from "@/context/ThemeContext"
import { ScreensaverSettings } from "./ScreensaverSettings"
import { ScreensaverPhotos } from "./ScreensaverPhotos"
import { FamilyMemberEditor } from "./FamilyMemberEditor"

interface SettingsModalProps {
  onClose: () => void
}

const THEME_OPTIONS: { label: string; value: ThemeOverride }[] = [
  { label: "Auto", value: "auto" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
]

type Tab = 'general' | 'screensaver' | 'photos'

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { override, effectiveTheme, setOverride } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: '⚙️ General' },
    { id: 'screensaver', label: '🖥️ Screensaver' },
    { id: 'photos', label: '📷 Photos' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-lg bg-[#FAF9F7] dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-gray-400 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-gray-700 transition-colors font-bold"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 -mt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <>
            <section>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3 font-bold">Appearance</p>
              <div className="flex items-center justify-between mb-3">
                <p className="text-stone-600 dark:text-gray-300 font-semibold">Theme</p>
                <p className="text-stone-400 text-sm capitalize font-semibold">{effectiveTheme} now</p>
              </div>
              <div className="flex rounded-2xl overflow-hidden border border-stone-200 dark:border-gray-700">
                {THEME_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setOverride(value)}
                    className={`flex-1 py-3 text-base font-bold transition-colors ${
                      override === value
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "bg-[#FAF9F7] dark:bg-gray-800 text-stone-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <FamilyMemberEditor />

            <section>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3 font-bold">Sync</p>
              <div className="flex flex-col gap-1.5 text-stone-600 dark:text-gray-300 font-semibold">
                <p>Day / Week: every 30 seconds</p>
                <p>Month: every 60 seconds</p>
              </div>
            </section>
          </>
        )}

        {activeTab === 'screensaver' && (
          <ScreensaverSettings />
        )}

        {activeTab === 'photos' && (
          <ScreensaverPhotos />
        )}
      </div>
    </div>
  )
}
