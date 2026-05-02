import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

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

export function todayRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: startOfDay(now).toISOString(),
    end: endOfDay(now).toISOString(),
  }
}

export function weekRange(anchor: Date = new Date()): { start: string; end: string } {
  return {
    start: startOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
  }
}
