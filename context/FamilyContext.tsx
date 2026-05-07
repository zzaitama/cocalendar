"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { USERS as DEFAULT_USERS } from "@/lib/config"
import type { User } from "@/types"

interface FamilyContextValue {
  members: User[]
  loading: boolean
  save: (members: User[]) => Promise<void>
}

const FamilyContext = createContext<FamilyContextValue>({
  members: DEFAULT_USERS,
  loading: true,
  save: async () => {},
})

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<User[]>(DEFAULT_USERS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/family")
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? DEFAULT_USERS)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function save(next: User[]) {
    setMembers(next)
    await fetch("/api/family", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: next }),
    })
  }

  return (
    <FamilyContext.Provider value={{ members, loading, save }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  return useContext(FamilyContext)
}
