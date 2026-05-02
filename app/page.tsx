import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getEvents } from "@/lib/google-calendar"
import { todayRange } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <a href="/api/auth/signin" className="text-2xl underline">
          Sign in with Google
        </a>
      </main>
    )
  }

  let events: CalendarEvent[] = []
  let fetchError: string | null = null

  try {
    const { start, end } = todayRange()
    events = await getEvents(session.accessToken, start, end)
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Unknown error"
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <p className="text-2xl font-semibold">Auth works ✓</p>
      {fetchError ? (
        <p className="text-red-500">{fetchError}</p>
      ) : (
        <p className="text-2xl">{events.length} event{events.length !== 1 ? "s" : ""} found today</p>
      )}
      <a href="/api/auth/signout" className="text-sm text-gray-500 underline">
        Sign out
      </a>
    </main>
  )
}
