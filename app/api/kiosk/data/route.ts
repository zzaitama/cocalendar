import { NextRequest, NextResponse } from "next/server"
import { getEvents } from "@/lib/google-calendar"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import { startOfDay, endOfDay } from "date-fns"

// This endpoint authenticates via KIOSK_SECRET env var so the Pi wall
// display never needs a browser session or OAuth token.
//
// Flow:
//   1. On any normal login, auth.ts persists the refresh token to Redis
//   2. This route fetches that refresh token, gets a fresh access token,
//      then calls the calendar + chores APIs server-side

const KIOSK_TOKEN_KEY = "cocalendar:kiosk_refresh_token"

interface Chore {
  id: string
  title: string
  assignee: string
  completedAt: string | null
  completedWeek: number | null
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

async function getFreshAccessToken(): Promise<string> {
  const refreshToken = await kv.get<string>(KIOSK_TOKEN_KEY)
  if (!refreshToken) throw new Error("No refresh token stored — sign in to the app first")

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const tokens = await res.json()
  if (!res.ok) throw new Error(`Token refresh failed: ${tokens.error ?? res.status}`)
  return tokens.access_token as string
}

async function getChores(): Promise<Chore[]> {
  const chores = await kv.get<Chore[]>("chores")
  if (!chores) return []
  const currentWeek = getISOWeek(new Date())
  let changed = false
  const reset = chores.map(c => {
    if (c.completedWeek !== null && c.completedWeek < currentWeek) {
      changed = true
      return { ...c, completedAt: null, completedWeek: null }
    }
    return c
  })
  if (changed) await kv.set("chores", reset)
  return reset
}

export async function GET(request: NextRequest) {
  // Validate secret
  const secret = request.nextUrl.searchParams.get("secret")
  const kioskSecret = process.env.KIOSK_SECRET

  if (!kioskSecret) {
    return NextResponse.json({ error: "KIOSK_SECRET not configured on server" }, { status: 503 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const allowed = await checkRateLimit(`kiosk:${ip}`, 5, 60)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!secret || secret !== kioskSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [accessToken, chores] = await Promise.all([
      getFreshAccessToken(),
      getChores(),
    ])

    const now = new Date()
    const events = await getEvents(
      accessToken,
      startOfDay(now).toISOString(),
      endOfDay(now).toISOString()
    )

    return NextResponse.json({ events, chores })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("Kiosk data error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
