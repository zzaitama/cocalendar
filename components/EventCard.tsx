import type { CalendarEvent } from "@/types"
import { USERS } from "@/lib/config"
import { formatEventTime } from "@/lib/utils"

interface EventCardProps {
  event: CalendarEvent
  featured?: boolean
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const user = USERS.find((u) => u.gcalColorId === event.colorId)
  const color = user?.color ?? "#64748b"

  return (
    <div
      className={`flex overflow-hidden rounded-xl bg-gray-800 ${featured ? "min-h-28" : "min-h-14"}`}
      style={{ "--person-color": color } as React.CSSProperties}
    >
      <div className="w-2 flex-shrink-0 bg-[var(--person-color)]" />
      <div className="flex flex-col justify-center px-5 py-4 gap-1 min-w-0">
        <p
          className={`font-semibold text-white leading-tight truncate ${
            featured ? "text-4xl" : "text-2xl"
          }`}
        >
          {event.title}
        </p>
        <p className={`text-gray-400 ${featured ? "text-2xl" : "text-lg"}`}>
          {formatEventTime(event.start, event.end, event.isAllDay)}
        </p>
        {user && (
          <p
            className={`font-medium ${featured ? "text-lg" : "text-sm"}`}
            style={{ color }}
          >
            {user.name}
          </p>
        )}
      </div>
    </div>
  )
}
