"use client"

interface SleepButtonProps {
  onClick: () => void
  size?: "sm" | "md"
}

export function SleepButton({ onClick, size = "md" }: SleepButtonProps) {
  const dim = size === "sm" ? "w-10 h-10" : "w-11 h-11"
  const iconSize = size === "sm" ? 18 : 20
  return (
    <button
      onClick={onClick}
      title="Sleep display"
      aria-label="Sleep display"
      className={`${dim} rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
