'use client'

import { useState, useEffect } from 'react'
import { useKioskData, type Chore } from './useKioskData'
import { USERS } from '@/lib/config'
import { AVATARS } from '@/lib/avatars'
import type { CalendarEvent } from '@/types'
import type { WeatherData } from '@/lib/weather'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserColor(colorId: string): string {
  return USERS.find(u => u.gcalColorId === colorId)?.color ?? '#6b7280'
}

function getUserName(colorId: string): string {
  return USERS.find(u => u.gcalColorId === colorId)?.name ?? ''
}

function getUserAvatar(colorId: string): string {
  if (typeof window === 'undefined') return ''
  try {
    const cached = localStorage.getItem('cocalendar-avatars')
    if (!cached) return ''
    const { avatars, options } = JSON.parse(cached) as {
      avatars: Record<string, string>
      options: { id: string; emoji: string }[]
    }
    const user = USERS.find(u => u.gcalColorId === colorId)
    if (!user) return ''
    const avatarId = avatars[user.id]
    if (!avatarId) return ''
    return options?.find(a => a.id === avatarId)?.emoji ?? AVATARS.find(a => a.id === avatarId)?.emoji ?? ''
  } catch { return '' }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatClock(d: Date): string {
  const h = d.getHours(), m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')}`
}

function formatAmPm(d: Date): string {
  return d.getHours() >= 12 ? 'PM' : 'AM'
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatCountdown(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime()
  if (diff <= 0) return 'now'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (rem === 0) return `in ${hrs}h`
  return `in ${hrs}h ${rem}m`
}

function getNextEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  return events
    .filter(e => !e.isAllDay && new Date(e.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null
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
    const aDone = a.completedAt !== null
    const bDone = b.completedAt !== null
    if (aDone !== bDone) return aDone ? 1 : -1
    return a.assignee.localeCompare(b.assignee)
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarBadge({ colorId, size = 40 }: { colorId: string; size?: number }) {
  const color = getUserColor(colorId)
  const emoji = getUserAvatar(colorId)
  return (
    <span
      className="rounded-full shrink-0 inline-flex items-center justify-center border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        backgroundColor: color + '22',
        fontSize: size * 0.52,
      }}
    >
      {emoji || getUserName(colorId)[0] || '?'}
    </span>
  )
}

// ── Clock + Date + Weather ──
function ClockSection({ now, weather }: { now: Date; weather: WeatherData | null }) {
  return (
    <div className="px-10 pt-10 pb-6 shrink-0">
      {/* Big clock */}
      <div className="flex items-end gap-3 leading-none mb-1">
        <span className="font-black tabular-nums" style={{ fontSize: 120, lineHeight: 1 }}>
          {formatClock(now)}
        </span>
        <span className="font-light text-white/40 pb-4" style={{ fontSize: 40 }}>
          {formatAmPm(now)}
        </span>
      </div>

      {/* Date + weather row */}
      <div className="flex items-center justify-between">
        <span className="text-white/60 font-semibold" style={{ fontSize: 28 }}>
          {formatDate(now)}
        </span>
        {weather && (
          <div className="flex items-center gap-3 text-white/60" style={{ fontSize: 28 }}>
            <span>{weather.icon}</span>
            <span className="font-semibold tabular-nums">{weather.current}°</span>
            <div className="flex gap-3 text-white/35 font-medium" style={{ fontSize: 20 }}>
              <span>☀️ {weather.morning.hi}°</span>
              <span>🌤 {weather.afternoon.hi}°</span>
              <span>🌙 {weather.evening.hi}°</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Divider ──
function Divider() {
  return <div className="mx-10 border-t border-white/[0.08] shrink-0" />
}

// ── Next Up hero ──
function NextUpSection({ event, now }: { event: CalendarEvent | null; now: Date }) {
  return (
    <div className="px-10 py-6 shrink-0">
      <p className="text-white/35 text-[16px] font-bold tracking-[0.2em] uppercase mb-4">Next Up</p>
      {event ? (
        <div
          className="rounded-3xl px-8 py-6"
          style={{ backgroundColor: getUserColor(event.colorId) + '18', borderLeft: `4px solid ${getUserColor(event.colorId)}` }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <AvatarBadge colorId={event.colorId} size={52} />
              <span
                className="font-bold leading-tight truncate"
                style={{ fontSize: 48, color: getUserColor(event.colorId) }}
              >
                {event.title}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-white/90 font-bold" style={{ fontSize: 36 }}>
                {formatTimeShort(event.start)}
              </p>
              <p className="text-white/40 font-medium" style={{ fontSize: 22 }}>
                {formatCountdown(event.start, now)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl px-8 py-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <p className="text-white/25 font-light" style={{ fontSize: 36 }}>
            Nothing else today — enjoy your evening ✨
          </p>
        </div>
      )}
    </div>
  )
}

// ── Today's Events ──
function EventsSection({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="px-10 py-6 shrink-0">
      <p className="text-white/35 text-[16px] font-bold tracking-[0.2em] uppercase mb-4">
        Today&apos;s Events
      </p>
      {events.length === 0 ? (
        <p className="text-white/25 font-light" style={{ fontSize: 28 }}>Nothing scheduled</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(event => {
            const color = getUserColor(event.colorId)
            const isPast = !event.isAllDay && new Date(event.end) < new Date()
            return (
              <div
                key={event.id}
                className="flex items-center gap-5 rounded-2xl px-5 py-4 transition-opacity"
                style={{
                  backgroundColor: color + '12',
                  opacity: isPast ? 0.4 : 1,
                }}
              >
                <span
                  className="tabular-nums shrink-0 font-semibold text-white/50"
                  style={{ fontSize: 26, width: 100 }}
                >
                  {event.isAllDay ? 'All day' : formatTimeShort(event.start)}
                </span>
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-white font-semibold truncate flex-1" style={{ fontSize: 30 }}>
                  {event.title}
                </span>
                <AvatarBadge colorId={event.colorId} size={36} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Chores ──
function ChoresSection({
  chores,
  doneCount,
  onToggle,
}: {
  chores: Chore[]
  doneCount: number
  onToggle: (id: string, completed: boolean) => Promise<void>
}) {
  return (
    <div className="px-10 py-6 flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/35 text-[16px] font-bold tracking-[0.2em] uppercase">Chores</p>
        {chores.length > 0 && (
          <p className="text-white/25 font-medium" style={{ fontSize: 18 }}>
            {doneCount}/{chores.length} done
          </p>
        )}
      </div>
      {chores.length === 0 ? (
        <p className="text-white/25 font-light" style={{ fontSize: 28 }}>No chores today 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {chores.map(chore => {
            const done = chore.completedAt !== null
            const user = USERS.find(u => u.name === chore.assignee)
            const color = user?.color ?? '#6b7280'
            return (
              <button
                key={chore.id}
                onClick={() => onToggle(chore.id, !done)}
                className="flex items-center gap-5 w-full text-left rounded-2xl px-5 py-4 transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: done ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
                  minHeight: 72,
                }}
              >
                {/* Checkbox */}
                <div
                  className="shrink-0 rounded-xl flex items-center justify-center border-2 transition-all"
                  style={{
                    width: 44,
                    height: 44,
                    borderColor: done ? '#4ade80' : 'rgba(255,255,255,0.2)',
                    backgroundColor: done ? '#4ade8022' : 'transparent',
                    fontSize: 24,
                  }}
                >
                  {done ? '✓' : ''}
                </div>

                {/* Assignee dot */}
                <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />

                {/* Title + assignee */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate transition-all"
                    style={{
                      fontSize: 28,
                      color: done ? 'rgba(255,255,255,0.3)' : '#f8f8f8',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {chore.title}
                  </p>
                  <p className="font-medium" style={{ fontSize: 18, color: color + 'aa' }}>
                    {chore.assignee}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KioskClient() {
  const { events, chores, now, lastFetched, isStale, toggleChore } = useKioskData()
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) setWeather(await res.json())
      } catch { /* decorative */ }
    }
    load()
    const id = setInterval(load, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const nextEvent = getNextEvent(events, now)
  const displayEvents = getDisplayEvents(events, now)
  const sortedChores = sortChores(chores.filter(c => c.assignee !== 'Unassigned'))
  const doneCount = chores.filter(c => c.completedAt !== null).length

  return (
    <div
      className="h-screen bg-[#0a0a0a] text-white overflow-y-auto overflow-x-hidden flex flex-col"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Clock + date + weather */}
      <ClockSection now={now} weather={weather} />

      <Divider />

      {/* Next Up */}
      <NextUpSection event={nextEvent} now={now} />

      <Divider />

      {/* Today's Events */}
      <EventsSection events={displayEvents} />

      <Divider />

      {/* Chores */}
      <ChoresSection
        chores={sortedChores}
        doneCount={doneCount}
        onToggle={toggleChore}
      />

      {/* Stale indicator */}
      {isStale && lastFetched && (
        <div className="px-10 pb-6 shrink-0">
          <p className="text-white/20 text-center" style={{ fontSize: 16 }}>
            Last updated {Math.floor((now.getTime() - lastFetched.getTime()) / 60000)} min ago
          </p>
        </div>
      )}
    </div>
  )
}
