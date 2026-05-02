import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns"

export function formatDate(date: Date | string): string {
  return format(new Date(date), "EEEE, MMMM d")
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "h:mm a")
}

export function formatEventTime(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return "All day"
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function todayRange(date?: Date): { start: string; end: string } {
  const d = date ?? new Date()
  return {
    start: startOfDay(d).toISOString(),
    end: endOfDay(d).toISOString(),
  }
}

export function weekRange(anchor: Date = new Date()): { start: string; end: string } {
  return {
    start: startOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
  }
}

export function monthRange(anchor: Date = new Date()): { start: string; end: string } {
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })
  return {
    start: gridStart.toISOString(),
    end: addDays(gridStart, 41).toISOString(),
  }
}
