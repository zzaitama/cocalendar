import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEvents } from "@/lib/google-calendar"
import { todayRange } from "@/lib/utils"
import { NavHeader } from "@/components/NavHeader"
import { TodayView } from "@/components/TodayView"
import type { CalendarEvent } from "@/types"

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function Home({ searchParams }: { searchParams?: Promise<{ date?: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  const params = await searchParams
  const rawDate = params?.date
  const safeDate = rawDate && ISO_DATE_RE.test(rawDate) ? rawDate : undefined
  const targetDate = safeDate ? new Date(safeDate + "T12:00:00") : undefined

  let events: CalendarEvent[] = []
  try {
    const { start, end } = todayRange(targetDate)
    events = await getEvents(session.accessToken, start, end)
  } catch (error) {
    console.error("Failed to fetch events for Today View:", error)
  }

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-950 flex flex-col">
      <NavHeader activePage="day" />
      <TodayView initialEvents={events} targetDate={safeDate} />
    </div>
  )
}
