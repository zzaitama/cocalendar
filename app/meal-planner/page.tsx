import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { NavHeader } from "@/components/NavHeader"
import { MealPlannerClient } from "@/components/MealPlannerClient"
import type { PantryItem, FoodPreferences } from "@/types/meal-planner"

export default async function MealPlannerPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/api/auth/signin")

  const [pantryResult, prefsResult] = await Promise.all([
    supabaseAdmin.from("pantry_items").select("*").order("created_at", { ascending: true }),
    supabaseAdmin.from("food_preferences").select("*").limit(1).single(),
  ])

  const pantry: PantryItem[] = pantryResult.data ?? []
  const preferences: FoodPreferences = prefsResult.data ?? { id: "", common_foods: [] }

  return (
    <div className="h-screen overflow-hidden bg-[#FAF9F7] dark:bg-gray-950 flex flex-col">
      <NavHeader activePage="meal-planner" />
      <MealPlannerClient initialPantry={pantry} initialPreferences={preferences} />
    </div>
  )
}
