'use client'

import { useKioskData, type Chore } from './useKioskData'
import { USERS } from '@/lib/config'
import type { CalendarEvent } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUserColor(colorId: string): string {
  return USERS.find(u => u.gcalColorId === colorId)?.color ?? '#6b7280'
}

function formatDate(d: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatClock(d: Date): string {
  const h = d.getHours(), m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')}${h >= 12 ? 'p' : 'a'}`
}

function formatTimeFull(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatTimeUntil(iso: string, now: Date): string {
  const diffMs = new Date(iso).getTime() - now.getTime()
  if (diffMs <= 0) return 'today'
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

function getNextEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  return (
    events
      .filter(e => !e.isAllDay && new Date(e.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null
  )
}

function getDisplayEvents(events: CalendarEvent[], now: Date): CalendarEvent[] {
  return events
    .filter(e => e.isAllDay || new Date(e.end) > now)
    .sort((a, b) => {
      if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
}

function sortChores(chores: Chore[]): Chore[] {
  return [...chores].sort((a, b) => {
    if (a.assignee !== b.assignee) return a.assignee.localeCompare(b.assignee)
    const aDone = a.completedAt !== null, bDone = b.completedAt !== null
    if (aDone !== bDone) return aDone ? 1 : -1
    return a.title.localeCompare(b.title)
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TopBar({ now }: { now: Date }) {
  return (
    <div className="h-[80px] flex items-center justify-between px-12 border-b border-white/10 shrink-0">
      <span className="text-[36px] font-bold tracking-wide">{formatDate(now)}</span>
      <span className="text-[36px] font-bold tabular-nums">{formatClock(now)}</span>
    </div>
  )
}

function HeroPanel({ event, now }: { event: CalendarEvent | null; now: Date }) {
  return (
    <div className="px-12 py-6 shrink-0 border-b border-white/[0.08]">
      <div
        className="rounded-2xl px-10 py-7 min-h-[168px]"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <div className="text-[18px] font-semibold tracking-[0.2em] uppercase mb-3 text-white/40">
          NEXT UP
        </div>
        {event ? (
          <>
            <div className="flex items-baseline justify-between gap-8">
              <span
                className="text-[72px] font-bold leading-tight truncate"
                style={{ color: getUserColor(event.colorId) }}
              >
                {event.title}
              </span>
              <span className="text-[48px] font-medium shrink-0 text-white/85">
                {formatTimeFull(event.start)}
              </span>
            </div>
            <div className="text-[28px] font-light text-white/50 mt-1">
              {formatTimeUntil(event.start, now)}
            </div>
          </>
        ) : (
          <div className="text-[42px] font-light text-white/30 pt-2">
            Nothing else today — enjoy your evening
          </div>
        )}
      </div>
    </div>
  )
}

function EventsList({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="px-12 py-8 overflow-hidden flex flex-col border-r border-white/10">
      <div className="text-[18px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
        TODAY&apos;S EVENTS
      </div>
      <div className="border-b border-white/10 mb-5" />
      {events.length === 0 ? (
        <div className="text-[28px] font-light text-white/30">Nothing on the schedule</div>
      ) : (
        <div className="flex flex-col gap-4 overflow-hidden">
          {events.map(event => (
            <div key={event.id} className="flex items-center gap-5 min-w-0">
              <span className="text-[32px] text-white/55 tabular-nums shrink-0 w-[90px]">
                {event.isAllDay ? 'all day' : formatTimeShort(event.start)}
              </span>
              <span className="text-[32px] text-white truncate flex-1">{event.title}</span>
              <span
                className="shrink-0 rounded-full w-4 h-4"
                style={{ backgroundColor: getUserColor(event.colorId) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChoresList({
  chores,
  doneCount,
  onToggle,
}: {
  chores: Chore[]
  doneCount: number
  onToggle: (id: string, completed: boolean) => Promise<void>
}) {
  return (
    <div className="px-12 py-8 overflow-hidden flex flex-col">
      <div className="text-[18px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
        CHORES
      </div>
      <div className="border-b border-white/10 mb-5" />
      {chores.length === 0 ? (
        <div className="text-[28px] font-light text-white/30">No chores today</div>
      ) : (
        <>
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {chores.map(chore => {
              const done = chore.completedAt !== null
              return (
                <button
                  key={chore.id}
                  onClick={() => onToggle(chore.id, !done)}
                  className="flex items-center gap-4 text-left w-full rounded-xl px-3 py-2 min-h-[60px] bg-transparent border-0 transition-opacity active:opacity-60"
                  style={{
                    fontSize: '30px',
                    color: done ? 'rgba(104,211,145,0.85)' : '#f8f8f8',
                  }}
                >
                  <span className="shrink-0 w-8 text-[28px] text-center">
                    {done ? '✅' : '⬜'}
                  </span>
                  <span className="truncate">
                    {chore.assignee} — {chore.title}
                  </span>
                </button>
              )
            })}
          </div>
          <div>
            <div className="border-t border-white/10 mt-4 mb-3" />
            <div className="text-[26px] text-white/40">
              {doneCount} of {chores.length} done today
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function KioskClient() {
  const { events, chores, now, lastFetched, isStale, toggleChore } = useKioskData()

  const nextEvent = getNextEvent(events, now)
  const displayEvents = getDisplayEvents(events, now)
  const sortedChores = sortChores(chores)
  const doneCount = chores.filter(c => c.completedAt !== null).length

  return (
    <div className="h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      <TopBar now={now} />
      <HeroPanel event={nextEvent} now={now} />
      <div className="grid grid-cols-[1fr_1.2fr] flex-1 overflow-hidden">
        <EventsList events={displayEvents} />
        <ChoresList chores={sortedChores} doneCount={doneCount} onToggle={toggleChore} />
      </div>
      {isStale && lastFetched && (
        <div className="absolute bottom-3 right-6 text-[18px] text-white/20">
          Last updated {Math.floor((now.getTime() - lastFetched.getTime()) / 60000)}min ago
        </div>
      )}
    </div>
  )
}
