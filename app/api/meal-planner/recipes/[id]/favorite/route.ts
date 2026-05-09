import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { data: recipe, error: fetchError } = await supabaseAdmin
      .from("recipes")
      .select("favorited")
      .eq("id", id)
      .single()
    if (fetchError) throw fetchError

    const { data, error } = await supabaseAdmin
      .from("recipes")
      .update({ favorited: !recipe.favorited })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (e) {
    console.error("PATCH /api/meal-planner/recipes/[id]/favorite error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 })
  }
}
