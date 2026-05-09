"use client"

import { useState } from "react"
import type { PantryItem, FoodPreferences, MealPlan, Recipe, MealType } from "@/types/meal-planner"

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"]
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
}
const DAY_OPTIONS = [
  { label: "Today", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "Week", days: 7 },
] as const

interface MealPlannerClientProps {
  initialPantry: PantryItem[]
  initialPreferences: FoodPreferences
}

export function MealPlannerClient({ initialPantry, initialPreferences }: MealPlannerClientProps) {
  const [pantry, setPantry] = useState<PantryItem[]>(initialPantry)
  const [preferences, setPreferences] = useState<FoodPreferences>(initialPreferences)
  const [days, setDays] = useState<1 | 3 | 7>(1)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [pantryInput, setPantryInput] = useState("")
  const [prefInput, setPrefInput] = useState("")

  async function addPantryItem() {
    const name = pantryInput.trim()
    if (!name) return
    setPantryInput("")
    const res = await fetch("/api/meal-planner/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const item: PantryItem = await res.json()
      setPantry(prev => [...prev, item])
    }
  }

  async function removePantryItem(id: string) {
    const res = await fetch(`/api/meal-planner/pantry?id=${id}`, { method: "DELETE" })
    if (res.ok) setPantry(prev => prev.filter(p => p.id !== id))
  }

  async function addPreference() {
    const food = prefInput.trim()
    if (!food || preferences.common_foods.includes(food)) return
    setPrefInput("")
    const updated = { ...preferences, common_foods: [...preferences.common_foods, food] }
    const res = await fetch("/api/meal-planner/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    if (res.ok) setPreferences(await res.json())
  }

  async function removePreference(food: string) {
    const updated = { ...preferences, common_foods: preferences.common_foods.filter(f => f !== food) }
    const res = await fetch("/api/meal-planner/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    if (res.ok) setPreferences(await res.json())
  }

  async function generatePlan() {
    setGenerating(true)
    setPlan(null)
    try {
      const res = await fetch("/api/meal-planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          pantryItems: pantry.map(p => p.name),
          preferences: preferences.common_foods,
        }),
      })
      if (res.ok) setPlan(await res.json())
    } finally {
      setGenerating(false)
    }
  }

  async function toggleFavorite(recipe: Recipe) {
    const res = await fetch(`/api/meal-planner/recipes/${recipe.id}/favorite`, { method: "PATCH" })
    if (!res.ok) return
    const updated: Recipe = await res.json()
    setPlan(prev =>
      prev ? { ...prev, recipes: prev.recipes.map(r => (r.id === updated.id ? updated : r)) } : null
    )
    if (selectedRecipe?.id === updated.id) setSelectedRecipe(updated)
  }

  const grid = plan?.recipes.reduce<Record<number, Partial<Record<MealType, Recipe>>>>((acc, r) => {
    if (!acc[r.day_number]) acc[r.day_number] = {}
    acc[r.day_number][r.meal_type] = r
    return acc
  }, {}) ?? {}

  const dayNumbers = Array.from({ length: plan?.days ?? 0 }, (_, i) => i + 1)
  const shoppingList = plan
    ? [...new Set(plan.recipes.flatMap(r => r.missing_ingredients))].sort()
    : []

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagSection
          title="Pantry"
          placeholder="Add ingredient…"
          tags={pantry.map(p => p.name)}
          input={pantryInput}
          onInputChange={setPantryInput}
          onAdd={addPantryItem}
          onRemove={name => {
            const item = pantry.find(p => p.name === name)
            if (item) removePantryItem(item.id)
          }}
        />
        <TagSection
          title="Family Favorites"
          placeholder="Add food…"
          tags={preferences.common_foods}
          input={prefInput}
          onInputChange={setPrefInput}
          onAdd={addPreference}
          onRemove={removePreference}
        />
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-stone-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
            {DAY_OPTIONS.map(({ label, days: d }) => (
              <button
                key={d}
                onClick={() => setDays(d as 1 | 3 | 7)}
                className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
                  days === d
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                    : "text-stone-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-base hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Raiding your pantry…" : "Generate Meal Plan"}
          </button>
        </div>
      </section>

      {plan && (
        <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-5">
            {plan.days === 1 ? "Today's Meals" : `${plan.days}-Day Plan`}
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left w-24" />
                {dayNumbers.map(d => (
                  <th key={d} className="text-center text-stone-500 dark:text-gray-400 text-sm font-bold pb-3 px-2 min-w-36">
                    {plan.days === 1 ? "Today" : `Day ${d}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mealType => (
                <tr key={mealType}>
                  <td className="text-stone-400 dark:text-gray-500 text-sm font-bold pr-3 py-2 whitespace-nowrap align-top pt-4">
                    {MEAL_LABELS[mealType]}
                  </td>
                  {dayNumbers.map(d => {
                    const recipe = grid[d]?.[mealType]
                    return (
                      <td key={d} className="p-1.5 align-top">
                        {recipe ? (
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            className="w-full text-left bg-stone-50 dark:bg-gray-800 rounded-2xl p-3 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight mb-1">
                              {recipe.name}
                            </p>
                            <p className="text-stone-400 dark:text-gray-500 text-xs">
                              {recipe.prep_time + recipe.cook_time} min
                            </p>
                            {recipe.missing_ingredients.length > 0 && (
                              <p className="text-amber-500 dark:text-amber-400 text-xs mt-1 font-semibold">
                                {recipe.missing_ingredients.length} missing
                              </p>
                            )}
                            {recipe.favorited && <p className="text-xs mt-0.5">⭐</p>}
                          </button>
                        ) : (
                          <div className="w-full h-16 bg-stone-50 dark:bg-gray-800 rounded-2xl opacity-30" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {shoppingList.length > 0 && (
        <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm">
          <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-4">Shopping List</h2>
          <div className="flex flex-wrap gap-2">
            {shoppingList.map(item => (
              <span
                key={item}
                className="inline-flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-3.5 py-1.5 text-sm font-semibold"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  )
}

interface TagSectionProps {
  title: string
  placeholder: string
  tags: string[]
  input: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (tag: string) => void
}

function TagSection({ title, placeholder, tags, input, onInputChange, onAdd, onRemove }: TagSectionProps) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm">
      <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-4">{title}</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-stone-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 outline-none text-base"
          placeholder={placeholder}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAdd()}
        />
        <button
          onClick={onAdd}
          className="px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-base hover:opacity-80 transition-opacity"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-stone-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full px-3.5 py-1.5 text-sm font-semibold"
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-gray-200 transition-colors leading-none"
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-stone-400 dark:text-gray-500 text-sm">None yet</p>}
      </div>
    </section>
  )
}

interface RecipeModalProps {
  recipe: Recipe
  onClose: () => void
  onToggleFavorite: (recipe: Recipe) => Promise<void>
}

function RecipeModal({ recipe, onClose, onToggleFavorite }: RecipeModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleFavorite() {
    setLoading(true)
    await onToggleFavorite(recipe)
    setLoading(false)
  }

  const totalTime = recipe.prep_time + recipe.cook_time

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F7] dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex-1">
              <p className="text-xs font-bold text-stone-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                {MEAL_LABELS[recipe.meal_type]}
              </p>
              <h3 className="text-gray-900 dark:text-white font-extrabold text-2xl leading-tight">
                {recipe.name}
              </h3>
              {totalTime > 0 && (
                <p className="text-stone-400 dark:text-gray-500 text-sm mt-1">
                  {recipe.prep_time > 0 && `Prep ${recipe.prep_time} min`}
                  {recipe.prep_time > 0 && recipe.cook_time > 0 && " · "}
                  {recipe.cook_time > 0 && `Cook ${recipe.cook_time} min`}
                  {" · "}{totalTime} min total
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleFavorite}
                disabled={loading}
                className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
                aria-label="Toggle favorite"
              >
                {recipe.favorited ? "⭐" : "☆"}
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-500 dark:text-gray-400 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="mb-5">
            <h4 className="text-gray-900 dark:text-white font-bold text-base mb-3">Ingredients</h4>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${ing.have ? "bg-green-400" : "bg-amber-400"}`}
                  />
                  <span className={ing.have ? "text-gray-800 dark:text-gray-200" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                    {ing.name}
                  </span>
                  {!ing.have && (
                    <span className="text-xs text-amber-400 dark:text-amber-500 font-semibold">need to buy</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {recipe.steps.length > 0 && (
            <div>
              <h4 className="text-gray-900 dark:text-white font-bold text-base mb-3">Instructions</h4>
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
