import { google } from "googleapis"
import type { CalendarEvent } from "@/types"

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary"

function getClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: "v3", auth })
}

function mapItem(item: {
  id?: string | null
  summary?: string | null
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
  }
}

export async function getEvents(
  accessToken: string,
  start: string,
  end: string
): Promise<CalendarEvent[]> {
  const calendar = getClient(accessToken)
  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
  })
  return (res.data.items ?? []).map(mapItem)
}

export async function createEvent(
  accessToken: string,
  data: { title: string; start: string; end: string; colorId: string }
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken)
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: data.title,
      colorId: data.colorId,
      start: { dateTime: data.start },
      end: { dateTime: data.end },
    },
  })
  return mapItem(res.data)
}

export async function updateEvent(
  accessToken: string,
  id: string,
  data: { title: string; start: string; end: string; colorId: string }
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken)
  const res = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId: id,
    requestBody: {
      summary: data.title,
      colorId: data.colorId,
      start: { dateTime: data.start },
      end: { dateTime: data.end },
    },
  })
  return mapItem(res.data)
}

export async function deleteEvent(accessToken: string, id: string): Promise<void> {
  const calendar = getClient(accessToken)
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: id })
}
