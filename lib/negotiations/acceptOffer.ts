import { createAdminClient } from '@/lib/supabase/admin'

// Shared accept-offer logic — used by the buyer/admin-facing accept route and the
// candidate-facing magic-link offer page, so there's one path that creates an engagement. §Prompt 20.
export async function acceptOffer(params: {
  briefId: string
  shortlistId: string
  negotiationId: string
  acceptedBy: 'buyer' | 'admin' | 'developer'
}): Promise<{ engagementId: string } | { error: string }> {
  const { briefId, shortlistId, negotiationId, acceptedBy } = params
  const supabase = createAdminClient()

  const { data: offer } = await supabase
    .from('brief_negotiations')
    .select('*')
    .eq('id', negotiationId)
    .single()
  if (!offer) return { error: 'Offer not found' }

  const { data: brief } = await supabase.from('briefs').select('*').eq('id', briefId).single()
  const { data: shortlist } = await supabase.from('shortlists').select('*').eq('id', shortlistId).single()
  if (!brief || !shortlist) return { error: 'Brief/shortlist not found' }

  await supabase.from('brief_negotiations').insert({
    brief_id: briefId,
    shortlist_id: shortlistId,
    proposed_by: acceptedBy,
    proposed_rate: offer.proposed_rate,
    proposed_start_date: offer.proposed_start_date,
    message: 'Offer accepted',
    status: 'accepted',
  })

  await supabase.from('shortlists').update({ status: 'contracted' }).eq('id', shortlistId)
  await supabase
    .from('shortlists')
    .update({ status: 'declined' })
    .eq('brief_id', briefId)
    .neq('id', shortlistId)
    .eq('status', 'pending')

  await supabase.from('briefs').update({ status: 'contracted' }).eq('id', briefId)

  const startDate = offer.proposed_start_date || brief.start_date || new Date().toISOString().split('T')[0]
  const { data: engagement, error: engError } = await supabase
    .from('engagements')
    .insert({
      brief_id: briefId,
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

  if (engError) return { error: engError.message }
  return { engagementId: engagement.id }
}
