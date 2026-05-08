"use client"

import type { ChoreWithCompletion, TimeBucket } from "@/types/chores"
import type { User } from "@/types"
import { TimeBucketSection } from "./TimeBucketSection"
import { PointsSummary } from "./PointsSummary"
import { useAvatar } from "@/context/AvatarContext"

const BUCKETS: TimeBucket[] = ["morning", "afternoon", "evening", "anytime"]

interface PersonChoresColumnProps {
  user: User
  chores: ChoreWithCompletion[]
  onToggle: (choreId: string) => void
}

export function PersonChoresColumn({ user, chores, onToggle }: PersonChoresColumnProps) {
  const { getAvatar } = useAvatar()
  const avatarEmoji = getAvatar(user.id) || user.name[0].toUpperCase()

  const earnedToday = chores.reduce(
    (sum, c) => sum + (c.completion?.isCompleted ? c.points : 0),
    0
  )
  const totalToday = chores.reduce((sum, c) => sum + c.points, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 border-[3px]"
          style={{ borderColor: user.color, backgroundColor: user.color + "22" }}
        >
          {avatarEmoji}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
          <PointsSummary earned={earnedToday} total={totalToday} />
        </div>
      </div>

      {chores.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm italic px-1">No chores today</p>
      ) : (
        <div className="flex flex-col gap-4">
          {BUCKETS.map((bucket) => (
            <TimeBucketSection
              key={bucket}
              bucket={bucket}
              chores={chores.filter((c) => c.timeBucket === bucket)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
