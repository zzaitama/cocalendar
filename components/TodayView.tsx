"use client"

import { useState, useEffect, useCallback } from "react"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { todayRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface TodayViewProps {
  initialEvents: CalendarEvent[]
}

export function TodayView({ initialEvents }: TodayViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)

  const fetchNow = useCallback(async () => {
    try {
      const { start, end } = todayRange()
      const res = await fetch(`/api/events?start=${start}&end=${end}`)
      if (res.status === 401) {
        window.location.href = "/api/auth/signin"
        return
      }
      if (!res.ok) throw new Error("fetch failed")
      const data: CalendarEvent[] = await res.json()
      setEvents(data)
      setLastFetchedAt(Date.now())
    } catch {
      // lastFetchedAt stays stale; indicator appears after 90s
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchNow, 30_000)
    return () => clearInterval(interval)
  }, [fetchNow])

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const stale = tick - lastFetchedAt > 90_000

  const now = new Date()
  const allDay = events.filter((e) => e.isAllDay)
  const upcoming = events.filter((e) => !e.isAllDay && new Date(e.end) > now)
  const nextUp = upcoming[0] ?? null
  const later = upcoming.slice(1)
  const hasAnything = allDay.length > 0 || upcoming.length > 0

  return (
    <>
      {!hasAnything ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-3xl text-gray-500">Nothing today — enjoy the day!</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 px-8 pb-32">
          {stale && (
            <p className="text-right text-gray-600 text-sm pt-2">
              Sync paused — check connection
            </p>
          )}

          {allDay.length > 0 && (
            <section>
              <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">All Day</p>
              <div className="flex flex-col gap-3">
                {allDay.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onClick={() => setModal({ mode: "edit", event: e })}
                  />
                ))}
              </div>
            </section>
          )}

          {nextUp && (
            <section>
              <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">Next Up</p>
              <EventCard
                event={nextUp}
                featured
                onClick={() => setModal({ mode: "edit", event: nextUp })}
              />
            </section>
          )}

          {later.length > 0 && (
            <section>
              <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">Later Today</p>
              <div className="flex flex-col gap-3">
                {later.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onClick={() => setModal({ mode: "edit", event: e })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AddButton onClick={() => setModal({ mode: "create" })} />

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          onClose={() => setModal(null)}
          onSaved={fetchNow}
        />
      )}
    </>
  )
}
