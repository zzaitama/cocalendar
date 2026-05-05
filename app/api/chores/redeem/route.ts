import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import type { ChoreCompletion, PointRedemption, RewardCard } from "@/types/chores"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const _rl = await checkRateLimit(`chores:${session.user?.email ?? "shared"}`)
    if (!_rl) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { personId, rewardCardId } = await request.json()
    if (!personId || !rewardCardId) {
      return NextResponse.json({ error: "personId and rewardCardId are required" }, { status: 400 })
    }

    const rewardCards = (await kv.get<RewardCard[]>("reward_cards")) ?? []
    const reward = rewardCards.find((r) => r.id === rewardCardId)
    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    const completions = (await kv.get<ChoreCompletion[]>("chore_completions")) ?? []
    const redemptions = (await kv.get<PointRedemption[]>("point_redemptions")) ?? []

    const earned = completions
      .filter((c) => c.isCompleted && c.personId === personId)
      .reduce((sum, c) => sum + c.pointsEarned, 0)

    const redeemed = redemptions
      .filter((r) => r.personId === personId)
      .reduce((sum, r) => sum + r.pointsCost, 0)

    const available = earned - redeemed
    if (available < reward.pointsCost) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    const redemption: PointRedemption = {
      id: crypto.randomUUID(),
      personId,
      rewardCardId,
      rewardTitle: reward.title,
      pointsCost: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
    }

    await kv.set("point_redemptions", [...redemptions, redemption])
    return NextResponse.json({ redemption }, { status: 201 })
  } catch (error) {
    console.error("POST /api/chores/redeem error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
