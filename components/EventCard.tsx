"use client"

import type { CalendarEvent } from "@/types"
import { useFamily } from "@/context/FamilyContext"
import { formatEventTime, formatTime } from "@/lib/utils"
import { useAvatar } from "@/context/AvatarContext"

interface EventCardProps {
  event: CalendarEvent
  featured?: boolean
  compact?: boolean
  onClick?: () => void
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function EventCard({ event, featured = false, compact = false, onClick }: EventCardProps) {
  const { members } = useFamily()
  const user = members.find((u) => u.gcalColorId === event.colorId)
  const familyMember = members.find(u => u.id === "family")
  const color = user?.color ?? familyMember?.color ?? "#64748b"
  const { getAvatar } = useAvatar()
  const emoji = user ? getAvatar(user.id) : ""
  const initial = user?.name?.[0]?.toUpperCase() ?? "?"
  const rgb = hexToRgb(color)

  const cardStyle: React.CSSProperties = {
    backgroundColor: `rgba(${rgb}, 0.12)`,
    borderLeft: `4px solid ${color}`,
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`flex overflow-hidden rounded-2xl relative transition-all ${
        featured ? "min-h-28" : "min-h-14"
      } ${onClick ? "cursor-pointer hover:brightness-95 active:brightness-90" : ""}`}
      style={cardStyle}
    >
      <div className="flex flex-col justify-center px-3 py-2.5 gap-0.5 min-w-0 flex-1">
        <p className={`font-bold text-gray-900 dark:text-white leading-tight truncate ${
          featured ? "text-4xl" : compact ? "text-lg" : "text-2xl"
        }`}>
          {event.title}
        </p>
        {compact && !event.isAllDay && (
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-tight truncate font-medium">
            {formatTime(event.start)}
          </p>
        )}
        {!compact && (
          <p className={`text-gray-500 dark:text-gray-400 font-medium ${featured ? "text-2xl" : "text-xl"}`}>
            {formatEventTime(event.start, event.end, event.isAllDay)}
          </p>
        )}
        {!compact && user && (
          <p className="font-semibold text-lg flex items-center gap-1.5 mt-0.5" style={{ color }}>
            {emoji && <span className="text-base leading-none">{emoji}</span>}
            {user.name}
          </p>
        )}
      </div>
      <div
        className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-white dark:bg-gray-900 shrink-0"
        style={{ borderColor: color, color }}
        aria-hidden="true"
      >
        {emoji || initial}
      </div>
    </div>
  )
}
