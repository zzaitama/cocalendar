import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import type { RewardCard } from "@/types/chores"

const SEED_REWARDS: RewardCard[] = [
  {
    id: crypto.randomUUID(),
    title: "Movie Night Pick",
    description: "You choose the movie for family movie night",
    pointsCost: 20,
    emoji: "🎬",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Ice Cream",
    description: "Pick your favorite ice cream flavor",
    pointsCost: 30,
    emoji: "🍦",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Extra Screen Time",
    description: "30 extra minutes of screen time",
    pointsCost: 15,
    emoji: "📱",
    isActive: true,
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

    let rewards = await kv.get<RewardCard[]>("reward_cards")
    if (!rewards || rewards.length === 0) {
      rewards = SEED_REWARDS
      await kv.set("reward_cards", rewards)
    }

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error("GET /api/reward-cards error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const _rl = await checkRateLimit(`rewards:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const body = await request.json()
    const { title, description, pointsCost, emoji, isActive } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (typeof pointsCost !== "number" || pointsCost < 1) {
      return NextResponse.json({ error: "pointsCost must be a positive number" }, { status: 400 })
    }

    const rewards = (await kv.get<RewardCard[]>("reward_cards")) ?? []
    const now = new Date().toISOString()

    const reward: RewardCard = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() ?? "",
      pointsCost,
      emoji: emoji ?? "⭐",
      isActive: isActive !== false,
      createdAt: now,
      updatedAt: now,
    }

    await kv.set("reward_cards", [...rewards, reward])
    return NextResponse.json({ reward }, { status: 201 })
  } catch (error) {
    console.error("POST /api/reward-cards error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
