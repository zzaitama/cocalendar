import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { redis } from "@/lib/redis"
import { AVATARS } from "@/lib/avatars"
import { USERS } from "@/lib/config"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const keys = USERS.map(u => `avatar:${u.id}`)
  const values = await Promise.all(keys.map(k => redis.get<string>(k)))
  const avatars: Record<string, string> = {}
  USERS.forEach((u, i) => { if (values[i]) avatars[u.id] = values[i] as string })
  return NextResponse.json({ avatars, options: AVATARS })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { userId, avatarId } = await req.json()
  if (!userId || !avatarId) return NextResponse.json({ error: "userId and avatarId required" }, { status: 400 })
  const user = USERS.find(u => u.id === userId)
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 400 })
  const avatar = AVATARS.find(a => a.id === avatarId)
  if (!avatar) return NextResponse.json({ error: "Unknown avatar" }, { status: 400 })
  await redis.set(`avatar:${userId}`, avatarId)
  return NextResponse.json({ ok: true, userId, avatarId })
}
