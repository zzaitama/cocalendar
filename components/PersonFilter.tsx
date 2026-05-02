"use client"

import { USERS } from "@/lib/config"

interface PersonFilterProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function PersonFilter({ selected, onChange }: PersonFilterProps) {
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
        return (
          <button
            key={user.id}
            onClick={() => toggle(user.gcalColorId)}
            className="flex-1 min-h-14 rounded-full text-sm font-semibold transition-colors"
            style={{
              backgroundColor: active ? user.color + "26" : "#1e293b",
              color: active ? user.color : "#4b5563",
              border: `2px solid ${active ? user.color : "transparent"}`,
            }}
          >
            {user.name}
          </button>
        )
      })}
    </div>
  )
}
