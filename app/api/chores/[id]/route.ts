import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import type { Chore } from "../route"

const VALID_ASSIGNEES = new Set(["Dad", "Mom", "Colette", "Unassigned"])

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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const _rl = await checkRateLimit(`chores:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const { id } = await params
    const chores = await kv.get<Chore[]>("chores") ?? []
    const idx = chores.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const body = await request.json()
    const chore = chores[idx]
    if ("completed" in body) {
      chores[idx] = {
        ...chore,
        completedAt: body.completed ? new Date().toISOString() : null,
        completedWeek: body.completed ? getISOWeek(new Date()) : null,
      }
    } else {
      const rawTitle = typeof body.title === "string" ? body.title.trim() : chore.title
      const title = rawTitle.slice(0, 200) || chore.title
      const assignee = VALID_ASSIGNEES.has(body.assignee) ? body.assignee : chore.assignee
      chores[idx] = { ...chore, title, assignee }
    }
    await kv.set("chores", chores)
    return NextResponse.json(chores[idx])
  } catch (e) {
    console.error("PATCH /api/chores/[id] error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to update chore" }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const _rl = await checkRateLimit(`chores:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const { id } = await params
    const chores = await kv.get<Chore[]>("chores") ?? []
    await kv.set("chores", chores.filter(c => c.id !== id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/chores/[id] error:", e instanceof Error ? e.message : "Unknown")
    return NextResponse.json({ error: "Failed to delete chore" }, { status: 500 })
  }
}
