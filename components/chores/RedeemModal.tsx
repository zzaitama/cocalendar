"use client"

import { useState } from "react"
import type { RewardCard, PersonPoints } from "@/types/chores"
import type { User } from "@/types"

interface RedeemModalProps {
  reward: RewardCard
  users: User[]
  points: Record<string, PersonPoints>
  onRedeem: (personId: string, rewardCardId: string) => Promise<void>
  onClose: () => void
}

export function RedeemModal({ reward, users, points, onRedeem, onClose }: RedeemModalProps) {
  const [redeeming, setRedeeming] = useState(false)
  const [redeemedFor, setRedeemedFor] = useState<string | null>(null)

  async function handleRedeem(personId: string) {
    if (redeeming) return
    setRedeeming(true)
    try {
      await onRedeem(personId, reward.id)
      setRedeemedFor(personId)
    } finally {
      setRedeeming(false)
    }
  }

  if (redeemedFor) {
    const user = users.find((u) => u.id === redeemedFor)
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
        onClick={onClose}
      >
        <div className="w-full sm:w-[480px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-8 text-center space-y-4">
          <div className="text-6xl">{reward.emoji}</div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Redeemed!</p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {user?.name} redeemed <strong>{reward.title}</strong> for {reward.pointsCost} pts
          </p>
          <button
            onClick={onClose}
            className="w-full min-h-14 rounded-xl bg-green-600 text-white text-xl font-bold"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:w-[480px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-4xl mb-2">{reward.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reward.title}</h2>
            {reward.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{reward.description}</p>
            )}
            <p className="text-amber-500 font-bold text-lg mt-1">⭐ {reward.pointsCost} pts</p>
          </div>
          <button
            onClick={onClose}
            className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Redeem for
          </p>
          <div className="grid grid-cols-2 gap-3">
            {users.map((user) => {
              const available = points[user.id]?.available ?? 0
              const canAfford = available >= reward.pointsCost
              return (
                <button
                  key={user.id}
                  onClick={() => canAfford && handleRedeem(user.id)}
                  disabled={!canAfford || redeeming}
                  className={`min-h-[72px] rounded-xl p-3 text-left transition-all border-2 ${
                    canAfford
                      ? "border-transparent hover:scale-[1.02] active:scale-[0.98]"
                      : "border-transparent opacity-40 cursor-not-allowed"
                  }`}
                  style={canAfford ? { backgroundColor: user.color + "22", borderColor: user.color } : { backgroundColor: "#f3f4f6" }}
                >
                  <p className="font-bold text-lg" style={canAfford ? { color: user.color } : {}}>
                    {user.name}
                  </p>
                  <p className={`text-sm ${canAfford ? "text-gray-600 dark:text-gray-400" : "text-gray-400"}`}>
                    ⭐ {available} available
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
