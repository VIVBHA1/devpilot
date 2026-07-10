import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  await supabase
    .from('milestones')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', id)
  return NextResponse.json({ success: true })
}
