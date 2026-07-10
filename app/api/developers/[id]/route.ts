import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApplicationApproved, sendApplicationRejected } from '@/lib/resend'
import { signedIdDocUrl } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('developers')
    .select('*, developer_work_history(*), developer_portfolio_items(*), developer_certifications(*), developer_skill_tests(*), developer_references(*), developer_rate_cards(*)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Signed URL for the private ID document (admin view only).
  let idDocSignedUrl: string | null = null
  if (data.id_document_url) {
    idDocSignedUrl = await signedIdDocUrl(data.id_document_url)
  }

  return NextResponse.json({ ...data, id_doc_signed_url: idDocSignedUrl })
}

const schema = z.object({
  status: z.string().optional(),
  tier: z.enum(['Standard', 'Senior', 'Lead']).optional(),
  vetting_notes: z.string().optional(),
  is_visible: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = schema.parse(body)

    const supabase = createAdminClient()

    const updates: Record<string, unknown> = { ...data }

    if (data.status === 'approved') {
      // Business rules §7: require ID verified + at least one reference before going live.
      const { data: dev } = await supabase
        .from('developers')
        .select('id_verification_status')
        .eq('id', id)
        .single()
      const { count: refCount } = await supabase
        .from('developer_references')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', id)

      if (dev?.id_verification_status !== 'verified') {
        return NextResponse.json({ error: 'Cannot approve: identity is not verified yet.' }, { status: 409 })
      }
      if (!refCount || refCount < 1) {
        return NextResponse.json({ error: 'Cannot approve: at least one reference is required.' }, { status: 409 })
      }

      updates.is_visible = true
      updates.vetted_at = new Date().toISOString()
      updates.vetted_by = process.env.ADMIN_EMAIL ?? 'admin'
    }

    const { data: developer, error } = await supabase
      .from('developers')
      .update(updates)
      .eq('id', id)
      .select('full_name, email, primary_role, slug, status')
      .single()

    if (error) throw error

    // Send status emails
    if (data.status === 'approved' && developer.slug) {
      sendApplicationApproved({
        full_name: developer.full_name,
        email: developer.email,
        slug: developer.slug,
      }).catch(console.error)
    } else if (data.status === 'rejected') {
      sendApplicationRejected({
        full_name: developer.full_name,
        email: developer.email,
        primary_role: developer.primary_role,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    console.error('Developer PATCH error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
