import { NextRequest, NextResponse } from "next/server"
import { getEvents } from "@/lib/google-calendar"
import { startOfDay, endOfDay } from "date-fns"
import { redis } from "@/lib/redis"

// This endpoint is intentionally exempt from NextAuth middleware.
// It authenticates via KIOSK_SECRET so the Pi wall display never
// needs a browser session or OAuth token.

const CHORES_KEY = "cocalendar:chores"

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  const kioskSecret = process.env.KIOSK_SECRET

  if (!kioskSecret) {
    return NextResponse.json({ error: "KIOSK_SECRET not configured" }, { status: 503 })
  }
  if (!secret || secret !== kioskSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accessToken = process.env.GOOGLE_SERVICE_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: "No service access token configured" }, { status: 503 })
  }

  const now = new Date()
  const start = startOfDay(now).toISOString()
  const end = endOfDay(now).toISOString()

  try {
    const [events, choreData] = await Promise.all([
      getEvents(accessToken, start, end).catch(() => []),
      redis.get<unknown[]>(CHORES_KEY).catch(() => null),
    ])

    return NextResponse.json({
      events,
      chores: Array.isArray(choreData) ? choreData : [],
    })
  } catch (error) {
    console.error("Kiosk data fetch error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
