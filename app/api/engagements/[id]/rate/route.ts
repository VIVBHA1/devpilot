import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRatingNotification } from '@/lib/resend'

const schema = z.object({
  rating_quality: z.number().min(1).max(5),
  rating_communication: z.number().min(1).max(5),
  rating_deadlines: z.number().min(1).max(5),
  rating_scope: z.number().min(1).max(5),
  rating_rehire: z.number().min(1).max(5),
  rating_comment: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = schema.parse(body)

    const supabase = createAdminClient()

    const overall = (
      data.rating_quality +
      data.rating_communication +
      data.rating_deadlines +
      data.rating_scope +
      data.rating_rehire
    ) / 5

    // Update engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .update({
        ...data,
        rating_overall: overall,
        rated_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', id)
      .select('developer_id, buyers(company_name)')
      .single()

    if (!engagement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Mark final milestone paid
    const { data: milestones } = await supabase
      .from('milestones')
      .select('id')
      .eq('engagement_id', id)
      .order('due_date', { ascending: false })
      .limit(1)

    if (milestones?.length) {
      await supabase
        .from('milestones')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', milestones[0].id)
    }

    // Update developer stats
    const { data: devEngagements } = await supabase
      .from('engagements')
      .select('rating_overall')
      .eq('developer_id', engagement.developer_id)
      .not('rating_overall', 'is', null)

    if (devEngagements) {
      const avgScore = devEngagements.reduce((acc, e) => acc + (e.rating_overall ?? 0), 0) / devEngagements.length
      await supabase
        .from('developers')
        .update({
          profile_score: Math.round(avgScore * 10) / 10,
          total_engagements: devEngagements.length,
        })
        .eq('id', engagement.developer_id)
    }

    // Notify developer
    const { data: dev } = await supabase
      .from('developers')
      .select('full_name, email')
      .eq('id', engagement.developer_id)
      .single()

    const buyer = Array.isArray(engagement.buyers) ? engagement.buyers[0] : engagement.buyers

    if (dev && buyer) {
      sendRatingNotification({
        full_name: dev.full_name,
        email: dev.email,
        rating: overall,
        company_name: buyer.company_name,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid ratings' }, { status: 400 })
    console.error('Rate error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
