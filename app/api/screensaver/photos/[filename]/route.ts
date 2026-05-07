import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'
import { kv } from '@/lib/redis'
import type { PhotoMeta } from '@/types'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { filename } = await params
    // filename is the URL-decoded Cloudinary public_id, e.g. "cocalendar-screensaver/abc123"

    await cloudinary.uploader.destroy(filename)

    const existing = await kv.get<PhotoMeta[]>('screensaver:photos') ?? []
    await kv.set('screensaver:photos', existing.filter(p => p.id !== filename))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
