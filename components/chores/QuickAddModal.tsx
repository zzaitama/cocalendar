"use client"

import { useState } from "react"
import type { TimeBucket } from "@/types/chores"
import type { User } from "@/types"

const BUCKETS: { value: TimeBucket; label: string; emoji: string }[] = [
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "afternoon", label: "Afternoon", emoji: "☀️" },
  { value: "evening", label: "Evening", emoji: "🌙" },
  { value: "anytime", label: "Anytime", emoji: "🔄" },
]

interface QuickAddModalProps {
  users: User[]
  onSave: (title: string, personId: string | null, timeBucket: TimeBucket) => Promise<void>
  onClose: () => void
}

export function QuickAddModal({ users, onSave, onClose }: QuickAddModalProps) {
  const [title, setTitle] = useState("")
  const [personId, setPersonId] = useState<string | null>(null)
  const [timeBucket, setTimeBucket] = useState<TimeBucket>("anytime")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await onSave(title.trim(), personId, timeBucket)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:w-[480px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Add Chore</h2>
          <button
            onClick={onClose}
            className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Chore title..."
          className="w-full min-h-14 text-xl bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Person
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPersonId(null)}
              className={`min-h-[72px] rounded-xl text-base font-semibold transition-all ${
                personId === null
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              Anyone
            </button>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setPersonId(user.id)}
                className={`min-h-[72px] rounded-xl text-base font-semibold transition-all border-2 ${
                  personId === user.id ? "border-transparent text-white" : "border-transparent"
                }`}
                style={
                  personId === user.id
                    ? { backgroundColor: user.color }
                    : { backgroundColor: user.color + "22", color: user.color }
                }
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            When
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BUCKETS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setTimeBucket(value)}
                className={`min-h-[72px] rounded-xl text-base font-semibold transition-all ${
                  timeBucket === value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="w-full min-h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xl font-bold transition-colors"
        >
          {saving ? "Adding..." : "Add Chore"}
        </button>
      </div>
    </div>
  )
}
