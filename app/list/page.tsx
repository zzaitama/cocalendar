import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { kv } from "@/lib/redis"
import { NavHeader } from "@/components/NavHeader"
import { ShoppingList } from "@/components/ShoppingList"
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

export default async function ListPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/api/auth/signin")

  let data: ShoppingListData = DEFAULT_DATA
  try {
    const stored = await kv.get<ShoppingListData>("shopping-list")
    if (stored) data = stored
  } catch (error) {
    console.error("Failed to fetch shopping list from KV:", error instanceof Error ? error.message : "Unknown")
  }

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-950 flex flex-col">
      <NavHeader activePage="list" />
      <ShoppingList initialData={data} />
    </div>
  )
}
