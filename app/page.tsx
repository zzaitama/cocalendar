import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEvents } from "@/lib/google-calendar"
import { todayRange } from "@/lib/utils"
import { NavHeader } from "@/components/NavHeader"
import { TodayView } from "@/components/TodayView"
import type { CalendarEvent } from "@/types"

export default async function Home({ searchParams }: { searchParams?: { date?: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  const targetDate = searchParams?.date
    ? new Date(searchParams.date + "T12:00:00")
    : undefined

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
      <TodayView initialEvents={events} targetDate={searchParams?.date} />
    </div>
  )
}
