import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEvents } from "@/lib/google-calendar"
import { todayRange } from "@/lib/utils"
import { NavHeader } from "@/components/NavHeader"
import { TodayView } from "@/components/TodayView"
import type { CalendarEvent } from "@/types"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  let events: CalendarEvent[] = []
  try {
    const { start, end } = todayRange()
    events = await getEvents(session.accessToken, start, end)
  } catch (error) {
    console.error("Failed to fetch events for Today View:", error)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <NavHeader activePage="today" />
      <TodayView initialEvents={events} />
    </div>
  )
}
