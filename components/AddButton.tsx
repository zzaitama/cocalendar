"use client"

interface AddButtonProps {
  onClick: () => void
}

export function AddButton({ onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-5xl font-light flex items-center justify-center shadow-2xl hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all"
      aria-label="Add event"
    >
      +
    </button>
  )
}
