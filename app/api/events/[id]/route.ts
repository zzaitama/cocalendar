import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateEvent, deleteEvent } from "@/lib/google-calendar"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, start, end, colorId } = body

    if (!title || !start || !end || !colorId) {
      return NextResponse.json(
        { error: "title, start, end, colorId required" },
        { status: 400 }
      )
    }

    const event = await updateEvent(session.accessToken, params.id, {
      title,
      start,
      end,
      colorId,
    })
    return NextResponse.json(event)
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await deleteEvent(session.accessToken, params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
