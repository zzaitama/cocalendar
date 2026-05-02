import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Redis } from "@upstash/redis"

const kv = Redis.fromEnv()

export interface Countdown {
  id: string
  title: string
  emoji: string
  date: string // ISO date string YYYY-MM-DD
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const countdowns = await kv.get<Countdown[]>("countdowns")
    return NextResponse.json(countdowns ?? [])
  } catch (e) {
    console.error("GET /api/countdowns error:", e)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { title, emoji, date } = await request.json()
    if (!title?.trim() || !date) return NextResponse.json({ error: "title and date required" }, { status: 400 })
    const countdowns = await kv.get<Countdown[]>("countdowns") ?? []
    const item: Countdown = { id: crypto.randomUUID(), title: title.trim(), emoji: emoji ?? "🎉", date }
    await kv.set("countdowns", [...countdowns, item])
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    console.error("POST /api/countdowns error:", e)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
