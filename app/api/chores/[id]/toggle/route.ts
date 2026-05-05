import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import type { ChoreTemplate, ChoreCompletion } from "@/types/chores"
import { todayString } from "@/lib/chores-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const _rl = await checkRateLimit(`chores:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { personId, date } = await request.json()
    const choreId = params.id
    const effectiveDate = date ?? todayString()

    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    const template = templates.find((t) => t.id === choreId)
    if (!template) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 })
    }

    const completions = (await kv.get<ChoreCompletion[]>("chore_completions")) ?? []
    const existingIdx = completions.findIndex(
      (c) => c.choreId === choreId && c.date === effectiveDate
    )

    let updated: ChoreCompletion
    if (existingIdx === -1) {
      updated = {
        id: crypto.randomUUID(),
        choreId,
        personId: personId ?? template.personId,
        date: effectiveDate,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        pointsEarned: template.points,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      completions.push(updated)
    } else {
      const existing = completions[existingIdx]
      updated = {
        ...existing,
        isCompleted: !existing.isCompleted,
        completedAt: !existing.isCompleted ? new Date().toISOString() : null,
        pointsEarned: !existing.isCompleted ? template.points : 0,
        updatedAt: new Date().toISOString(),
      }
      completions[existingIdx] = updated
    }

    await kv.set("chore_completions", completions)
    return NextResponse.json({ completion: updated })
  } catch (error) {
    console.error("PATCH /api/chores/[id]/toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
