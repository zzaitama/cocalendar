import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { startOfWeek } from "date-fns"
import { authOptions } from "@/lib/auth"
import { getEvents } from "@/lib/google-calendar"
import { weekRange } from "@/lib/utils"
import { NavHeader } from "@/components/NavHeader"
import { WeekView } from "@/components/WeekView"
import { AddButton } from "@/components/AddButton"
import type { CalendarEvent } from "@/types"

export default async function WeekPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  let events: CalendarEvent[] = []
  try {
    const { start, end } = weekRange()
    events = await getEvents(session.accessToken, start, end)
  } catch (error) {
    console.error("Failed to fetch events for Week View:", error)
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <NavHeader activePage="week" />
      <WeekView initialEvents={events} initialWeekStart={weekStart} />
      <AddButton />
    </div>
  )
}
