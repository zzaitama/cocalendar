import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'screensaver-photos')

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const safe = path.basename(filename)
    const filePath = path.join(PHOTOS_DIR, safe)

    if (!filePath.startsWith(PHOTOS_DIR + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    fs.unlinkSync(filePath)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
