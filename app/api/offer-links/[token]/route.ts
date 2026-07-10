import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { acceptOffer } from '@/lib/negotiations/acceptOffer'

async function loadLink(token: string) {
  const supabase = createAdminClient()
  const { data: link } = await supabase
    .from('offer_links')
    .select('*, brief_negotiations(id, brief_id, shortlist_id, proposed_rate, proposed_start_date, message)')
    .eq('token', token)
    .single()
  return link
}

function negotiationOf(link: NonNullable<Awaited<ReturnType<typeof loadLink>>>) {
  const neg = link.brief_negotiations
  return Array.isArray(neg) ? neg[0] : neg
}

// GET — the offer details for the candidate response page. Single-use, time-boxed. §Prompt 20.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const link = await loadLink(token)
  if (!link) return NextResponse.json({ valid: false, reason: 'not_found' })
  if (link.used_at) return NextResponse.json({ valid: false, reason: 'used' })
  if (new Date(link.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: 'expired' })

  const negotiation = negotiationOf(link)
  const supabase = createAdminClient()
  const { data: brief } = await supabase
    .from('briefs')
    .select('title, buyers(company_name)')
    .eq('id', negotiation.brief_id)
    .single()
  const buyer = brief && (Array.isArray(brief.buyers) ? brief.buyers[0] : brief.buyers)

  return NextResponse.json({
    valid: true,
    offer: {
      role_title: brief?.title,
      company_name: buyer?.company_name,
      proposed_rate: negotiation.proposed_rate,
      proposed_start_date: negotiation.proposed_start_date,
      message: negotiation.message,
    },
  })
}

const schema = z.object({
  action: z.enum(['accept', 'reject', 'counter']),
  proposed_rate: z.coerce.number().optional(),
  proposed_start_date: z.string().optional(),
  message: z.string().optional(),
})

// POST — candidate accepts, rejects, or counters. Single-use: the link is marked used_at
// regardless of which action is taken. §Prompt 20.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = schema.parse(await req.json())
    const link = await loadLink(token)
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    if (link.used_at) return NextResponse.json({ error: 'This link has already been used.' }, { status: 410 })
    if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'This link has expired.' }, { status: 410 })

    const negotiation = negotiationOf(link)
    const supabase = createAdminClient()

    if (body.action === 'accept') {
      const result = await acceptOffer({
        briefId: negotiation.brief_id,
        shortlistId: negotiation.shortlist_id,
        negotiationId: negotiation.id,
        acceptedBy: 'developer',
      })
      if ('error' in result) return NextResponse.json(result, { status: 409 })
      await supabase.from('offer_links').update({ used_at: new Date().toISOString() }).eq('token', token)
      return NextResponse.json({ accepted: true, engagement_id: result.engagementId })
    }

    if (body.action === 'reject') {
      await supabase.from('brief_negotiations').insert({
        brief_id: negotiation.brief_id,
        shortlist_id: negotiation.shortlist_id,
        proposed_by: 'developer',
        proposed_rate: negotiation.proposed_rate,
        proposed_start_date: negotiation.proposed_start_date,
        message: 'Candidate rejected the offer.',
        status: 'rejected',
      })
      await supabase.from('offer_links').update({ used_at: new Date().toISOString() }).eq('token', token)
      return NextResponse.json({ rejected: true })
    }

    // counter
    if (!body.proposed_rate) return NextResponse.json({ error: 'A counter needs a proposed rate' }, { status: 400 })
    await supabase.from('brief_negotiations').insert({
      brief_id: negotiation.brief_id,
      shortlist_id: negotiation.shortlist_id,
      proposed_by: 'developer',
      proposed_rate: body.proposed_rate,
      proposed_start_date: body.proposed_start_date || null,
      message: body.message || null,
      status: 'countered',
    })
    await supabase.from('offer_links').update({ used_at: new Date().toISOString() }).eq('token', token)
    return NextResponse.json({ countered: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    console.error('Offer link respond error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
