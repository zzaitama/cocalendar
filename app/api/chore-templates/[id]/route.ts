import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import type { ChoreTemplate, TimeBucket, RecurrenceType, Weekday } from "@/types/chores"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    const idx = templates.findIndex((t) => t.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await request.json()
    const existing = templates[idx]
    const updated: ChoreTemplate = {
      ...existing,
      title: body.title?.trim() ?? existing.title,
      personId: "personId" in body ? (body.personId ?? null) : existing.personId,
      timeBucket: (body.timeBucket as TimeBucket) ?? existing.timeBucket,
      points: typeof body.points === "number" ? Math.max(0, Math.min(100, body.points)) : existing.points,
      recurrenceType: (body.recurrenceType as RecurrenceType) ?? existing.recurrenceType,
      selectedDays: (body.selectedDays as Weekday[]) ?? existing.selectedDays,
      isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    }

    templates[idx] = updated
    await kv.set("chore_templates", templates)
    return NextResponse.json({ template: updated })
  } catch (error) {
    console.error("PATCH /api/chore-templates/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    const filtered = templates.filter((t) => t.id !== id)
    if (filtered.length === templates.length) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    await kv.set("chore_templates", filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/chore-templates/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
