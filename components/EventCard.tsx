import type { CalendarEvent } from "@/types"
import { USERS } from "@/lib/config"
import { formatEventTime } from "@/lib/utils"

interface EventCardProps {
  event: CalendarEvent
  featured?: boolean
  compact?: boolean
  onClick?: () => void
}

export function EventCard({ event, featured = false, compact = false, onClick }: EventCardProps) {
  const user = USERS.find((u) => u.gcalColorId === event.colorId)
  const color = user?.color ?? "#64748b"

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`flex overflow-hidden rounded-xl bg-gray-800 ${
        featured ? "min-h-28" : compact ? "min-h-10" : "min-h-14"
      } ${onClick ? "cursor-pointer hover:bg-gray-750 active:bg-gray-700" : ""}`}
      style={{ "--person-color": color } as React.CSSProperties}
    >
      <div className={`flex-shrink-0 bg-[var(--person-color)] ${compact ? "w-1.5" : "w-2"}`} />
      <div className="flex flex-col justify-center px-3 py-2 gap-0.5 min-w-0">
        <p
          className={`font-semibold text-white leading-tight truncate ${
            featured ? "text-4xl" : compact ? "text-base" : "text-2xl"
          }`}
        >
          {event.title}
        </p>
        {!compact && (
          <p className={`text-gray-400 ${featured ? "text-2xl" : "text-xl"}`}>
            {formatEventTime(event.start, event.end, event.isAllDay)}
          </p>
        )}
        {!compact && user && (
          <p
            className="font-medium text-lg"
            style={{ color }}
          >
            {user.name}
          </p>
        )}
      </div>
    </div>
  )
}
