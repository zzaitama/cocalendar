import { google } from "googleapis"
import type { CalendarEvent } from "@/types"

export async function getEvents(
  accessToken: string,
  start: string,
  end: string
): Promise<CalendarEvent[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: "v3", auth })

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
  })

  const items = res.data.items ?? []

  return items.map((item) => {
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime)
    return {
      id: item.id ?? "",
      title: item.summary ?? "(No title)",
      start: item.start?.dateTime ?? item.start?.date ?? "",
      end: item.end?.dateTime ?? item.end?.date ?? "",
      colorId: item.colorId ?? "0",
      isAllDay,
    }
  })
}
