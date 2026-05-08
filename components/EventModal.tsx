"use client"

import { useState, useEffect, useRef } from "react"
import { format, addHours, startOfHour } from "date-fns"
import { useFamily } from "@/context/FamilyContext"
import type { CalendarEvent } from "@/types"

interface EventModalProps {
  mode: "create" | "edit"
  event?: CalendarEvent
  defaultDate?: string
  onClose: () => void
  onSaved: () => void
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-3 px-4 rounded-2xl bg-stone-100 dark:bg-gray-800 transition-colors"
    >
      <span className="text-gray-900 dark:text-white font-semibold text-lg">{label}</span>
      <div className={`w-12 h-7 rounded-full transition-colors relative ${checked ? "bg-gray-900 dark:bg-white" : "bg-stone-300 dark:bg-gray-600"}`}>
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </div>
    </button>
  )
}

export function EventModal({ mode, event, defaultDate, onClose, onSaved }: EventModalProps) {
  const { members } = useFamily()
  const nextHour = startOfHour(addHours(new Date(), 1))

  const [title, setTitle] = useState(event?.title ?? "")
  const [date, setDate] = useState(
    event ? format(new Date(event.start), "yyyy-MM-dd") : (defaultDate ?? format(new Date(), "yyyy-MM-dd"))
  )
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? false)
  const [startTime, setStartTime] = useState(
    event && !event.isAllDay ? format(new Date(event.start), "HH:mm") : format(nextHour, "HH:mm")
  )
  const [endTime, setEndTime] = useState(
    event && !event.isAllDay
      ? format(new Date(event.end), "HH:mm")
      : format(addHours(nextHour, 1), "HH:mm")
  )
  const [colorId, setColorId] = useState(event?.colorId ?? members[0]?.gcalColorId ?? "2")
  const [notes, setNotes] = useState(event?.description ?? "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      let start: string
      let end: string

      if (isAllDay) {
        start = date
        end = date
      } else {
        start = new Date(`${date}T${startTime}`).toISOString()
        end = new Date(`${date}T${endTime}`).toISOString()
      }

      const body = JSON.stringify({
        title: title.trim(),
        start,
        end,
        colorId,
        isAllDay,
        description: notes.trim() || undefined,
      })

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
    if (!confirmDelete) { setConfirmDelete(true); return }
    setSaving(true)
    try {
      await fetch(`/api/events/${event!.id}`, { method: "DELETE" })
      onSaved()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-[#FAF9F7] dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {mode === "create" ? "New Event" : "Edit Event"}
        </h2>

        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
          placeholder="Event title"
          className="w-full bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white text-2xl rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder:text-stone-400 dark:placeholder:text-gray-600 font-bold"
        />

        {/* All-day toggle */}
        <Toggle label="All day" checked={isAllDay} onChange={setIsAllDay} />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xl rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-semibold"
        />

        {/* Time pickers — hidden when all-day */}
        {!isAllDay && (
          <div className="flex gap-3 items-center">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xl rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-semibold"
            />
            <span className="text-stone-400 dark:text-gray-500 text-xl font-bold">–</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xl rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-semibold"
            />
          </div>
        )}

        {/* Person selector */}
        <div className="flex gap-2">
          {members.map((user) => (
            <button
              key={user.id}
              onClick={() => setColorId(user.gcalColorId)}
              className={`flex-1 min-h-12 rounded-2xl text-base font-bold transition-all ${
                colorId === user.gcalColorId ? "ring-2 ring-gray-900 dark:ring-white scale-105" : "opacity-60"
              }`}
              style={{ backgroundColor: user.color, color: "#fff" }}
            >
              {user.name}
            </button>
          ))}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes…"
          rows={3}
          className="w-full bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder:text-stone-400 dark:placeholder:text-gray-600 font-medium resize-none"
        />

        {/* Actions */}
        <div className="flex gap-3">
          {mode === "edit" && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className={`min-h-14 px-5 rounded-2xl text-xl font-bold transition-colors ${
                confirmDelete
                  ? "bg-red-600 text-white"
                  : "bg-stone-100 dark:bg-gray-800 text-red-500 dark:text-red-400"
              }`}
            >
              {confirmDelete ? "Confirm delete" : "Delete"}
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="min-h-14 px-6 rounded-2xl text-xl font-bold bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="min-h-14 px-6 rounded-2xl text-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
