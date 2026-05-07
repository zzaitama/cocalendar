import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEvents, createEvent } from "@/lib/google-calendar"
import { checkRateLimit } from "@/lib/rate-limit"

const VALID_COLOR_IDS = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"])
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = request.nextUrl
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    if (!start || !end) {
      return NextResponse.json({ error: "start and end query params required" }, { status: 400 })
    }
    if (!ISO_DATETIME_RE.test(start) || !ISO_DATETIME_RE.test(end)) {
      return NextResponse.json({ error: "start and end must be ISO 8601 format" }, { status: 400 })
    }
    const events = await getEvents(session.accessToken, start, end)
    return NextResponse.json(events)
  } catch (error) {
    console.error("GET /api/events error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const allowed = await checkRateLimit(`events:${session.user?.email ?? "shared"}`)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
    const body = await request.json()
    const { title, start, end, colorId, isAllDay, description } = body

    if (!title || !start || !end || !colorId) {
      return NextResponse.json({ error: "title, start, end, colorId required" }, { status: 400 })
    }
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json({ error: "title must be 1–200 characters" }, { status: 400 })
    }
    const dateOk = isAllDay ? ISO_DATE_RE.test(start) && ISO_DATE_RE.test(end) : ISO_DATETIME_RE.test(start) && ISO_DATETIME_RE.test(end)
    if (!dateOk) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }
    if (!VALID_COLOR_IDS.has(String(colorId))) {
      return NextResponse.json({ error: "Invalid colorId" }, { status: 400 })
    }

    const event = await createEvent(session.accessToken, {
      title: title.trim(),
      start,
      end,
      colorId: String(colorId),
      isAllDay: Boolean(isAllDay),
      description: typeof description === "string" ? description.trim() : undefined,
    })
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("POST /api/events error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
