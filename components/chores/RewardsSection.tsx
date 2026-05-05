"use client"

import { useState } from "react"
import Link from "next/link"
import type { RewardCard, PersonPoints } from "@/types/chores"
import type { User } from "@/types"
import { RedeemModal } from "./RedeemModal"

interface RewardsSectionProps {
  rewards: RewardCard[]
  users: User[]
  points: Record<string, PersonPoints>
  onRedeem: (personId: string, rewardCardId: string) => Promise<void>
}

export function RewardsSection({ rewards, users, points, onRedeem }: RewardsSectionProps) {
  const [selectedReward, setSelectedReward] = useState<RewardCard | null>(null)
  const activeRewards = rewards.filter((r) => r.isActive)

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Rewards</h2>
        <Link
          href="/chores/rewards"
          className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Manage rewards"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      {activeRewards.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm italic">
          No rewards yet.{" "}
          <Link href="/chores/rewards" className="underline">
            Add some!
          </Link>
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {activeRewards.map((reward) => (
            <button
              key={reward.id}
              onClick={() => setSelectedReward(reward)}
              className="flex-shrink-0 w-40 min-h-[120px] rounded-2xl p-4 text-left bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md active:scale-95 transition-transform"
            >
              <div className="text-3xl mb-2">{reward.emoji}</div>
              <p className="font-bold text-base leading-tight">{reward.title}</p>
              <p className="text-sm font-semibold opacity-90 mt-1">⭐ {reward.pointsCost} pts</p>
            </button>
          ))}
        </div>
      )}

      {selectedReward && (
        <RedeemModal
          reward={selectedReward}
          users={users}
          points={points}
          onRedeem={async (personId, rewardCardId) => {
            await onRedeem(personId, rewardCardId)
          }}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </div>
  )
}
