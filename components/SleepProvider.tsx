"use client"

import { createContext, useContext, useState } from "react"

interface SleepContextValue {
  sleeping: boolean
  sleep: () => void
  wake: () => void
}

const SleepContext = createContext<SleepContextValue>({
  sleeping: false,
  sleep: () => {},
  wake: () => {},
})

export function SleepProvider({ children }: { children: React.ReactNode }) {
  const [sleeping, setSleeping] = useState(false)
  return (
    <SleepContext.Provider
      value={{ sleeping, sleep: () => setSleeping(true), wake: () => setSleeping(false) }}
    >
      {children}
    </SleepContext.Provider>
  )
}

export function useSleep() {
  return useContext(SleepContext)
}
