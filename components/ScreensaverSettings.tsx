"use client"

import { useEffect, useRef, useState } from "react"
import type { ScreensaverConfig } from "@/types"

const STORAGE_KEY = "cocalendar-screensaver"
const DEFAULT_CONFIG: ScreensaverConfig = {
  idleTimeout: 5,
  clockStyle: "digital",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
}

const TIMEOUT_OPTIONS = [1, 2, 5, 10, 30]

interface UploadItem {
  file: File
  progress: number
  done: boolean
  error: boolean
  previewUrl: string
}

export function ScreensaverSettings() {
  const [config, setConfig] = useState<ScreensaverConfig>(DEFAULT_CONFIG)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) })
    } catch { /* use defaults */ }
    loadPhotos()
  }, [])

  function save(patch: Partial<ScreensaverConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event("storage"))
  }

  async function loadPhotos() {
    const res = await fetch("/api/screensaver/photos")
    if (res.ok) setPhotos(await res.json())
  }

  async function deletePhoto(filename: string) {
    await fetch(`/api/screensaver/photos/${encodeURIComponent(filename)}`, { method: "DELETE" })
    setPhotos(p => p.filter(f => f !== filename))
  }

  async function uploadFiles(files: File[]) {
    const valid = files.filter(f => f.size <= 50 * 1024 * 1024).slice(0, 20)
    const items: UploadItem[] = valid.map(f => ({
      file: f, progress: 0, done: false, error: false,
      previewUrl: URL.createObjectURL(f),
    }))
    setUploads(prev => [...prev, ...items])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const idx = uploads.length + i

      const ticker = setInterval(() => {
        setUploads(prev => prev.map((u, j) =>
          j === idx && !u.done ? { ...u, progress: Math.min(90, u.progress + Math.random() * 15) } : u
        ))
      }, 200)

      try {
        const fd = new FormData()
        fd.append("files", item.file)
        const res = await fetch("/api/screensaver/photos", { method: "POST", body: fd })
        clearInterval(ticker)
        setUploads(prev => prev.map((u, j) =>
          j === idx ? { ...u, progress: 100, done: true, error: !res.ok } : u
        ))
        if (res.ok) await loadPhotos()
      } catch {
        clearInterval(ticker)
        setUploads(prev => prev.map((u, j) =>
          j === idx ? { ...u, progress: 100, done: true, error: true } : u
        ))
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-widest text-gray-500">Screensaver</p>

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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-gray-700 dark:text-gray-300">Photos <span className="text-gray-400">({photos.length})</span></p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold"
          >
            Add photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) uploadFiles(Array.from(e.target.files)) }}
          />
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <p className="text-gray-500 text-sm">Drop photos here or tap &quot;Add photos&quot;</p>
          <p className="text-gray-400 text-xs mt-1">AirDrop to this device, then pick from Files</p>
        </div>

        {uploads.length > 0 && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {uploads.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{u.file.name}</p>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${u.error ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {u.error ? "Failed" : u.done ? "Done" : `${Math.round(u.progress)}%`}
                </span>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {photos.map(filename => (
              <div key={filename} className="relative aspect-square rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/screensaver-photos/${filename}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto(filename)}
                  className="absolute top-1 right-1 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
