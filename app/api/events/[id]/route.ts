import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateEvent, deleteEvent } from "@/lib/google-calendar"
import { checkRateLimit } from "@/lib/rate-limit"

const VALID_COLOR_IDS = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"])
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowed = await checkRateLimit(`events:${session.user?.email ?? "shared"}`)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, start, end, colorId } = body

    if (!title || !start || !end || !colorId) {
      return NextResponse.json({ error: "title, start, end, colorId required" }, { status: 400 })
    }
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json({ error: "title must be 1–200 characters" }, { status: 400 })
    }
    if (!ISO_DATETIME_RE.test(start) || !ISO_DATETIME_RE.test(end)) {
      return NextResponse.json({ error: "start and end must be ISO 8601 format" }, { status: 400 })
    }
    if (!VALID_COLOR_IDS.has(String(colorId))) {
      return NextResponse.json({ error: "Invalid colorId" }, { status: 400 })
    }

    const event = await updateEvent(session.accessToken, id, {
      title: title.trim(),
      start,
      end,
      colorId: String(colorId),
    })
    return NextResponse.json(event)
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowed = await checkRateLimit(`events:${session.user?.email ?? "shared"}`)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params
    await deleteEvent(session.accessToken, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error instanceof Error ? error.message : "Unknown")
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
