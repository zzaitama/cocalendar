"use client"

import { createContext, useContext } from "react"

export type ThemeOverride = "auto" | "light" | "dark"
export type EffectiveTheme = "light" | "dark"

interface ThemeContextValue {
  override: ThemeOverride
  effectiveTheme: EffectiveTheme
  setOverride: (o: ThemeOverride) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  override: "auto",
  effectiveTheme: "dark",
  setOverride: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}
