"use client"

import type { ChoreWithCompletion } from "@/types/chores"

const BUCKET_EMOJI: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌙",
  anytime: "🔄",
}

interface ChoreCardProps {
  chore: ChoreWithCompletion
  onToggle: (choreId: string) => void
}

export function ChoreCard({ chore, onToggle }: ChoreCardProps) {
  const done = chore.completion?.isCompleted ?? false

  return (
    <button
      onClick={() => onToggle(chore.id)}
      className={`w-full min-h-[72px] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
        done
          ? "bg-green-50 dark:bg-green-950/30"
          : "bg-gray-50 dark:bg-gray-800"
      }`}
    >
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
          done
            ? "bg-green-500 border-green-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {done && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-lg font-medium truncate ${
            done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {BUCKET_EMOJI[chore.timeBucket] ?? ""} {chore.title}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 text-sm text-amber-500 font-semibold">
        <span>⭐</span>
        <span>{chore.points}</span>
      </div>
    </button>
  )
}
