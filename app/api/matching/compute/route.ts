import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { computeMatchScoresForBrief } from '@/lib/matching/computeForBrief'

const schema = z.object({ brief_id: z.string().uuid() })

// Computes and upserts match_scores for every approved, visible developer whose
// job_interests overlaps the brief's role_type. §Prompt 14.
export async function POST(req: NextRequest) {
  try {
    const { brief_id } = schema.parse(await req.json())
    const result = await computeMatchScoresForBrief(brief_id)
    if ('error' in result) return NextResponse.json(result, { status: 404 })
    return NextResponse.json(result)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 })
    }
    console.error('Matching compute error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
