import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
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

function isValidShoppingListData(body: unknown): body is ShoppingListData {
  if (typeof body !== "object" || body === null) return false
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.stores) || b.stores.length > 50) return false
  for (const store of b.stores) {
    if (typeof store !== "object" || store === null) return false
    const s = store as Record<string, unknown>
    if (typeof s.id !== "string" || s.id.length > 100) return false
    if (typeof s.name !== "string" || s.name.length > 100) return false
    if (typeof s.order !== "number") return false
    if (!Array.isArray(s.items) || s.items.length > 500) return false
    for (const item of s.items) {
      if (typeof item !== "object" || item === null) return false
      const i = item as Record<string, unknown>
      if (typeof i.id !== "string" || i.id.length > 100) return false
      if (typeof i.text !== "string" || i.text.length > 500) return false
      if (typeof i.checked !== "boolean") return false
    }
  }
  return true
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
    console.error("GET /api/shopping error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to fetch shopping list" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const allowed = await checkRateLimit(`shopping:${session.user?.email ?? "shared"}`)
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const body: unknown = await request.json()
    if (!isValidShoppingListData(body)) {
      return NextResponse.json({ error: "Invalid shopping list data" }, { status: 400 })
    }
    await kv.set("shopping-list", body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/shopping error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to save shopping list" }, { status: 500 })
  }
}
