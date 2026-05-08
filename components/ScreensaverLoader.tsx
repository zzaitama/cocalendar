"use client"

import dynamic from "next/dynamic"

const Screensaver = dynamic(
  () => import("@/components/Screensaver").then(m => m.Screensaver),
  { ssr: false }
)

export function ScreensaverLoader({ forceActive }: { forceActive?: boolean }) {
  return <Screensaver forceActive={forceActive} />
}
