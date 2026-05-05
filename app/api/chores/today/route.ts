import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import type { ChoreTemplate, ChoreCompletion, ChoreWithCompletion } from "@/types/chores"
import { todayString, appearsToday } from "@/lib/chores-helpers"

const SEED_TEMPLATES: ChoreTemplate[] = [
  {
    id: crypto.randomUUID(),
    title: "Make bed",
    personId: "dad",
    timeBucket: "morning",
    points: 5,
    recurrenceType: "daily",
    selectedDays: [],
    isActive: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Clear dishes",
    personId: "mom",
    timeBucket: "evening",
    points: 5,
    recurrenceType: "daily",
    selectedDays: [],
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Take out trash",
    personId: "dad",
    timeBucket: "anytime",
    points: 10,
    recurrenceType: "selectedDays",
    selectedDays: ["mon", "thu"],
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let templates = await kv.get<ChoreTemplate[]>("chore_templates")
    if (!templates || templates.length === 0) {
      templates = SEED_TEMPLATES
      await kv.set("chore_templates", templates)
    }

    const today = todayString()
    const completions = (await kv.get<ChoreCompletion[]>("chore_completions")) ?? []
    const todayCompletions = completions.filter((c) => c.date === today)

    const chores: ChoreWithCompletion[] = templates
      .filter(appearsToday)
      .map((template) => ({
        ...template,
        completion: todayCompletions.find((c) => c.choreId === template.id) ?? null,
      }))

    return NextResponse.json({ chores })
  } catch (error) {
    console.error("GET /api/chores/today error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
