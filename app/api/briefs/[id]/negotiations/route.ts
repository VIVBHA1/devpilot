import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — list negotiation history for a brief (optionally one shortlist).
// Immutable, insert-only per business rule §7.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const shortlistId = searchParams.get('shortlist_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('brief_negotiations')
    .select('*')
    .eq('brief_id', id)
    .order('created_at', { ascending: true })
  if (shortlistId) query = query.eq('shortlist_id', shortlistId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const schema = z.object({
  shortlist_id: z.string().uuid(),
  proposed_by: z.enum(['buyer', 'developer', 'admin']),
  proposed_rate: z.coerce.number().min(1),
  proposed_start_date: z.string().optional(),
  message: z.string().optional(),
})

// POST — record a new offer (insert-only). A counter is just another row.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: row, error } = await supabase
      .from('brief_negotiations')
      .insert({
        brief_id: id,
        shortlist_id: data.shortlist_id,
        proposed_by: data.proposed_by,
        proposed_rate: data.proposed_rate,
        proposed_start_date: data.proposed_start_date || null,
        message: data.message || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    // Mark the brief as matching/negotiating if still open
    await supabase.from('briefs').update({ status: 'matching' }).eq('id', id).eq('status', 'open')

    return NextResponse.json({ id: row.id }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid offer', details: e.issues }, { status: 400 })
    console.error('Negotiation POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
