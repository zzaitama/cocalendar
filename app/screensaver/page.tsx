import Link from "next/link"
import { ScreensaverLoader } from "@/components/ScreensaverLoader"

export default function ScreensaverPage() {
  return (
    <>
      <div className="fixed top-4 left-4 z-[10001]">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white rounded-xl px-4 py-2.5 text-base font-semibold hover:bg-white/30 transition-colors min-h-[44px]"
        >
          ← Back
        </Link>
      </div>
      <ScreensaverLoader forceActive />
    </>
  )
}
