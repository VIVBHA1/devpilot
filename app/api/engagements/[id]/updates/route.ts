import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: engagement } = await supabase
    .from('engagements')
    .select('weekly_updates')
    .eq('id', id)
    .single()

  if (!engagement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates = (engagement.weekly_updates as object[]) ?? []
  updates.push({ date: new Date().toISOString(), text: text.trim(), author: 'Developer' })

  await supabase.from('engagements').update({ weekly_updates: updates }).eq('id', id)
  return NextResponse.json({ success: true })
}
