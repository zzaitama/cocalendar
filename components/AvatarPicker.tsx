"use client"

import { useAvatar } from "@/context/AvatarContext"
import { USERS } from "@/lib/config"

interface AvatarPickerProps {
  userId: string
  onClose: () => void
}

export function AvatarPicker({ userId, onClose }: AvatarPickerProps) {
  const { options, avatars, setAvatar } = useAvatar()
  const user = USERS.find(u => u.id === userId)
  const currentAvatarId = avatars[userId] ?? ""

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
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-950 dark:text-white text-2xl font-bold">
            Choose avatar
            {user && <span className="font-normal text-gray-400 ml-2">for {user.name}</span>}
          </p>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {options.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => handleSelect(avatar.id)}
              title={avatar.label}
              className={`w-full aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                currentAvatarId === avatar.id
                  ? "ring-2 scale-110"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              style={currentAvatarId === avatar.id ? { ringColor: user?.color } : {}}
            >
              {avatar.emoji}
            </button>
          ))}
        </div>

        {currentAvatarId && (
          <button
            onClick={() => handleSelect("")}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Remove avatar
          </button>
        )}
      </div>
    </div>
  )
}
