"use client"

import { useState } from "react"
import type { ChoreTemplate, TimeBucket, RecurrenceType, Weekday } from "@/types/chores"
import type { User } from "@/types"

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
]

interface ChoreFormProps {
  initial?: Partial<ChoreTemplate>
  users: User[]
  onSave: (data: Omit<ChoreTemplate, "id" | "sortOrder" | "createdAt" | "updatedAt">) => Promise<void>
  onCancel: () => void
}

export function ChoreForm({ initial, users, onSave, onCancel }: ChoreFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [personId, setPersonId] = useState<string>(initial?.personId ?? "")
  const [timeBucket, setTimeBucket] = useState<TimeBucket>(initial?.timeBucket ?? "anytime")
  const [points, setPoints] = useState(initial?.points ?? 5)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initial?.recurrenceType ?? "daily")
  const [selectedDays, setSelectedDays] = useState<Weekday[]>(initial?.selectedDays ?? [])
  const [isActive, setIsActive] = useState(initial?.isActive !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function toggleDay(day: Weekday) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required"); return }
    setSaving(true)
    setError("")
    try {
      await onSave({
        title: title.trim(),
        personId: personId || null,
        timeBucket,
        points,
        recurrenceType,
        selectedDays,
        isActive,
      })
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full min-h-14 text-lg bg-white dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Chore title..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Person</label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full min-h-14 bg-white dark:bg-gray-700 rounded-xl px-3 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Anyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">When</label>
          <select
            value={timeBucket}
            onChange={(e) => setTimeBucket(e.target.value as TimeBucket)}
            className="w-full min-h-14 bg-white dark:bg-gray-700 rounded-xl px-3 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="morning">🌅 Morning</option>
            <option value="afternoon">☀️ Afternoon</option>
            <option value="evening">🌙 Evening</option>
            <option value="anytime">🔄 Anytime</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Points (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={points}
            onChange={(e) => setPoints(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-full min-h-14 text-lg bg-white dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Recurrence</label>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
            className="w-full min-h-14 bg-white dark:bg-gray-700 rounded-xl px-3 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Every day</option>
            <option value="selectedDays">Selected days</option>
            <option value="manual">Manual (always on)</option>
          </select>
        </div>
      </div>

      {recurrenceType === "selectedDays" && (
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Days</label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                className={`min-h-[44px] px-3 rounded-lg text-sm font-semibold transition-colors ${
                  selectedDays.includes(value)
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-12 h-6 rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isActive ? "translate-x-6" : "translate-x-0"}`} />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 min-h-14 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 min-h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}
