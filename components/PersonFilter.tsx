"use client"

import { USERS } from "@/lib/config"
import { useAvatar } from "@/context/AvatarContext"

interface PersonFilterProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function PersonFilter({ selected, onChange }: PersonFilterProps) {
  const { getAvatar } = useAvatar()

  function toggle(colorId: string) {
    if (selected.includes(colorId)) {
      onChange(selected.filter(id => id !== colorId))
    } else {
      onChange([...selected, colorId])
    }
  }

  return (
    <div className="flex gap-2 px-8 py-3 shrink-0">
      {USERS.map(user => {
        const isSelected = selected.includes(user.gcalColorId)
        const active = selected.length === 0 || isSelected
        const emoji = getAvatar(user.id)
        return (
          <button
            key={user.id}
            onClick={() => toggle(user.gcalColorId)}
            className={`flex-1 min-h-14 rounded-full text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-0.5 ${active ? "" : "bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-600"}`}
            style={{
              backgroundColor: active ? user.color + "26" : undefined,
              color: active ? user.color : undefined,
              border: `2px solid ${active ? user.color : "transparent"}`,
            }}
          >
            {emoji && <span className="text-lg leading-none">{emoji}</span>}
            <span>{user.name}</span>
          </button>
        )
      })}
    </div>
  )
}
