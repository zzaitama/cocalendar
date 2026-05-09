import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from("food_preferences")
      .select("*")
      .limit(1)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    console.error("GET /api/meal-planner/preferences error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    if (!Array.isArray(body.common_foods)) {
      return NextResponse.json({ error: "common_foods must be an array" }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from("food_preferences")
      .update({ common_foods: body.common_foods, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    console.error("PATCH /api/meal-planner/preferences error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
