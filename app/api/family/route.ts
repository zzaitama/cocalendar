import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { USERS } from "@/lib/config"
import type { User } from "@/types"

const FAMILY_KEY = "family:members"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const stored = await kv.get<User[]>(FAMILY_KEY)
  const members = stored ?? USERS
  return NextResponse.json({ members })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { members } = await req.json()
  if (!Array.isArray(members)) return NextResponse.json({ error: "members must be an array" }, { status: 400 })

  const clean: User[] = members.map((m: Partial<User>) => ({
    id: String(m.id ?? "").slice(0, 40),
    name: String(m.name ?? "").slice(0, 40),
    color: String(m.color ?? "#64748b"),
    gcalColorId: String(m.gcalColorId ?? "0"),
  }))

  await kv.set(FAMILY_KEY, clean)
  return NextResponse.json({ ok: true, members: clean })
}
