"use client"

import { useState, useEffect, useCallback } from "react"
import { differenceInCalendarDays, parseISO } from "date-fns"

interface Countdown {
  id: string
  title: string
  emoji: string
  date: string
}

const EMOJI_OPTIONS = ["🎉","🏖️","✈️","🎂","🎄","🏫","⚽","🎮","🎃","❤️","🌟","🏕️","🎵","🏆","🎁"]

function AddCountdownModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (title: string, emoji: string, date: string) => void
}) {
  const [title, setTitle] = useState("")
  const [emoji, setEmoji] = useState("🎉")
  const [date, setDate] = useState("")

  function handleSave() {
    if (!title.trim() || !date) return
    onAdd(title.trim(), emoji, date)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-gray-950 dark:text-white text-2xl font-bold">Add Countdown</p>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xl">✕</button>
        </div>

        <input
          autoFocus
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white rounded-xl px-4 py-4 text-xl outline-none"
          placeholder="Event name..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose() }}
        />

        <div>
          <p className="text-gray-500 text-sm mb-3">Pick an emoji</p>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-colors ${emoji === e ? "bg-gray-950 dark:bg-white" : "bg-gray-100 dark:bg-gray-800"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Date</p>
          <input
            type="date"
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white rounded-xl px-4 py-4 text-xl outline-none"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xl font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || !date} className="flex-1 py-4 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xl font-semibold disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  )
}

export function CountdownsSection() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/countdowns")
      if (res.ok) setCountdowns(await res.json())
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(title: string, emoji: string, date: string) {
    await fetch("/api/countdowns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emoji, date }),
    })
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/countdowns/${id}`, { method: "DELETE" })
    load()
  }

  // Sort by soonest, filter out past events (show day-of as 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = countdowns
    .map(c => ({ ...c, days: differenceInCalendarDays(parseISO(c.date), today) }))
    .filter(c => c.days >= 0)
    .sort((a, b) => a.days - b.days)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500">Countdowns</p>
        <button
          onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Add countdown"
        >
          +
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-xl text-gray-500 dark:text-gray-600">No countdowns yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map(c => (
            <div key={c.id} className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-4">
              <span className="text-3xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-950 dark:text-white text-xl font-semibold truncate">{c.title}</p>
                <p className="text-gray-500 text-sm">
                  {c.days === 0 ? "Today! 🎊" : c.days === 1 ? "Tomorrow" : `${c.days} days away`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-4xl font-bold tabular-nums text-gray-950 dark:text-white">{c.days}</p>
                <p className="text-gray-500 text-xs">{c.days === 1 ? "day" : "days"}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Delete countdown"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddCountdownModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </section>
  )
}
