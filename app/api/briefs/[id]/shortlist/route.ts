import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendShortlistReady } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { developer_ids } = await req.json()

    if (!Array.isArray(developer_ids) || developer_ids.length !== 3) {
      return NextResponse.json({ error: 'Exactly 3 developer IDs required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch brief + buyer
    const { data: brief } = await supabase
      .from('briefs')
      .select('*, buyers(company_name, contact_name, company_email)')
      .eq('id', id)
      .single()

    if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

    // Delete existing shortlists for this brief
    await supabase.from('shortlists').delete().eq('brief_id', id)

    // Insert 3 shortlists
    const rows = developer_ids.map((dev_id: string, i: number) => ({
      brief_id: id,
      developer_id: dev_id,
      position: (i + 1) as 1 | 2 | 3,
      status: 'pending' as const,
    }))
    await supabase.from('shortlists').insert(rows)

    // Update brief status
    await supabase.from('briefs').update({ status: 'shortlisted', matched_at: new Date().toISOString() }).eq('id', id)

    // Fetch developer details for email
    const { data: developers } = await supabase
      .from('developers')
      .select('full_name, primary_role, slug')
      .in('id', developer_ids)

    const buyer = Array.isArray(brief.buyers) ? brief.buyers[0] : brief.buyers
    if (buyer && developers) {
      sendShortlistReady(
        { contact_name: buyer.contact_name, company_email: buyer.company_email, company_name: buyer.company_name },
        { title: brief.title, id },
        developers as Array<{ full_name: string; primary_role: string; slug: string }>
      ).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Shortlist error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
