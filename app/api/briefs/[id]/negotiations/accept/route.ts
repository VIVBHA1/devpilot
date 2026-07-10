import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { acceptOffer } from '@/lib/negotiations/acceptOffer'

// Accept the latest offer for a shortlisted developer.
// Immutable history: we INSERT an acceptance row rather than editing prior ones,
// then move the shortlist to 'contracted' and create the engagement (Part A flow).
const schema = z.object({
  shortlist_id: z.string().uuid(),
  negotiation_id: z.string().uuid(),
  accepted_by: z.enum(['buyer', 'admin']).default('buyer'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = schema.parse(await req.json())

    const result = await acceptOffer({
      briefId: id,
      shortlistId: data.shortlist_id,
      negotiationId: data.negotiation_id,
      acceptedBy: data.accepted_by,
    })
    if ('error' in result) return NextResponse.json(result, { status: 404 })

    return NextResponse.json({ engagement_id: result.engagementId }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 })
    console.error('Accept offer error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
