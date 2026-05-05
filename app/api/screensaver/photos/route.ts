import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'screensaver-photos')
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])
const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_BATCH = 20

function ensureDir() {
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true })
}

export async function GET() {
  try {
    ensureDir()
    const files = fs.readdirSync(PHOTOS_DIR).filter(f =>
      IMAGE_EXTS.has(path.extname(f).toLowerCase())
    )
    return NextResponse.json(files)
  } catch {
    return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDir()
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    if (files.length > MAX_BATCH) {
      return NextResponse.json({ error: `Max ${MAX_BATCH} files per upload` }, { status: 400 })
    }

    const results = []
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()
      if (!IMAGE_EXTS.has(ext) || file.size > MAX_FILE_SIZE) continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const processed = await sharp(buffer)
        .rotate()
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      const { width = 0, height = 0 } = await sharp(processed).metadata()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      fs.writeFileSync(path.join(PHOTOS_DIR, filename), processed)
      results.push({ filename, url: `/screensaver-photos/${filename}`, width, height })
    }

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
