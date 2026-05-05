import type { ChoreTemplate } from "@/types/chores"

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

export function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function appearsToday(template: ChoreTemplate): boolean {
  if (!template.isActive) return false
  const dayKey = WEEKDAYS[new Date().getDay()]
  switch (template.recurrenceType) {
    case "daily":
    case "manual":
      return true
    case "selectedDays":
      return template.selectedDays.includes(dayKey)
    default:
      return false
  }
}
