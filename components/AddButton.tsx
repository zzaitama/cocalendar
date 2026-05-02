"use client"

export function AddButton() {
  return (
    <button
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-white text-gray-950 text-5xl font-light flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-colors"
      aria-label="Add event"
    >
      +
    </button>
  )
}
