import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const supabase = createAdminClient()

    // Load the offer being accepted
    const { data: offer } = await supabase
      .from('brief_negotiations')
      .select('*')
      .eq('id', data.negotiation_id)
      .single()
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

    // Load brief + shortlist for engagement fields
    const { data: brief } = await supabase.from('briefs').select('*').eq('id', id).single()
    const { data: shortlist } = await supabase.from('shortlists').select('*').eq('id', data.shortlist_id).single()
    if (!brief || !shortlist) return NextResponse.json({ error: 'Brief/shortlist not found' }, { status: 404 })

    // 1. Insert an immutable acceptance row
    await supabase.from('brief_negotiations').insert({
      brief_id: id,
      shortlist_id: data.shortlist_id,
      proposed_by: data.accepted_by,
      proposed_rate: offer.proposed_rate,
      proposed_start_date: offer.proposed_start_date,
      message: 'Offer accepted',
      status: 'accepted',
    })

    // 2. Contract this shortlist; mark others declined
    await supabase.from('shortlists').update({ status: 'contracted' }).eq('id', data.shortlist_id)
    await supabase
      .from('shortlists')
      .update({ status: 'declined' })
      .eq('brief_id', id)
      .neq('id', data.shortlist_id)
      .eq('status', 'pending')

    // 3. Brief → contracted
    await supabase.from('briefs').update({ status: 'contracted' }).eq('id', id)

    // 4. Create engagement (Part A) with agreed terms
    const startDate = offer.proposed_start_date || brief.start_date || new Date().toISOString().split('T')[0]
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .insert({
        brief_id: id,
        developer_id: shortlist.developer_id,
        buyer_id: brief.buyer_id,
        start_date: startDate,
        weekly_hours: brief.weekly_hours,
        monthly_rate: offer.proposed_rate ?? brief.budget_max ?? 0,
        platform_fee_pct: 13.0,
        status: 'active',
      })
      .select('id')
      .single()

    if (engError) throw engError

    return NextResponse.json({ engagement_id: engagement.id }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 })
    console.error('Accept offer error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
