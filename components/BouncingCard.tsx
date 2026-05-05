"use client"

import { useEffect, useRef, useState } from "react"

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
]

export interface CardState {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  photo: string
}

interface BouncingCardProps {
  card: CardState
  cardIndex: number
  speedMultiplier: number
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function BouncingCard({ card, cardIndex, speedMultiplier }: BouncingCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: card.x, y: card.y })
  const vel = useRef({ vx: card.vx, vy: card.vy })
  const frameRef = useRef<number>(0)
  const prevMultiplier = useRef(speedMultiplier)

  // Two-slot crossfade: one slot always shows current photo, other preloads next
  const [slots, setSlots] = useState<[string, string]>([card.photo, ""])
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0)
  const activeRef = useRef<0 | 1>(0)
  const displayedRef = useRef(card.photo)

  useEffect(() => {
    if (!card.photo || card.photo === displayedRef.current) return
    displayedRef.current = card.photo
    const next = (activeRef.current === 0 ? 1 : 0) as 0 | 1
    setSlots(prev => {
      const s: [string, string] = [prev[0], prev[1]]
      s[next] = card.photo
      return s
    })
    const t = setTimeout(() => {
      activeRef.current = next
      setActiveSlot(next)
    }, 50)
    return () => clearTimeout(t)
  }, [card.photo])

  useEffect(() => {
    if (prevMultiplier.current === speedMultiplier) return
    const ratio = speedMultiplier / prevMultiplier.current
    vel.current.vx *= ratio
    vel.current.vy *= ratio
    prevMultiplier.current = speedMultiplier
  }, [speedMultiplier])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const animate = () => {
      const { x, y } = pos.current
      let { vx, vy } = vel.current
      const W = window.innerWidth
      const H = window.innerHeight
      let nx = x + vx
      let ny = y + vy
      if (nx <= 0) { nx = 0; vx = Math.abs(vx) }
      if (nx + card.width >= W) { nx = W - card.width; vx = -Math.abs(vx) }
      if (ny <= 0) { ny = 0; vy = Math.abs(vy) }
      if (ny + card.height >= H) { ny = H - card.height; vy = -Math.abs(vy) }
      pos.current = { x: nx, y: ny }
      vel.current = { vx, vy }
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
      frameRef.current = requestAnimationFrame(animate)
    }
    el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [card.width, card.height])

  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 rounded-lg overflow-hidden border-[3px] border-white will-change-transform"
      style={{ width: card.width, height: card.height }}
    >
      {!card.photo ? (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ background: GRADIENTS[cardIndex % GRADIENTS.length] }}
        >
          <CameraIcon />
          <p className="text-white text-xs text-center px-2 opacity-80">Add photos in Settings</p>
        </div>
      ) : (
        slots.map((src, i) => src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`/screensaver-photos/${src}`}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[600ms] ease-in-out ${activeSlot === i ? "opacity-100" : "opacity-0"}`}
            draggable={false}
          />
        ) : null)
      )}
    </div>
  )
}
