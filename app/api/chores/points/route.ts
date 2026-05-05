import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import type { ChoreCompletion, PointRedemption, PersonPoints } from "@/types/chores"
import { USERS } from "@/lib/config"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const completions = (await kv.get<ChoreCompletion[]>("chore_completions")) ?? []
    const redemptions = (await kv.get<PointRedemption[]>("point_redemptions")) ?? []

    const points: Record<string, PersonPoints> = {}
    for (const user of USERS) {
      points[user.id] = { personId: user.id, earned: 0, redeemed: 0, available: 0 }
    }

    for (const completion of completions) {
      if (!completion.isCompleted || !completion.personId) continue
      if (points[completion.personId]) {
        points[completion.personId].earned += completion.pointsEarned
      }
    }

    for (const redemption of redemptions) {
      if (points[redemption.personId]) {
        points[redemption.personId].redeemed += redemption.pointsCost
      }
    }

    for (const p of Object.values(points)) {
      p.available = p.earned - p.redeemed
    }

    return NextResponse.json({ points })
  } catch (error) {
    console.error("GET /api/chores/points error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
