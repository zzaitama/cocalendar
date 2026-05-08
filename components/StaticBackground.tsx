"use client"

import { useEffect, useState, useCallback } from "react"
import type { PhotoMeta } from "@/types"

interface WeatherData {
  current: number
  icon: string
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weather")
        if (res.ok) setWeather(await res.json())
      } catch { /* decorative */ }
    }
    load()
    const id = setInterval(load, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return weather
}

interface StaticBackgroundProps {
  onDismiss: () => void
}

export function StaticBackground({ onDismiss }: StaticBackgroundProps) {
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [currentPhoto, setCurrentPhoto] = useState<string>("")
  const now = useClock()
  const weather = useWeather()

  useEffect(() => {
    fetch("/api/screensaver/photos")
      .then(r => r.ok ? r.json() : [])
      .then((files: PhotoMeta[]) => {
        setPhotos(files)
        if (files.length > 0) {
          const idx = Math.floor(Math.random() * files.length)
          setCurrentPhoto(files[idx].url)
        }
      })
      .catch(() => {})
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 || 12
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{ zIndex: 9999 }}
      onClick={onDismiss}
      onTouchStart={onDismiss}
    >
      {/* Background photo */}
      {currentPhoto ? (
        <img
          src={currentPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* Subtle dark vignette so clock is readable */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 75%)"
        }}
      />

      {/* Clock — bottom right */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1 pointer-events-none select-none">
        <div className="text-white font-thin leading-none drop-shadow-lg" style={{ fontSize: 72 }}>
          {displayHour}:{minutes}
          <span className="text-2xl ml-2 align-middle font-light">{ampm}</span>
        </div>
        <p className="text-white/80 text-xl font-light drop-shadow">{dateStr}</p>
        {weather && (
          <p className="text-white/70 text-lg drop-shadow">
            {weather.icon} {Math.round(weather.current)}°
          </p>
        )}
      </div>
    </div>
  )
}
