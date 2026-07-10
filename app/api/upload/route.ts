import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, type UploadKind } from '@/lib/storage'

const ALLOWED: UploadKind[] = ['id-doc', 'portfolio', 'certificate', 'video', 'brief-attachment', 'skill-cert', 'brief-jd-doc']
const MAX_BYTES = 25 * 1024 * 1024 // 25MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const kind = form.get('kind') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!kind || !ALLOWED.includes(kind as UploadKind)) {
      return NextResponse.json({ error: 'Invalid upload kind' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 413 })
    }

    const { path, url } = await uploadFile(kind as UploadKind, file)

    // For private id docs, return the storage path (not a public URL).
    return NextResponse.json({ path, url })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
