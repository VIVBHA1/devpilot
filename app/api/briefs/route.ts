import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeMatchScoresForBrief } from '@/lib/matching/computeForBrief'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

const attachment = z.object({
  file_url: z.string(),
  file_name: z.string().optional(),
  file_type: z.string().optional(),
  parsed_fields: z.record(z.string(), z.unknown()).optional(),
})
const skillTag = z.object({
  skill_tool_id: z.string().uuid(),
  requirement_type: z.enum(['required', 'preferred']).optional(),
})

const schema = z.object({
  role_type: z.enum(['Full-Stack', 'Cloud', 'DevOps', 'Both']),
  title: z.string().min(3),
  description: z.string().min(50),
  project_type: z.enum(['fixed', 'hourly']),
  experience_level_required: z.enum(['Junior', 'Mid', 'Senior', 'Any']),
  tech_stack: z.array(z.string()).optional(),
  duration_weeks: z.coerce.number().min(1),
  weekly_hours: z.coerce.number().refine((v) => v === 20 || v === 40),
  start_date: z.string().optional(),
  budget_min: z.coerce.number().optional(),
  budget_max: z.coerce.number().optional(),
  is_negotiable: z.boolean().optional(),
  priority: z.enum(['urgent', 'high', 'standard']).optional(),
  source_type: z.enum(['manual_form', 'pdf_upload', 'doc_upload', 'forwarded_email']).optional(),
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  referral: z.string().optional(),
  attachments: z.array(attachment).optional(),
  skill_tags: z.array(skillTag).optional(),
})

// GET — list briefs with their shortlisted developers (for buyer dashboard negotiation panel).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  const supabase = createAdminClient()
  let query = supabase
    .from('briefs')
    .select('*, buyers(company_name, contact_name, company_email), shortlists(id, status, position, developer_id, developers(full_name, primary_role, slug))')
    .in('status', ['shortlisted', 'matching', 'contracted'])
    .order('created_at', { ascending: false })

  // Optionally scope to a buyer's email (MVP dashboards pass this).
  if (email) {
    const { data: buyer } = await supabase.from('buyers').select('id').eq('company_email', email).single()
    if (buyer) query = query.eq('buyer_id', buyer.id)
    else return NextResponse.json([])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const supabase = createAdminClient()

    // Upsert buyer
    const { data: buyer, error: buyerError } = await supabase
      .from('buyers')
      .upsert(
        { company_name: data.company_name, company_email: data.email, contact_name: data.contact_name },
        { onConflict: 'company_email' }
      )
      .select('id')
      .single()

    if (buyerError) throw buyerError

    // Create brief
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .insert({
        buyer_id: buyer.id,
        role_type: data.role_type,
        title: data.title,
        description: data.description,
        project_type: data.project_type,
        experience_level_required: data.experience_level_required,
        tech_stack: data.tech_stack ?? [],
        duration_weeks: data.duration_weeks,
        weekly_hours: data.weekly_hours as 20 | 40,
        start_date: data.start_date || null,
        budget_min: data.budget_min ?? null,
        budget_max: data.budget_max ?? null,
        is_negotiable: data.is_negotiable ?? true,
        priority: data.priority ?? 'standard',
        source_type: data.source_type ?? 'manual_form',
        status: 'open',
      })
      .select('id')
      .single()

    if (briefError) throw briefError

    // Store attachments (§5 §2.9) — parsed_fields carries the raw AI extraction, kept for
    // audit even after the company edits a field on review. §Prompt 18.
    if (data.attachments?.length) {
      await supabase.from('brief_attachments').insert(
        data.attachments.map((a) => ({
          brief_id: brief.id,
          file_url: a.file_url,
          file_name: a.file_name || null,
          file_type: a.file_type || null,
          parsed_fields: a.parsed_fields ?? null,
        }))
      )
    }

    // Skill taxonomy tags (§Prompt 13)
    if (data.skill_tags?.length) {
      await supabase.from('brief_skill_tags').insert(
        data.skill_tags.map((t) => ({
          brief_id: brief.id,
          skill_tool_id: t.skill_tool_id,
          requirement_type: t.requirement_type ?? 'required',
        }))
      )
    }

    // Compute initial match scores (§Prompt 14) — fire-and-forget, never blocks the response.
    computeMatchScoresForBrief(brief.id).catch(console.error)

    // Notify admin
    getResend().emails.send({
      from: process.env.EMAIL_FROM || 'noreply@devpilot.in',
      to: process.env.ADMIN_EMAIL!,
      subject: `New brief: ${data.role_type} from ${data.company_name}`,
      html: `<p><strong>${data.contact_name}</strong> at <strong>${data.company_name}</strong> posted a new brief.</p>
<p><strong>Role:</strong> ${data.role_type}<br>
<strong>Duration:</strong> ${data.duration_weeks} weeks at ${data.weekly_hours} hrs/week<br>
<strong>Description:</strong> ${data.description}</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/briefs/${brief.id}">Review brief in admin →</a></p>`,
    }).catch(console.error)

    return NextResponse.json({ id: brief.id }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data', details: e.issues }, { status: 400 })
    }
    console.error('Brief POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
