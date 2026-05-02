"use client"

import { useState, useEffect, useCallback } from "react"
import { ThemeContext, type ThemeOverride, type EffectiveTheme } from "@/context/ThemeContext"

function computeEffective(override: ThemeOverride): EffectiveTheme {
  if (override === "light") return "light"
  if (override === "dark") return "dark"
  const h = new Date().getHours()
  return h >= 7 && h < 19 ? "light" : "dark"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverrideState] = useState<ThemeOverride>("auto")
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>("dark")

  const applyTheme = useCallback((o: ThemeOverride) => {
    const effective = computeEffective(o)
    setEffectiveTheme(effective)
    document.documentElement.classList.toggle("dark", effective === "dark")
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("theme-override")
    const initial: ThemeOverride =
      stored === "light" || stored === "dark" ? stored : "auto"
    setOverrideState(initial)
    applyTheme(initial)
  }, [applyTheme])

  useEffect(() => {
    if (override !== "auto") return
    const interval = setInterval(() => applyTheme("auto"), 60_000)
    return () => clearInterval(interval)
  }, [override, applyTheme])

  function setOverride(o: ThemeOverride) {
    setOverrideState(o)
    localStorage.setItem("theme-override", o)
    applyTheme(o)
  }

  return (
    <ThemeContext.Provider value={{ override, effectiveTheme, setOverride }}>
      {children}
    </ThemeContext.Provider>
  )
}
