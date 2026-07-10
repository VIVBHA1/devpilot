import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseBriefDocument } from '@/lib/parseDocument'

const schema = z.object({
  text: z.string().optional(),
  file_url: z.string().optional(),
  file_type: z.string().optional(),
})

// Parses an uploaded JD/forwarded-email body into structured fields the company reviews
// and edits before publishing — never written straight into a published brief. §Prompt 18.
export async function POST(req: NextRequest) {
  try {
    const { text, file_url, file_type } = schema.parse(await req.json())
    const parsed = await parseBriefDocument({ text, fileUrl: file_url, fileType: file_type })
    return NextResponse.json({ parsed })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('Brief parse error:', e)
    return NextResponse.json({ error: 'Parsing failed — please fill in the fields manually.' }, { status: 500 })
  }
}
