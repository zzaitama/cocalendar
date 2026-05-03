"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { CountdownsSection } from "@/components/CountdownsSection"
import { todayRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; event: CalendarEvent }

interface TodayViewProps {
  initialEvents: CalendarEvent[]
  targetDate?: string
}

export function TodayView({ initialEvents, targetDate }: TodayViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(Date.now())
  const [tick, setTick] = useState<number>(Date.now())
  const [modal, setModal] = useState<ModalState | null>(null)

  const isViewingToday = !targetDate

  const fetchNow = useCallback(async () => {
    try {
      const date = targetDate ? new Date(targetDate + "T12:00:00") : undefined
      const { start, end } = todayRange(date)
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
      // lastFetchedAt stays stale; indicator appears after 2 minutes
    }
  }, [targetDate])

  useEffect(() => {
    const interval = setInterval(fetchNow, 30_000)
    return () => clearInterval(interval)
  }, [fetchNow])

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const stale = tick - lastFetchedAt > 120_000
  const now = new Date(tick)

  const allDay = events.filter(e => e.isAllDay)
  const timed = events
    .filter(e => !e.isAllDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const nowEvents = isViewingToday
    ? timed.filter(e => new Date(e.start) <= now && now < new Date(e.end))
    : []
  const nextUp = isViewingToday
    ? (timed.find(e => new Date(e.start) > now) ?? null)
    : null

  const shownIds = new Set([...nowEvents.map(e => e.id), ...(nextUp ? [nextUp.id] : [])])
  const remaining = timed.filter(e => !shownIds.has(e.id))

  const morning = remaining.filter(e => new Date(e.start).getHours() < 12)
  const afternoon = remaining.filter(e => {
    const h = new Date(e.start).getHours()
    return h >= 12 && h < 17
  })
  const evening = remaining.filter(e => new Date(e.start).getHours() >= 17)

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto">
        {!isViewingToday && (
          <p className="text-gray-500 dark:text-gray-500 text-lg uppercase tracking-widest px-8 pt-4 shrink-0">
            {format(new Date(targetDate! + "T12:00:00"), "EEEE, MMMM d")}
          </p>
        )}
        <p className={`text-right text-sm px-8 pt-2 shrink-0 ${stale ? "text-amber-500" : "text-gray-500 dark:text-gray-600"}`}>
          {stale ? "Sync stale" : `Synced ${format(new Date(lastFetchedAt), "h:mm a")}`}
        </p>

        <div className="px-6 pb-28 pt-4 flex flex-col gap-6">
          {events.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-3xl text-gray-500 dark:text-gray-500">Nothing today — enjoy the day!</p>
            </div>
          ) : (
            <>
              {allDay.length > 0 && (
                <section>
                  <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-3">All Day</p>
                  <div className="flex flex-col gap-3">
                    {allDay.map(e => (
                      <EventCard key={e.id} event={e} onClick={() => setModal({ mode: "edit", event: e })} />
                    ))}
                  </div>
                </section>
              )}

              {isViewingToday && (
                <section>
                  <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-3">Now</p>
                  {nowEvents.length === 0 ? (
                    <p className="text-xl text-gray-500 dark:text-gray-600">Nothing right now</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {nowEvents.map(e => (
                        <div key={e.id} className="ring-2 ring-gray-300 dark:ring-white/20 rounded-xl">
                          <EventCard event={e} featured onClick={() => setModal({ mode: "edit", event: e })} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {isViewingToday && (
                <section>
                  <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-3">Next Up</p>
                  {nextUp === null ? (
                    <p className="text-xl text-gray-500 dark:text-gray-600">No more events today</p>
                  ) : (
                    <EventCard event={nextUp} onClick={() => setModal({ mode: "edit", event: nextUp })} />
                  )}
                </section>
              )}

              {[
                { label: "Morning", items: morning },
                { label: "Afternoon", items: afternoon },
                { label: "Evening", items: evening },
              ].map(({ label, items }) =>
                items.length > 0 ? (
                  <section key={label}>
                    <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-3">{label}</p>
                    <div className="flex flex-col gap-3">
                      {items.map(e => (
                        <EventCard key={e.id} event={e} onClick={() => setModal({ mode: "edit", event: e })} />
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </>
          )}

          {isViewingToday && <CountdownsSection />}
        </div>
      </div>

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
