"use client"

import { useEffect, useState } from "react"
import type { ScreensaverConfig, PhotoMeta } from "@/types"

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
  const [showPicker, setShowPicker] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoMeta[]>([])

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

  async function openPicker() {
    setShowPicker(true)
    if (galleryPhotos.length === 0) {
      try {
        const res = await fetch("/api/screensaver/photos")
        if (res.ok) setGalleryPhotos(await res.json())
      } catch {}
    }
  }

  return (
    <>
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

        {/* Static mode: photo picker + fit toggle */}
        {config.mode === "static" && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">Static Photo</p>

            {config.staticPhotoUrl && (
              <img
                src={config.staticPhotoUrl}
                alt="Selected screensaver photo"
                className="w-full h-32 object-cover rounded-2xl"
              />
            )}

            <button
              onClick={openPicker}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              {config.staticPhotoUrl ? "Change photo" : "📷 Choose a photo from gallery"}
            </button>

            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-gray-300">Fit mode</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(["cover", "contain"] as const).map(fit => (
                  <button
                    key={fit}
                    onClick={() => save({ staticFit: fit })}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                      (config.staticFit ?? "cover") === fit
                        ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {fit === "cover" ? "Fill screen" : "Fit to screen"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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

      {/* Photo picker modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-[#FAF9F7] dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose a photo</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-gray-400 flex items-center justify-center font-bold"
                aria-label="Close picker"
              >✕</button>
            </div>

            {galleryPhotos.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">
                No photos uploaded yet. Add photos in the Photos tab.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 overflow-y-auto">
                {galleryPhotos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => { save({ staticPhotoUrl: photo.url }); setShowPicker(false) }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      config.staticPhotoUrl === photo.url
                        ? "border-blue-500"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <img src={photo.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
