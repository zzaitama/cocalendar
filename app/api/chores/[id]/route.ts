import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Redis } from "@upstash/redis"
import type { Chore } from "../route"

const kv = Redis.fromEnv()

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const chores = await kv.get<Chore[]>("chores") ?? []
    const idx = chores.findIndex(c => c.id === params.id)
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
      chores[idx] = { ...chore, ...body }
    }
    await kv.set("chores", chores)
    return NextResponse.json(chores[idx])
  } catch (e) {
    console.error("PATCH /api/chores/[id] error:", e)
    return NextResponse.json({ error: "Failed to update chore" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const chores = await kv.get<Chore[]>("chores") ?? []
    await kv.set("chores", chores.filter(c => c.id !== params.id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/chores/[id] error:", e)
    return NextResponse.json({ error: "Failed to delete chore" }, { status: 500 })
  }
}
