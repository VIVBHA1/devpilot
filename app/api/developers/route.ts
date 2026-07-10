import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSlug } from '@/lib/utils'
import { sendApplicationReceived } from '@/lib/resend'
import { startKycVerification } from '@/lib/kyc'
import { logCandidateEvent } from '@/lib/candidateEvents'

const workHistory = z.object({
  company_name: z.string().min(1),
  role_title: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
})
const portfolioItem = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project_url: z.string().optional(),
  image_url: z.string().optional(),
  tech_stack: z.string().optional(),
})
const certification = z.object({
  name: z.string().min(1),
  issuing_body: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  certificate_file_url: z.string().optional(),
})
const skillTest = z.object({
  skill_name: z.string().min(1),
  test_provider: z.string().optional(),
  score: z.coerce.number().optional(),
  max_score: z.coerce.number().optional(),
  test_date: z.string().optional(),
  certificate_url: z.string().optional(),
})
const rateCard = z.object({
  skill_or_role: z.string().min(1),
  engagement_type: z.enum(['hourly', 'project', 'monthly']),
  rate_amount: z.coerce.number().min(1),
})
const reference = z.object({
  reference_name: z.string().min(1),
  reference_email: z.string().optional(),
  reference_phone: z.string().optional(),
  relationship: z.string().optional(),
  company_name: z.string().optional(),
})
const skillTag = z.object({
  skill_tool_id: z.string().uuid(),
  proficiency_tier: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
})

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date_of_birth: z.string().min(1),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  linkedin_url: z.string().optional().refine((v) => !v || v.includes('linkedin.com/in/'), { message: 'Must be a linkedin.com/in/ URL' }),
  github_url: z.string().optional(),
  portfolio_url: z.string().optional(),
  id_document_type: z.enum(['Aadhaar', 'PAN', 'Passport', 'Driving License']),
  id_document_path: z.string().min(1),
  id_document_last4: z.string().optional(),
  primary_role: z.enum(['Full-Stack', 'Cloud', 'Both']),
  years_exp: z.coerce.number().min(1),
  tech_stack: z.array(z.string()).min(1),
  job_interests: z.array(z.string()).min(1),
  location_interests: z.array(z.string()).min(1),
  work_history: z.array(workHistory).min(1),
  portfolio: z.array(portfolioItem).optional(),
  certifications: z.array(certification).optional(),
  skill_tests: z.array(skillTest).optional(),
  rate_cards: z.array(rateCard).min(1),
  weekly_hours: z.coerce.number().refine((v) => v === 20 || v === 40),
  available_from: z.string().min(1),
  references: z.array(reference).min(1),
  video_intro_url: z.string().optional(),
  skill_tags: z.array(skillTag).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json())
    const supabase = createAdminClient()
    const slug = generateSlug(data.full_name)

    // Rate summary fallback range (also kept in sync by DB trigger)
    const rates = data.rate_cards.map((r) => r.rate_amount)
    const rateMin = Math.min(...rates)
    const rateMax = Math.max(...rates)

    // 1. Insert developer (id doc stored as private storage path)
    const { data: developer, error } = await supabase
      .from('developers')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        city: data.city,
        state: data.state,
        country: data.country,
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || null,
        portfolio_url: data.portfolio_url || null,
        primary_role: data.primary_role,
        years_exp: data.years_exp,
        tech_stack: data.tech_stack,
        job_interests: data.job_interests,
        location_interests: data.location_interests,
        available_from: data.available_from,
        weekly_hours: data.weekly_hours as 20 | 40,
        monthly_rate_min: rateMin,
        monthly_rate_max: rateMax,
        video_intro_url: data.video_intro_url || null,
        id_document_type: data.id_document_type,
        id_document_url: data.id_document_path,
        id_document_last4: data.id_document_last4 || null,
        id_verification_status: 'pending',
        status: 'applied',
        is_visible: false,
        slug,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An application with this email already exists.' }, { status: 409 })
      }
      throw error
    }

    const devId = developer.id

    // 2. Insert child rows
    const inserts: Promise<unknown>[] = []
    inserts.push(
      supabase.from('developer_work_history').insert(
        data.work_history.map((w) => ({
          developer_id: devId,
          company_name: w.company_name,
          role_title: w.role_title,
          start_date: w.start_date || null,
          end_date: w.end_date || null,
          description: w.description || null,
        }))
      ) as unknown as Promise<unknown>
    )
    if (data.portfolio?.length) {
      inserts.push(
        supabase.from('developer_portfolio_items').insert(
          data.portfolio.map((p, i) => ({
            developer_id: devId,
            title: p.title,
            description: p.description || null,
            project_url: p.project_url || null,
            image_url: p.image_url || null,
            tech_stack: p.tech_stack ? p.tech_stack.split(',').map((t) => t.trim()).filter(Boolean) : null,
            display_order: i,
          }))
        ) as unknown as Promise<unknown>
      )
    }
    if (data.certifications?.length) {
      inserts.push(
        supabase.from('developer_certifications').insert(
          data.certifications.map((c) => ({
            developer_id: devId,
            name: c.name,
            issuing_body: c.issuing_body || null,
            issue_date: c.issue_date || null,
            expiry_date: c.expiry_date || null,
            certificate_file_url: c.certificate_file_url || null,
          }))
        ) as unknown as Promise<unknown>
      )
    }
    if (data.skill_tests?.length) {
      inserts.push(
        supabase.from('developer_skill_tests').insert(
          data.skill_tests.map((s) => ({
            developer_id: devId,
            skill_name: s.skill_name,
            test_provider: s.test_provider || 'DevPilot Internal',
            score: s.score ?? null,
            max_score: s.max_score ?? null,
            test_date: s.test_date || null,
            certificate_url: s.certificate_url || null,
          }))
        ) as unknown as Promise<unknown>
      )
    }
    inserts.push(
      supabase.from('developer_rate_cards').insert(
        data.rate_cards.map((r) => ({
          developer_id: devId,
          skill_or_role: r.skill_or_role,
          engagement_type: r.engagement_type,
          rate_amount: r.rate_amount,
        }))
      ) as unknown as Promise<unknown>
    )
    inserts.push(
      supabase.from('developer_references').insert(
        data.references.map((r) => ({
          developer_id: devId,
          reference_name: r.reference_name,
          reference_email: r.reference_email || null,
          reference_phone: r.reference_phone || null,
          relationship: r.relationship || null,
          company_name: r.company_name || null,
        }))
      ) as unknown as Promise<unknown>
    )
    if (data.skill_tags?.length) {
      inserts.push(
        supabase.from('developer_skill_tags').insert(
          data.skill_tags.map((t) => ({
            developer_id: devId,
            skill_tool_id: t.skill_tool_id,
            proficiency_tier: t.proficiency_tier ?? 'beginner',
            evidence_type: 'self_declared',
          }))
        ) as unknown as Promise<unknown>
      )
    }
    await Promise.all(inserts)

    // 3. Kick off KYC verification (§3)
    startKycVerification({
      fullName: data.full_name,
      documentType: data.id_document_type,
      documentUrl: data.id_document_path,
      documentLast4: data.id_document_last4,
      dateOfBirth: data.date_of_birth,
    })
      .then((result) =>
        supabase
          .from('developers')
          .update({
            kyc_provider: result.provider,
            kyc_reference_id: result.referenceId,
            id_verification_status: result.status,
            kyc_rejection_reason: result.rejectionReason ?? null,
          })
          .eq('id', devId)
      )
      .catch(console.error)

    // 4. Confirmation email
    sendApplicationReceived({
      full_name: data.full_name,
      email: data.email,
      primary_role: data.primary_role,
    }).catch(console.error)

    logCandidateEvent(devId, 'application_submitted', 'candidate').catch(console.error)
    logCandidateEvent(devId, 'kyc_submitted', 'candidate').catch(console.error)

    return NextResponse.json({ id: devId }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data', details: e.issues }, { status: 400 })
    }
    console.error('Developer POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const supabase = createAdminClient()
  let query = supabase.from('developers').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json(data)
}
