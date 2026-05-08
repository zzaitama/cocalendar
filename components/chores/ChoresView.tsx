"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { ChoreWithCompletion, RewardCard, PersonPoints } from "@/types/chores"
import type { User } from "@/types"
import { useFamily } from "@/context/FamilyContext"
import { PersonChoresColumn } from "./PersonChoresColumn"
import { RewardsSection } from "./RewardsSection"
import { QuickAddModal } from "./QuickAddModal"

export function ChoresView() {
  const { members: USERS } = useFamily()
  const [chores, setChores] = useState<ChoreWithCompletion[]>([])
  const [rewards, setRewards] = useState<RewardCard[]>([])
  const [points, setPoints] = useState<Record<string, PersonPoints>>({})
  const [loading, setLoading] = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const fetchChores = useCallback(async () => {
    try {
      const res = await fetch("/api/chores/today")
      if (!res.ok) return
      const data = await res.json()
      setChores(data.chores ?? [])
    } catch {
      // keep stale data
    }
  }, [])

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch("/api/chores/points")
      if (!res.ok) return
      const data = await res.json()
      setPoints(data.points ?? {})
    } catch {
      // keep stale data
    }
  }, [])

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch("/api/reward-cards")
      if (!res.ok) return
      const data = await res.json()
      setRewards(data.rewards ?? [])
    } catch {
      // keep stale data
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchChores(), fetchPoints(), fetchRewards()]).finally(() =>
      setLoading(false)
    )
    const interval = setInterval(() => {
      fetchChores()
      fetchPoints()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchChores, fetchPoints, fetchRewards])

  async function handleToggle(choreId: string) {
    setChores((prev) =>
      prev.map((c) => {
        if (c.id !== choreId) return c
        const wasCompleted = c.completion?.isCompleted ?? false
        return {
          ...c,
          completion: c.completion
            ? { ...c.completion, isCompleted: !wasCompleted, pointsEarned: !wasCompleted ? c.points : 0 }
            : {
                id: "optimistic",
                choreId,
                personId: c.personId,
                date: "",
                isCompleted: true,
                completedAt: new Date().toISOString(),
                pointsEarned: c.points,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
        }
      })
    )

    try {
      await fetch(`/api/chores/${choreId}/toggle`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      await Promise.all([fetchChores(), fetchPoints()])
    } catch {
      fetchChores()
    }
  }

  async function handleQuickAdd(title: string, personId: string | null, timeBucket: import("@/types/chores").TimeBucket) {
    await fetch("/api/chores/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, personId, timeBucket }),
    })
    await Promise.all([fetchChores(), fetchPoints()])
  }

  async function handleRedeem(personId: string, rewardCardId: string) {
    const res = await fetch("/api/chores/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId, rewardCardId }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? "Redemption failed")
    }
    await fetchPoints()
  }

  const totalEarned = chores.reduce((sum, c) => sum + (c.completion?.isCompleted ? c.points : 0), 0)
  const totalPossible = chores.reduce((sum, c) => sum + c.points, 0)

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-base font-semibold text-amber-500">
          ⭐ {totalEarned} / {totalPossible} today
        </p>
        <Link
          href="/chores/management"
          className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Manage chores"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid px-4 py-4 min-h-full gap-4" style={{ gridTemplateColumns: `repeat(${USERS.length}, 1fr)` }}>
            {USERS.map((user) => (
              <PersonChoresColumn
                key={user.id}
                user={user}
                chores={chores.filter((c) => c.personId === user.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        <RewardsSection
          rewards={rewards}
          users={USERS as User[]}
          points={points}
          onRedeem={handleRedeem}
        />
      </div>

      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center text-3xl transition-colors"
        aria-label="Quick add chore"
      >
        +
      </button>

      {showQuickAdd && (
        <QuickAddModal
          users={USERS as User[]}
          onSave={handleQuickAdd}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  )
}

