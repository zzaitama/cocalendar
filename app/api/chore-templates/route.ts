import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import type { ChoreTemplate, TimeBucket, RecurrenceType, Weekday } from "@/types/chores"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    return NextResponse.json({ templates })
  } catch (error) {
    console.error("GET /api/chore-templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, personId, timeBucket, points, recurrenceType, selectedDays, isActive } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    const now = new Date().toISOString()

    const template: ChoreTemplate = {
      id: crypto.randomUUID(),
      title: title.trim(),
      personId: personId ?? null,
      timeBucket: (timeBucket as TimeBucket) ?? "anytime",
      points: typeof points === "number" ? Math.max(0, Math.min(100, points)) : 5,
      recurrenceType: (recurrenceType as RecurrenceType) ?? "daily",
      selectedDays: (selectedDays as Weekday[]) ?? [],
      isActive: isActive !== false,
      sortOrder: templates.length,
      createdAt: now,
      updatedAt: now,
    }

    await kv.set("chore_templates", [...templates, template])
    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("POST /api/chore-templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
