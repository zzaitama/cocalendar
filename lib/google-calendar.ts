import { google } from "googleapis"
import type { CalendarEvent } from "@/types"

const PRIMARY_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary"
const EXTRA_CALENDAR_IDS: string[] = (process.env.GOOGLE_EXTRA_CALENDAR_IDS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

function getClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: "v3", auth })
}

function mapItem(item: {
  id?: string | null
  summary?: string | null
  description?: string | null
  start?: { dateTime?: string | null; date?: string | null } | null
  end?: { dateTime?: string | null; date?: string | null } | null
  colorId?: string | null
}): CalendarEvent {
  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime)
  return {
    id: item.id ?? "",
    title: item.summary ?? "(No title)",
    start: item.start?.dateTime ?? item.start?.date ?? "",
    end: item.end?.dateTime ?? item.end?.date ?? "",
    colorId: item.colorId ?? "0",
    isAllDay,
    description: item.description ?? undefined,
  }
}

export async function getEvents(
  accessToken: string,
  start: string,
  end: string
): Promise<CalendarEvent[]> {
  const calendar = getClient(accessToken)
  const calendarIds = [PRIMARY_CALENDAR_ID, ...EXTRA_CALENDAR_IDS]

  const isExtra = (id: string) => id !== PRIMARY_CALENDAR_ID

  const results = await Promise.all(
    calendarIds.map(calendarId =>
      calendar.events.list({
        calendarId,
        timeMin: start,
        timeMax: end,
        singleEvents: true,
        orderBy: "startTime",
      }).then(res => (res.data.items ?? []).map(item => ({
          ...item,
          // Stamp extra calendar events so they get the Family color
          colorId: isExtra(calendarId) ? "10" : (item.colorId ?? undefined),
        })))
       .catch(() => []) // if one calendar fails, don't break everything
    )
  )

  const allEvents = results.flat().map(mapItem)
  // deduplicate by id, sort by start
  const seen = new Set<string>()
  return allEvents
    .filter(e => {
      if (!e.id || seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
    .sort((a, b) => a.start.localeCompare(b.start))
}

export async function createEvent(
  accessToken: string,
  data: { title: string; start: string; end: string; colorId: string; isAllDay?: boolean; description?: string }
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken)
  const res = await calendar.events.insert({
    calendarId: PRIMARY_CALENDAR_ID,
    requestBody: {
      summary: data.title,
      colorId: data.colorId,
      description: data.description || undefined,
      start: data.isAllDay ? { date: data.start.slice(0, 10) } : { dateTime: data.start },
      end: data.isAllDay ? { date: data.end.slice(0, 10) } : { dateTime: data.end },
    },
  })
  return mapItem(res.data)
}

export async function updateEvent(
  accessToken: string,
  id: string,
  data: { title: string; start: string; end: string; colorId: string; isAllDay?: boolean; description?: string }
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken)
  const res = await calendar.events.patch({
    calendarId: PRIMARY_CALENDAR_ID,
    eventId: id,
    requestBody: {
      summary: data.title,
      colorId: data.colorId,
      description: data.description || undefined,
      start: data.isAllDay ? { date: data.start.slice(0, 10) } : { dateTime: data.start },
      end: data.isAllDay ? { date: data.end.slice(0, 10) } : { dateTime: data.end },
    },
  })
  return mapItem(res.data)
}

export async function deleteEvent(accessToken: string, id: string): Promise<void> {
  const calendar = getClient(accessToken)
  await calendar.events.delete({ calendarId: PRIMARY_CALENDAR_ID, eventId: id })
}

