import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { startOfMonth } from "date-fns"
import { authOptions } from "@/lib/auth"
import { getEvents } from "@/lib/google-calendar"
import { monthRange } from "@/lib/utils"
import { NavHeader } from "@/components/NavHeader"
import { MonthView } from "@/components/MonthView"
import type { CalendarEvent } from "@/types"

export default async function MonthPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/api/auth/signin")

  let events: CalendarEvent[] = []
  try {
    const { start, end } = monthRange()
    events = await getEvents(session.accessToken, start, end)
  } catch (error) {
    console.error("Failed to fetch events for Month View:", error)
  }

  const monthStart = startOfMonth(new Date()).toISOString()

  return (
    <div className="h-screen overflow-hidden bg-gray-950 flex flex-col">
      <NavHeader activePage="month" />
      <MonthView initialEvents={events} initialMonthStart={monthStart} />
    </div>
  )
}
