interface PointsSummaryProps {
  earned: number
  total: number
}

export function PointsSummary({ earned, total }: PointsSummaryProps) {
  const color =
    total === 0
      ? "text-gray-400 dark:text-gray-500"
      : earned === total
      ? "text-green-600 dark:text-green-400"
      : "text-amber-500"

  return (
    <div className={`flex items-center gap-1 text-sm font-semibold ${color}`}>
      <span>⭐</span>
      <span>
        {earned} / {total} pts
      </span>
    </div>
  )
}
