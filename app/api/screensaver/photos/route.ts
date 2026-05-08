import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'
import { kv } from '@/lib/redis'
import type { PhotoMeta } from '@/types'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function GET() {
  try {
    const photos = await kv.get<PhotoMeta[]>('screensaver:photos') ?? []
    return NextResponse.json(photos)
  } catch {
    return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const kioskSecret = request.headers.get("x-kiosk-secret")
    const isKioskAuth = kioskSecret !== null && kioskSecret === process.env.KIOSK_SECRET

    let uploadedBy = "kiosk"
    if (!isKioskAuth) {
      const session = await getServerSession(authOptions)
      if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      uploadedBy = session.user?.email ?? 'unknown'
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const lastDot = file.name.lastIndexOf('.')
    const ext = lastDot >= 0 ? file.name.slice(lastDot).toLowerCase() : ''
    if (!IMAGE_EXTS.has(ext)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'cocalendar-screensaver',
      transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 85, fetch_format: 'auto' }],
      resource_type: 'image',
    })

    const photo: PhotoMeta = {
      id: result.public_id,
      url: result.secure_url,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    }

    const existing = await kv.get<PhotoMeta[]>('screensaver:photos') ?? []
    await kv.set('screensaver:photos', [...existing, photo])

    return NextResponse.json(photo)
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
