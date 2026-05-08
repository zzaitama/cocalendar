import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = request.nextUrl.searchParams.get("secret")
  const kioskSecret = process.env.KIOSK_SECRET

  if (!kioskSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const allowed = await checkRateLimit(`kiosk:${ip}`, 5, 60)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!secret || secret !== kioskSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { completed } = await request.json() as { completed: boolean }

  const chores = await kv.get<Chore[]>("chores")
  if (!chores) return NextResponse.json({ error: "No chores found" }, { status: 404 })

  const updated = chores.map(c => {
    if (c.id !== id) return c
    return {
      ...c,
      completedAt: completed ? new Date().toISOString() : null,
      completedWeek: completed ? getISOWeek(new Date()) : null,
    }
  })

  await kv.set("chores", updated)
  return NextResponse.json({ ok: true })
}
