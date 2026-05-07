import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { AVATARS } from "@/lib/avatars"
import { USERS } from "@/lib/config"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const keys = USERS.map(u => `avatar:${u.id}`)
  const values = await Promise.all(keys.map(k => kv.get<string>(k)))
  const avatars: Record<string, string> = {}
  USERS.forEach((u, i) => { if (values[i]) avatars[u.id] = values[i] as string })
  return NextResponse.json({ avatars, options: AVATARS })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { userId, avatarId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  const user = USERS.find(u => u.id === userId)
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 400 })
  if (avatarId) {
    const avatar = AVATARS.find(a => a.id === avatarId)
    if (!avatar) return NextResponse.json({ error: "Unknown avatar" }, { status: 400 })
    await kv.set(`avatar:${userId}`, avatarId)
  } else {
    await kv.del(`avatar:${userId}`)
  }
  return NextResponse.json({ ok: true, userId, avatarId })
}
