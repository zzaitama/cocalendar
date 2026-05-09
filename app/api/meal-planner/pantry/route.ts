import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from("pantry_items")
      .select("*")
      .order("created_at", { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    console.error("GET /api/meal-planner/pantry error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to fetch pantry" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Name required (max 200 chars)" }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from("pantry_items")
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error("POST /api/meal-planner/pantry error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const { error } = await supabaseAdmin.from("pantry_items").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/meal-planner/pantry error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
