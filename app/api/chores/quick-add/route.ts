import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import type { ChoreTemplate, ChoreCompletion, TimeBucket } from "@/types/chores"
import { todayString } from "@/lib/chores-helpers"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, personId, timeBucket } = await request.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const templates = (await kv.get<ChoreTemplate[]>("chore_templates")) ?? []
    const now = new Date().toISOString()
    const today = todayString()

    const template: ChoreTemplate = {
      id: crypto.randomUUID(),
      title: title.trim(),
      personId: personId ?? null,
      timeBucket: (timeBucket as TimeBucket) ?? "anytime",
      points: 5,
      recurrenceType: "manual",
      selectedDays: [],
      isActive: true,
      sortOrder: templates.length,
      createdAt: now,
      updatedAt: now,
    }

    const completion: ChoreCompletion = {
      id: crypto.randomUUID(),
      choreId: template.id,
      personId: personId ?? null,
      date: today,
      isCompleted: true,
      completedAt: now,
      pointsEarned: template.points,
      createdAt: now,
      updatedAt: now,
    }

    const completions = (await kv.get<ChoreCompletion[]>("chore_completions")) ?? []

    await kv.set("chore_templates", [...templates, template])
    await kv.set("chore_completions", [...completions, completion])

    return NextResponse.json({ template, completion }, { status: 201 })
  } catch (error) {
    console.error("POST /api/chores/quick-add error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
