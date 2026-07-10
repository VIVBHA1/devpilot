import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('briefs')
    .select('*, buyers(company_name, contact_name, company_email), shortlists(id, status, position, developer_id, developers(full_name, primary_role, slug)), brief_attachments(id, file_url, file_name, file_type)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
