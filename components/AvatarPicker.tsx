"use client"

import { useAvatar } from "@/context/AvatarContext"
import { useFamily } from "@/context/FamilyContext"

interface AvatarPickerProps {
  userId: string
  onClose: () => void
}

export function AvatarPicker({ userId, onClose }: AvatarPickerProps) {
  const { options, avatars, setAvatar } = useAvatar()
  const { members } = useFamily()
  const user = members.find(u => u.id === userId)
  const currentAvatarId = avatars[userId] ?? ""
  const userColor = user?.color ?? "#64748b"

  async function handleSelect(avatarId: string) {
    await setAvatar(userId, avatarId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F7] dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm flex flex-col gap-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-900 dark:text-white text-2xl font-extrabold">
            Choose avatar
            {user && <span className="font-semibold text-stone-400 ml-2">for {user.name}</span>}
          </p>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-500 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {options.map(avatar => {
            const isSelected = currentAvatarId === avatar.id
            return (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar.id)}
                title={avatar.label}
                className={`w-full aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
                  isSelected
                    ? "scale-110"
                    : "bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-700"
                }`}
                style={isSelected
                  ? { backgroundColor: userColor + "22", outline: `2px solid ${userColor}` }
                  : undefined}
              >
                {avatar.emoji}
              </button>
            )
          })}
        </div>

        {currentAvatarId && (
          <button
            onClick={() => handleSelect("")}
            className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-gray-300 transition-colors font-semibold"
          >
            Remove avatar
          </button>
        )}
      </div>
    </div>
  )
}
