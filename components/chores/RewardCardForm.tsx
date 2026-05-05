"use client"

import { useState } from "react"
import type { RewardCard } from "@/types/chores"

interface RewardCardFormProps {
  initial?: Partial<RewardCard>
  onSave: (data: Omit<RewardCard, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onCancel: () => void
}

export function RewardCardForm({ initial, onSave, onCancel }: RewardCardFormProps) {
  const [emoji, setEmoji] = useState(initial?.emoji ?? "⭐")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [pointsCost, setPointsCost] = useState(initial?.pointsCost ?? 10)
  const [isActive, setIsActive] = useState(initial?.isActive !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required"); return }
    if (pointsCost < 1) { setError("Points must be at least 1"); return }
    setSaving(true)
    setError("")
    try {
      await onSave({ emoji, title: title.trim(), description: description.trim(), pointsCost, isActive })
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <div className="w-20">
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Emoji</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2) || "⭐")}
            className="w-full min-h-14 text-2xl text-center bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-h-14 text-lg bg-white dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Reward title..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-14 bg-white dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What do they get?"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Points cost</label>
        <input
          type="number"
          min={1}
          value={pointsCost}
          onChange={(e) => setPointsCost(Math.max(1, Number(e.target.value)))}
          className="w-full min-h-14 text-lg bg-white dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
          className="flex-1 min-h-14 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}
