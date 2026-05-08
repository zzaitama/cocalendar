import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import type { RewardCard } from "@/types/chores"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const _rl = await checkRateLimit(`rewards:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { id } = await params
    const rewards = (await kv.get<RewardCard[]>("reward_cards")) ?? []
    const idx = rewards.findIndex((r) => r.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    const body = await request.json()
    const existing = rewards[idx]
    const updated: RewardCard = {
      ...existing,
      title: body.title?.trim() ?? existing.title,
      description: body.description?.trim() ?? existing.description,
      pointsCost: typeof body.pointsCost === "number" ? Math.max(1, body.pointsCost) : existing.pointsCost,
      emoji: body.emoji ?? existing.emoji,
      isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    }

    rewards[idx] = updated
    await kv.set("reward_cards", rewards)
    return NextResponse.json({ reward: updated })
  } catch (error) {
    console.error("PATCH /api/reward-cards/[id] error:", error)
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
    const _rl = await checkRateLimit(`rewards:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { id } = await params
    const rewards = (await kv.get<RewardCard[]>("reward_cards")) ?? []
    const filtered = rewards.filter((r) => r.id !== id)
    if (filtered.length === rewards.length) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    await kv.set("reward_cards", filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reward-cards/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
