"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Avatar } from "@/lib/avatars"

interface AvatarContextValue {
  avatars: Record<string, string>        // userId → avatarId
  options: Avatar[]
  getAvatar: (userId: string) => string  // returns emoji or ""
  setAvatar: (userId: string, avatarId: string) => Promise<void>
  loading: boolean
}

const AvatarContext = createContext<AvatarContextValue>({
  avatars: {},
  options: [],
  getAvatar: () => "",
  setAvatar: async () => {},
  loading: true,
})

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatars, setAvatars] = useState<Record<string, string>>({})
  const [options, setOptions] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const cached = localStorage.getItem("cocalendar-avatars")
      if (cached) {
        const parsed = JSON.parse(cached)
        setAvatars(parsed.avatars ?? {})
        setOptions(parsed.options ?? [])
      }
      const res = await fetch("/api/avatars")
      if (res.ok) {
        const data = await res.json()
        setAvatars(data.avatars ?? {})
        setOptions(data.options ?? [])
        localStorage.setItem("cocalendar-avatars", JSON.stringify(data))
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function getAvatar(userId: string): string {
    const avatarId = avatars[userId]
    if (!avatarId) return ""
    return options.find(a => a.id === avatarId)?.emoji ?? ""
  }

  async function setAvatar(userId: string, avatarId: string) {
    await fetch("/api/avatars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, avatarId }),
    })
    const newAvatars = { ...avatars, [userId]: avatarId }
    setAvatars(newAvatars)
    localStorage.setItem("cocalendar-avatars", JSON.stringify({ avatars: newAvatars, options }))
  }

  return (
    <AvatarContext.Provider value={{ avatars, options, getAvatar, setAvatar, loading }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  return useContext(AvatarContext)
}
