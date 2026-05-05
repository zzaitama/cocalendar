import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"

export interface Chore {
  id: string
  title: string
  assignee: "Daddy" | "Mommy" | "Colette" | "Monti" | "Unassigned"
  completedAt: string | null
  completedWeek: number | null
}

const VALID_ASSIGNEES = new Set(["Daddy", "Mommy", "Colette", "Monti", "Unassigned"])

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const chores = await getChores()
    return NextResponse.json(chores)
  } catch (e) {
    console.error("GET /api/chores error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to fetch chores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const _rl = await checkRateLimit(`chores:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const body = await request.json()
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title required (max 200 chars)" }, { status: 400 })
    }
    const assignee = VALID_ASSIGNEES.has(body.assignee) ? body.assignee : "Unassigned"
    const chores = await getChores()
    const newChore: Chore = {
      id: crypto.randomUUID(),
      title,
      assignee,
      completedAt: null,
      completedWeek: null,
    }
    await kv.set("chores", [...chores, newChore])
    return NextResponse.json(newChore, { status: 201 })
  } catch (e) {
    console.error("POST /api/chores error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to create chore" }, { status: 500 })
  }
}
