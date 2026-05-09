import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface MealFromAI {
  day: number
  type: string
  name: string
  ingredients: { name: string; have: boolean }[]
  missingIngredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const days = Math.min(7, Math.max(1, Number(body.days) || 1))
    const pantryItems: string[] = Array.isArray(body.pantryItems) ? body.pantryItems : []
    const preferences: string[] = Array.isArray(body.preferences) ? body.preferences : []

    const userPrompt = `Generate a ${days}-day meal plan.
Pantry items available: ${pantryItems.join(", ") || "none"}
Foods this family commonly eats: ${preferences.join(", ") || "none"}

Priorities (in order): 1) Use pantry items, 2) Quick to make (under 30 min), 3) Healthy, 4) Varied

Return JSON in exactly this format:
{
  "meals": [
    {
      "day": 1,
      "type": "breakfast|lunch|dinner|snack",
      "name": "Recipe Name",
      "ingredients": [{"name": "ingredient", "have": true}],
      "missingIngredients": ["item1"],
      "steps": ["Step 1...", "Step 2..."],
      "prepTime": 10,
      "cookTime": 20
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: "You are a meal planning assistant. Return ONLY valid JSON, no markdown, no explanation.",
      messages: [{ role: "user", content: userPrompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}"
    const parsed = JSON.parse(raw) as { meals: MealFromAI[] }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("meal_plans")
      .insert({ days })
      .select()
      .single()
    if (planError) throw planError

    const VALID_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"])
    const recipeRows = parsed.meals.map((meal) => ({
      meal_plan_id: plan.id,
      meal_type: VALID_MEAL_TYPES.has(meal.type) ? meal.type : "dinner",
      day_number: Number(meal.day) || 1,
      name: String(meal.name || ""),
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      missing_ingredients: Array.isArray(meal.missingIngredients) ? meal.missingIngredients : [],
      steps: Array.isArray(meal.steps) ? meal.steps : [],
      prep_time: Number(meal.prepTime) || 0,
      cook_time: Number(meal.cookTime) || 0,
    }))

    const { data: recipes, error: recipesError } = await supabaseAdmin
      .from("recipes")
      .insert(recipeRows)
      .select()
    if (recipesError) throw recipesError

    return NextResponse.json({ ...plan, recipes })
  } catch (e) {
    console.error("POST /api/meal-planner/generate error:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 })
  }
}
