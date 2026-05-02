"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { formatDate } from "@/lib/utils"

interface NavHeaderProps {
  view: "today" | "week"
}

export function NavHeader({ view }: NavHeaderProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [])

  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
      <div>
        <p className="text-gray-400 text-2xl" suppressHydrationWarning>
          {formatDate(now)}
        </p>
        <p className="text-white font-bold tabular-nums leading-none mt-1" suppressHydrationWarning>
          <span className="text-7xl">{format(now, "h:mm")}</span>
          <span className="text-4xl text-gray-400 ml-2">{format(now, "a")}</span>
        </p>
      </div>

      <nav className="flex gap-3">
        <Link
          href="/"
          className={`px-6 py-4 rounded-xl text-2xl font-semibold min-h-14 flex items-center transition-colors ${
            view === "today"
              ? "bg-white text-gray-950"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Today
        </Link>
        <Link
          href="/week"
          className={`px-6 py-4 rounded-xl text-2xl font-semibold min-h-14 flex items-center transition-colors ${
            view === "week"
              ? "bg-white text-gray-950"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Week
        </Link>
      </nav>
    </header>
  )
}
