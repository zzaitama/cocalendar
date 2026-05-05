"use client"

import { useEffect, useRef } from "react"

interface CardState {
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
  speedMultiplier: number
}

export function BouncingCard({ card, speedMultiplier }: BouncingCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: card.x, y: card.y })
  const vel = useRef({ vx: card.vx, vy: card.vy })
  const frameRef = useRef<number>(0)
  const prevMultiplier = useRef(speedMultiplier)

  useEffect(() => {
    if (prevMultiplier.current !== speedMultiplier) {
      const ratio = speedMultiplier / prevMultiplier.current
      vel.current.vx *= ratio
      vel.current.vy *= ratio
      prevMultiplier.current = speedMultiplier
    }
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/screensaver-photos/${card.photo}`}
        alt=""
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  )
}
