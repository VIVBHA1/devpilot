import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanySession } from '@/lib/auth/companySession'

const schema = z.object({
  developer_id: z.string().uuid(),
  profile_quality: z.number().int().min(1).max(5),
  presentability: z.number().int().min(1).max(5),
  responsiveness: z.number().int().min(1).max(5),
  expectation_match: z.number().int().min(1).max(5),
  notes: z.string().optional(),
})

// GET — existing rating for a developer on this brief, if any (used to prefill the form
// and to show the read-only locked state once an offer exists). §Prompt 19.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession()
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const developerId = searchParams.get('developer_id')
  if (!developerId) return NextResponse.json({ error: 'developer_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('candidate_screening_ratings')
    .select('*')
    .eq('brief_id', id)
    .eq('developer_id', developerId)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

// POST — create or update a screening rating. Rejected once locked (an offer exists). §Prompt 19.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession()
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (session.companyUser.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot submit ratings' }, { status: 403 })
  }

  try {
    const { id } = await params
    const data = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('candidate_screening_ratings')
      .select('locked_at')
      .eq('brief_id', id)
      .eq('developer_id', data.developer_id)
      .maybeSingle()

    if (existing?.locked_at) {
      return NextResponse.json({ error: 'This rating is locked — an offer has already been sent.' }, { status: 409 })
    }

    const { error } = await supabase
      .from('candidate_screening_ratings')
      .upsert(
        {
          brief_id: id,
          developer_id: data.developer_id,
          rated_by: session.companyUser.id,
          profile_quality: data.profile_quality,
          presentability: data.presentability,
          responsiveness: data.responsiveness,
          expectation_match: data.expectation_match,
          notes: data.notes || null,
        },
        { onConflict: 'brief_id,developer_id' }
      )

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    console.error('Screening rating error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
