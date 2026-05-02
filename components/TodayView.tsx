"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { EventCard } from "@/components/EventCard"
import { EventModal } from "@/components/EventModal"
import { AddButton } from "@/components/AddButton"
import { TimeGrid } from "@/components/TimeGrid"
import { PersonFilter } from "@/components/PersonFilter"
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
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])

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
      // lastFetchedAt stays stale; indicator appears after 90s
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

  const stale = tick - lastFetchedAt > 90_000

  async function handleEventDrop(event: CalendarEvent, newStart: string, newEnd: string) {
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: event.title, start: newStart, end: newEnd, colorId: event.colorId }),
    })
    if (res.ok) await fetchNow()
  }

  const filteredEvents = selectedPeople.length === 0
    ? events
    : events.filter(e => selectedPeople.includes(e.colorId))
  const allDay = filteredEvents.filter(e => e.isAllDay)

  return (
    <>
      {!isViewingToday && (
        <p className="text-gray-500 text-lg uppercase tracking-widest px-8 pt-4 shrink-0">
          {format(new Date(targetDate! + "T12:00:00"), "EEEE, MMMM d")}
        </p>
      )}
      <PersonFilter selected={selectedPeople} onChange={setSelectedPeople} />
      {filteredEvents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-3xl text-gray-500">Nothing that day — enjoy the day!</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {stale && (
            <p className="text-right text-gray-600 text-sm px-8 pt-2 shrink-0">
              Sync paused — check connection
            </p>
          )}
          {allDay.length > 0 && (
            <div className="px-8 py-4 shrink-0">
              <p className="text-gray-500 text-lg uppercase tracking-widest mb-3">All Day</p>
              <div className="flex flex-col gap-3">
                {allDay.map(e => (
                  <EventCard key={e.id} event={e} onClick={() => setModal({ mode: "edit", event: e })} />
                ))}
              </div>
            </div>
          )}
          <TimeGrid
            events={filteredEvents}
            isToday={isViewingToday}
            onEventDrop={handleEventDrop}
            onEventClick={e => setModal({ mode: "edit", event: e })}
          />
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
