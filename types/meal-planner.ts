export interface PantryItem {
  id: string
  name: string
  created_at: string
}

export interface FoodPreferences {
  id: string
  common_foods: string[]
}

export interface Ingredient {
  name: string
  have: boolean
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export interface Recipe {
  id: string
  meal_plan_id: string
  meal_type: MealType
  day_number: number
  name: string
  ingredients: Ingredient[]
  missing_ingredients: string[]
  steps: string[]
  prep_time: number
  cook_time: number
  favorited: boolean
  created_at: string
}

export interface MealPlan {
  id: string
  days: number
  created_at: string
  recipes: Recipe[]
}
