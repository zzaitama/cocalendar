import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Redis } from "@upstash/redis"

const kv = Redis.fromEnv()
import type { ShoppingListData } from "@/types"

const DEFAULT_DATA: ShoppingListData = {
  stores: [
    { id: "amazon", name: "Amazon", order: 0, color: "#fef2f2", emoji: "📦", items: [] },
    { id: "target", name: "Target", order: 1, color: "#fef2f2", emoji: "🎯", items: [] },
    { id: "trader-joes", name: "Trader Joe's", order: 2, color: "#f0fdf4", emoji: "🛒", items: [] },
    { id: "kukje", name: "Kukje", order: 3, color: "#eff6ff", emoji: "🏪", items: [] },
    { id: "costco", name: "Costco", order: 4, color: "#fefce8", emoji: "🏬", items: [] },
  ],
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const data = await kv.get<ShoppingListData>("shopping-list")
    return NextResponse.json(data ?? DEFAULT_DATA)
  } catch (error) {
    console.error("GET /api/shopping error:", error)
    return NextResponse.json({ error: "Failed to fetch shopping list" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body: ShoppingListData = await request.json()
    await kv.set("shopping-list", body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/shopping error:", error)
    return NextResponse.json({ error: "Failed to save shopping list" }, { status: 500 })
  }
}
