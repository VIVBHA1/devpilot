import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCompanyVerificationEmail } from '@/lib/resend'

const schema = z.object({
  company_name: z.string().min(1),
  company_email: z.string().email(),
  website: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  industry: z.string().optional(),
  contact_name: z.string().min(1),
  contact_role: z.string().optional(),
})

// Lightweight "KYB" tier: work-email + company details now, a time-boxed verification
// link before the account is fully active. §Prompt 16.
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json())
    const supabase = createAdminClient()

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()

    const { data: buyer, error } = await supabase
      .from('buyers')
      .upsert(
        {
          company_name: data.company_name,
          company_email: data.company_email,
          website: data.website || null,
          company_size: data.company_size || null,
          industry: data.industry || null,
          contact_name: data.contact_name,
          contact_role: data.contact_role || null,
          email_domain_verified: false,
          email_verification_token: token,
          email_verification_expires_at: expiresAt,
        },
        { onConflict: 'company_email' }
      )
      .select('id')
      .single()

    if (error) throw error

    // Ensure an owner row exists for this email (idempotent for re-registration/resend).
    await supabase
      .from('company_users')
      .upsert(
        { buyer_id: buyer.id, email: data.company_email, role: 'owner' },
        { onConflict: 'buyer_id,email', ignoreDuplicates: true }
      )

    await sendCompanyVerificationEmail({
      contact_name: data.contact_name,
      company_email: data.company_email,
      token,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data', details: e.issues }, { status: 400 })
    }
    console.error('Register company error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
