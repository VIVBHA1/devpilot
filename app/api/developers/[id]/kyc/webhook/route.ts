import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyKycWebhookSignature, parseKycWebhook } from '@/lib/kyc'
import { sendKycRejected } from '@/lib/resend'
import { recomputeForDeveloper } from '@/lib/matching/computeForBrief'
import { logCandidateEvent } from '@/lib/candidateEvents'

// Provider posts here when a verification result is ready (§3 Step 4).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rawBody = await req.text()
  const signature = req.headers.get('x-kyc-signature') || req.headers.get('x-digio-signature') || ''

  if (!verifyKycWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = parseKycWebhook(payload)
  if (result.status === 'pending') {
    return NextResponse.json({ received: true, note: 'still pending' })
  }

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {
    id_verification_status: result.status,
  }
  if (result.status === 'verified') {
    updates.kyc_verified_at = new Date().toISOString()
    updates.kyc_rejection_reason = null
  } else {
    updates.kyc_rejection_reason = result.rejectionReason ?? 'Verification failed'
  }

  const { data: dev } = await supabase
    .from('developers')
    .update(updates)
    .eq('id', id)
    .select('full_name, email')
    .single()

  // On rejection, notify the developer with a generic reason + re-upload link (§3 Step 5)
  if (result.status === 'rejected' && dev) {
    sendKycRejected({ full_name: dev.full_name, email: dev.email, developer_id: id }).catch(console.error)
  }

  recomputeForDeveloper(id).catch(console.error)
  logCandidateEvent(id, result.status === 'verified' ? 'kyc_verified' : 'kyc_rejected', 'system', { provider: 'webhook' }).catch(console.error)

  return NextResponse.json({ received: true, status: result.status })
}
