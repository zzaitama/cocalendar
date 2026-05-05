"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { RewardCard, PersonPoints } from "@/types/chores"
import type { User } from "@/types"
import { USERS } from "@/lib/config"
import { RewardCardForm } from "./RewardCardForm"

export function RewardManagementPage() {
  const [rewards, setRewards] = useState<RewardCard[]>([])
  const [points, setPoints] = useState<Record<string, PersonPoints>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/reward-cards").then((r) => r.json()),
      fetch("/api/chores/points").then((r) => r.json()),
    ])
      .then(([rewardData, pointsData]) => {
        setRewards(rewardData.rewards ?? [])
        setPoints(pointsData.points ?? {})
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data: Omit<RewardCard, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch("/api/reward-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setRewards((prev) => [...prev, json.reward])
    setShowCreate(false)
  }

  async function handleEdit(id: string, data: Omit<RewardCard, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch(`/api/reward-cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setRewards((prev) => prev.map((r) => (r.id === id ? json.reward : r)))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/reward-cards/${id}`, { method: "DELETE" })
      if (res.ok) setRewards((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chores" className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rewards</h1>
        </div>
        <Link
          href="/chores/management"
          className="text-sm text-blue-600 dark:text-blue-400 font-semibold min-h-14 flex items-center px-2"
        >
          ← Chores
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">All-Time Points</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(USERS as User[]).map((user) => {
            const p = points[user.id]
            return (
              <div key={user.id} className="rounded-xl p-3 text-center" style={{ backgroundColor: user.color + "18" }}>
                <p className="font-bold text-base" style={{ color: user.color }}>{user.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">⭐ {p?.available ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {p?.earned ?? 0} earned · {p?.redeemed ?? 0} redeemed
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {showCreate && (
        <RewardCardForm
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full min-h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold text-lg hover:border-amber-400 hover:text-amber-500 transition-colors"
        >
          + New Reward
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rewards.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-center py-8">No rewards yet. Add one above!</p>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => {
            if (editingId === reward.id) {
              return (
                <RewardCardForm
                  key={reward.id}
                  initial={reward}
                  onSave={(data) => handleEdit(reward.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              )
            }
            return (
              <div
                key={reward.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3 ${!reward.isActive ? "opacity-50" : ""}`}
              >
                <div className="text-3xl flex-shrink-0">{reward.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{reward.title}</p>
                  {reward.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{reward.description}</p>
                  )}
                  <p className="text-sm text-amber-500 font-semibold">⭐ {reward.pointsCost} pts</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingId(reward.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${reward.title}"?`)) handleDelete(reward.id)
                    }}
                    disabled={deletingId === reward.id}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
