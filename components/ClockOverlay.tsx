"use client"

import { useEffect, useState } from "react"

interface WeatherData {
  current: number
  icon: string
}

interface ClockOverlayProps {
  clockStyle: "digital" | "analog"
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
      } catch { /* weather is decorative */ }
    }
    load()
    const id = setInterval(load, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return weather
}

function AnalogFace({ now }: { now: Date }) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = (size / 2) - 10

  const seconds = now.getSeconds()
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  const handCoords = (angle: number, length: number) => {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) }
  }

  const hrAngle = (hours / 12) * 360
  const minAngle = (minutes / 60) * 360
  const secAngle = (seconds / 60) * 360

  const hr = handCoords(hrAngle, r * 0.55)
  const mn = handCoords(minAngle, r * 0.8)
  const sc = handCoords(secAngle, r * 0.88)

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360
    const rad = (angle - 90) * (Math.PI / 180)
    const inner = r * 0.88
    const outer = r
    return {
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="white" strokeWidth="2" opacity="0.7" />
      ))}
      <line x1={cx} y1={cy} x2={hr.x} y2={hr.y} stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mn.x} y2={mn.y} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={sc.x} y2={sc.y} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill="white" />
    </svg>
  )
}

export function ClockOverlay({ clockStyle }: ClockOverlayProps) {
  const now = useClock()
  const weather = useWeather()

  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 || 12
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10000 }}>
      <div className="bg-black/50 rounded-3xl px-10 py-6 flex flex-col items-center gap-2 backdrop-blur-sm">
        {clockStyle === "analog" ? (
          <AnalogFace now={now} />
        ) : (
          <>
            <div className="text-white font-thin leading-none" style={{ fontSize: 120 }}>
              {displayHour}:{minutes}
              <span className="text-4xl ml-3 align-middle font-light">{ampm}</span>
            </div>
            <p className="text-white/70 text-2xl font-light">{dateStr}</p>
            {weather && (
              <p className="text-white/60 text-xl">
                {weather.icon} {Math.round(weather.current)}°
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
