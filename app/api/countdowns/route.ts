import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"

export interface Countdown {
  id: string
  title: string
  emoji: string
  date: string // ISO date string YYYY-MM-DD
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const countdowns = await kv.get<Countdown[]>("countdowns")
    return NextResponse.json(countdowns ?? [])
  } catch (e) {
    console.error("GET /api/countdowns error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "title required (max 200 chars)" }, { status: 400 })
    }
    const date = typeof body.date === "string" ? body.date.trim() : ""
    if (!date || !ISO_DATE_RE.test(date)) {
      return NextResponse.json({ error: "date required in YYYY-MM-DD format" }, { status: 400 })
    }
    const rawEmoji = typeof body.emoji === "string" ? body.emoji : "🎉"
    const emoji = rawEmoji.slice(0, 8) || "🎉"
    const countdowns = await kv.get<Countdown[]>("countdowns") ?? []
    const item: Countdown = { id: crypto.randomUUID(), title, emoji, date }
    await kv.set("countdowns", [...countdowns, item])
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    console.error("POST /api/countdowns error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
