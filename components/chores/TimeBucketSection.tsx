import type { ChoreWithCompletion, TimeBucket } from "@/types/chores"
import { ChoreCard } from "./ChoreCard"

const BUCKET_LABEL: Record<TimeBucket, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
}

interface TimeBucketSectionProps {
  bucket: TimeBucket
  chores: ChoreWithCompletion[]
  onToggle: (choreId: string) => void
}

export function TimeBucketSection({ bucket, chores, onToggle }: TimeBucketSectionProps) {
  if (chores.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
        {BUCKET_LABEL[bucket]}
      </p>
      {chores.map((chore) => (
        <ChoreCard key={chore.id} chore={chore} onToggle={onToggle} />
      ))}
    </div>
  )
}
