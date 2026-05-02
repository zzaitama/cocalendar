import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Redis } from "@upstash/redis"
import type { Countdown } from "../route"

const kv = Redis.fromEnv()

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const countdowns = await kv.get<Countdown[]>("countdowns") ?? []
    await kv.set("countdowns", countdowns.filter(c => c.id !== params.id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/countdowns/[id] error:", e)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
