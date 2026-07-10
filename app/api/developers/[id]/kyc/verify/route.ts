import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKycRejected } from '@/lib/resend'
import { recomputeForDeveloper } from '@/lib/matching/computeForBrief'
import { logCandidateEvent } from '@/lib/candidateEvents'

// Admin manual override — Force Verify / Force Reject (§6 admin panel).
const schema = z.object({
  action: z.enum(['verify', 'reject']),
  reason: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action, reason } = schema.parse(await req.json())
    const supabase = createAdminClient()

    const updates: Record<string, unknown> =
      action === 'verify'
        ? { id_verification_status: 'verified', kyc_verified_at: new Date().toISOString(), kyc_rejection_reason: null, kyc_provider: 'admin_override' }
        : { id_verification_status: 'rejected', kyc_rejection_reason: reason || 'Rejected by admin' }

    const { data: dev } = await supabase
      .from('developers')
      .update(updates)
      .eq('id', id)
      .select('full_name, email')
      .single()

    if (action === 'reject' && dev) {
      sendKycRejected({ full_name: dev.full_name, email: dev.email, developer_id: id }).catch(console.error)
    }

    // Verification status feeds the trust_score factor. §Prompt 14.
    recomputeForDeveloper(id).catch(console.error)
    logCandidateEvent(id, action === 'verify' ? 'kyc_verified' : 'kyc_rejected', 'admin', { reason }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    console.error('KYC override error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
