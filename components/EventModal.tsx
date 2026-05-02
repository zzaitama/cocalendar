"use client"

import { useState, useEffect, useRef } from "react"
import { format, addHours, startOfHour } from "date-fns"
import { USERS } from "@/lib/config"
import type { CalendarEvent } from "@/types"

interface EventModalProps {
  mode: "create" | "edit"
  event?: CalendarEvent
  defaultDate?: string
  onClose: () => void
  onSaved: () => void
}

export function EventModal({ mode, event, defaultDate, onClose, onSaved }: EventModalProps) {
  const nextHour = startOfHour(addHours(new Date(), 1))

  const [title, setTitle] = useState(event?.title ?? "")
  const [date, setDate] = useState(
    event ? format(new Date(event.start), "yyyy-MM-dd") : (defaultDate ?? format(new Date(), "yyyy-MM-dd"))
  )
  const [startTime, setStartTime] = useState(
    event && !event.isAllDay ? format(new Date(event.start), "HH:mm") : format(nextHour, "HH:mm")
  )
  const [endTime, setEndTime] = useState(
    event && !event.isAllDay
      ? format(new Date(event.end), "HH:mm")
      : format(addHours(nextHour, 1), "HH:mm")
  )
  const [colorId, setColorId] = useState(event?.colorId ?? USERS[0].gcalColorId)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const start = new Date(`${date}T${startTime}`).toISOString()
      const end = new Date(`${date}T${endTime}`).toISOString()
      const body = JSON.stringify({ title: title.trim(), start, end, colorId })

      if (mode === "create") {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        })
      } else {
        await fetch(`/api/events/${event!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        })
      }
      onSaved()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      await fetch(`/api/events/${event!.id}`, { method: "DELETE" })
      onSaved()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full sm:max-w-lg bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-white">
          {mode === "create" ? "New Event" : "Edit Event"}
        </h2>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
          placeholder="Event title"
          className="w-full bg-gray-800 text-white text-2xl rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white placeholder:text-gray-600"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-800 text-white text-xl rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white"
        />

        <div className="flex gap-3 items-center">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 bg-gray-800 text-white text-xl rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white"
          />
          <span className="text-gray-500 text-xl">–</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 bg-gray-800 text-white text-xl rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div className="flex gap-3">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setColorId(user.gcalColorId)}
              className={`flex-1 min-h-14 rounded-xl text-lg font-semibold transition-all ${
                colorId === user.gcalColorId ? "ring-2 ring-white scale-105" : "opacity-60"
              }`}
              style={{ backgroundColor: user.color, color: "#fff" }}
            >
              {user.name}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {mode === "edit" && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className={`min-h-14 px-5 rounded-xl text-xl font-semibold transition-colors ${
                confirmDelete
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-red-400 hover:bg-red-900/30"
              }`}
            >
              {confirmDelete ? "Confirm delete" : "Delete"}
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="min-h-14 px-6 rounded-xl text-xl font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="min-h-14 px-6 rounded-xl text-xl font-semibold bg-white text-gray-950 hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
