import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  // Check if this is the final milestone and rating is required
  const { data: milestone } = await supabase
    .from('milestones')
    .select('engagement_id, amount_inr')
    .eq('id', id)
    .single()

  if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: allMilestones } = await supabase
    .from('milestones')
    .select('id')
    .eq('engagement_id', milestone.engagement_id)
    .order('due_date', { ascending: false })

  const isFinalMilestone = allMilestones?.[0]?.id === id

  if (isFinalMilestone) {
    const { data: engagement } = await supabase
      .from('engagements')
      .select('rated_at')
      .eq('id', milestone.engagement_id)
      .single()

    if (!engagement?.rated_at) {
      return NextResponse.json(
        { error: 'Rating required before final payment can be released.' },
        { status: 400 }
      )
    }
  }

  await supabase
    .from('milestones')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
