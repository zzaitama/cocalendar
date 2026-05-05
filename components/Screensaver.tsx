"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { BouncingCard } from "./BouncingCard"
import { ClockOverlay } from "./ClockOverlay"
import type { ScreensaverConfig } from "@/types"

const STORAGE_KEY = "cocalendar-screensaver"
const DEFAULT_CONFIG: ScreensaverConfig = {
  idleTimeout: 5,
  clockStyle: "digital",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
}
const CARD_COUNT = 9
const CYCLE_MS = 3500

function loadConfig(): ScreensaverConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG
  } catch { return DEFAULT_CONFIG }
}

function isQuietHours(cfg: ScreensaverConfig): boolean {
  if (!cfg.quietHoursEnabled) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = cfg.quietHoursStart.split(":").map(Number)
  const [eh, em] = cfg.quietHoursEnd.split(":").map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  return start > end ? cur >= start || cur < end : cur >= start && cur < end
}

function pickPhoto(photos: string[], prevIdx: number): { photo: string; idx: number } {
  if (photos.length === 0) return { photo: "", idx: -1 }
  if (photos.length === 1) return { photo: photos[0], idx: 0 }
  let idx: number
  do { idx = Math.floor(Math.random() * photos.length) } while (idx === prevIdx)
  return { photo: photos[idx], idx }
}

function makeCard(photos: string[], prevIdx: number, W: number, H: number, cellIdx: number) {
  const portrait = Math.random() > 0.5
  const width = 180 + Math.floor(Math.random() * 141)
  const height = portrait ? Math.round(width * (4 / 3)) : Math.round(width * (3 / 4))
  const { photo, idx } = pickPhoto(photos, prevIdx)
  const col = cellIdx % 3
  const row = Math.floor(cellIdx / 3)
  const cellCenterX = (col + 0.5) * (W / 3)
  const cellCenterY = (row + 0.5) * (H / 3)
  const rawX = cellCenterX - width / 2 + (Math.random() * 100 - 50)
  const rawY = cellCenterY - height / 2 + (Math.random() * 100 - 50)
  const angle = Math.random() * 2 * Math.PI
  const speed = 1.2 + Math.random() * 1.3
  return {
    x: Math.min(Math.max(0, rawX), Math.max(0, W - width)),
    y: Math.min(Math.max(0, rawY), Math.max(0, H - height)),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    width,
    height,
    photo,
    photoIdx: idx,
  }
}

interface ScreensaverProps {
  forceShow?: boolean
}

export function Screensaver({ forceShow = false }: ScreensaverProps) {
  const [visible, setVisible] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [cards, setCards] = useState<ReturnType<typeof makeCard>[]>([])
  const [config, setConfig] = useState<ScreensaverConfig>(DEFAULT_CONFIG)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setConfig(loadConfig()) }, [])

  useEffect(() => {
    const onStorage = () => setConfig(loadConfig())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    fetch("/api/screensaver/photos")
      .then(r => r.ok ? r.json() : [])
      .then((files: string[]) => setPhotos(files))
      .catch(() => setPhotos([]))
  }, [])

  const show = useCallback(() => {
    const W = window.innerWidth, H = window.innerHeight
    const initial = Array.from({ length: CARD_COUNT }, (_, i) =>
      makeCard(photos, i === 0 ? -1 : i - 1, W, H, i)
    )
    setCards(initial)
    setVisible(true)
  }, [photos])

  const hide = useCallback(() => {
    setVisible(false)
    if (cycleTimer.current) clearInterval(cycleTimer.current)
  }, [])

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(show, (config.idleTimeout || 5) * 60 * 1000)
  }, [config.idleTimeout, show])

  useEffect(() => {
    if (forceShow) { show(); return }
    const events = ["mousemove", "mousedown", "touchstart", "keydown"]
    const onActivity = () => { if (visible) hide(); resetIdle() }
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }))
    resetIdle()
    return () => {
      events.forEach(e => document.removeEventListener(e, onActivity))
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [forceShow, visible, show, hide, resetIdle])

  useEffect(() => {
    if (!visible || photos.length === 0) return
    cycleTimer.current = setInterval(() => {
      setCards(prev => prev.map(card => {
        const { photo, idx } = pickPhoto(photos, card.photoIdx)
        return { ...card, photo, photoIdx: idx }
      }))
    }, CYCLE_MS)
    return () => { if (cycleTimer.current) clearInterval(cycleTimer.current) }
  }, [visible, photos])

  if (!visible) return null

  const quiet = isQuietHours(config)
  const speedMultiplier = quiet ? 0.4 : 1

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ zIndex: 9999 }}
      onClick={hide}
      onTouchStart={hide}
    >
      {cards.map((card, i) => (
        <BouncingCard key={i} card={card} cardIndex={i} speedMultiplier={speedMultiplier} />
      ))}
      <ClockOverlay clockStyle={config.clockStyle} />
    </div>
  )
}
