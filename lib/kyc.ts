// ============================================================
// KYC provider abstraction (Design Change #1 §3)
// Supports Digio / Signzy. Falls back to a sandbox mock when no
// provider keys are configured, so local dev + build never break.
// ============================================================

export type KycResult = {
  provider: string
  referenceId: string
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
}

export type KycSubmission = {
  fullName: string
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License'
  documentUrl: string
  documentLast4?: string
  dateOfBirth?: string | null
}

const PROVIDER = (process.env.KYC_PROVIDER || 'sandbox').toLowerCase()

function isConfigured(): boolean {
  if (PROVIDER === 'digio') return !!(process.env.DIGIO_CLIENT_ID && process.env.DIGIO_CLIENT_SECRET)
  if (PROVIDER === 'signzy') return !!process.env.SIGNZY_API_KEY
  return false
}

// Kick off a verification request with the provider.
// Returns immediately with a reference id + 'pending' status.
// Real providers confirm the result asynchronously via webhook.
export async function startKycVerification(submission: KycSubmission): Promise<KycResult> {
  if (!isConfigured()) {
    // Sandbox mode: deterministic reference id, left in 'pending'.
    // Admin can Force Verify from the dashboard, or a mock webhook can flip it.
    return {
      provider: 'sandbox',
      referenceId: `sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
    }
  }

  if (PROVIDER === 'digio') return startDigio(submission)
  if (PROVIDER === 'signzy') return startSignzy(submission)

  return { provider: PROVIDER, referenceId: `unknown_${Date.now()}`, status: 'pending' }
}

// ── Digio ───────────────────────────────────────────────────
async function startDigio(submission: KycSubmission): Promise<KycResult> {
  const auth = Buffer.from(
    `${process.env.DIGIO_CLIENT_ID}:${process.env.DIGIO_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api.digio.in/client/kyc/v2/request/with_template', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_identifier: submission.fullName,
      template_name: 'DEVPILOT_ID_VERIFICATION',
      notify_customer: false,
    }),
  })

  if (!res.ok) {
    return {
      provider: 'digio',
      referenceId: `digio_err_${Date.now()}`,
      status: 'rejected',
      rejectionReason: `Digio request failed (${res.status})`,
    }
  }

  const data = await res.json()
  return { provider: 'digio', referenceId: data.id ?? `digio_${Date.now()}`, status: 'pending' }
}

// ── Signzy ──────────────────────────────────────────────────
async function startSignzy(submission: KycSubmission): Promise<KycResult> {
  const res = await fetch('https://api.signzy.app/api/v2/patrons/identities', {
    method: 'POST',
    headers: { Authorization: process.env.SIGNZY_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Identity',
      itemId: submission.documentType,
      task: 'verification',
      essentials: { documentUrl: submission.documentUrl, name: submission.fullName },
    }),
  })

  if (!res.ok) {
    return {
      provider: 'signzy',
      referenceId: `signzy_err_${Date.now()}`,
      status: 'rejected',
      rejectionReason: `Signzy request failed (${res.status})`,
    }
  }

  const data = await res.json()
  return {
    provider: 'signzy',
    referenceId: data?.result?.id ?? `signzy_${Date.now()}`,
    status: 'pending',
  }
}

// Verify an incoming webhook signature. Providers sign the raw body
// with a shared secret (KYC_WEBHOOK_SECRET).
export function verifyKycWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.KYC_WEBHOOK_SECRET
  if (!secret) return true // sandbox / not configured — accept
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto')
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// Normalize a provider webhook payload into our internal status.
export function parseKycWebhook(payload: Record<string, unknown>): {
  referenceId: string | null
  status: 'verified' | 'rejected' | 'pending'
  rejectionReason?: string
} {
  // Digio: { entities: [{ id, status }] } | Signzy: { id, result: { verified } }
  const digioId = (payload?.id as string) || ((payload?.entities as Array<{ id: string }>)?.[0]?.id ?? null)
  const rawStatus =
    (payload?.status as string) ||
    ((payload?.result as { verified?: boolean })?.verified ? 'approved' : 'failed')

  let status: 'verified' | 'rejected' | 'pending' = 'pending'
  if (['approved', 'success', 'verified', 'completed'].includes(String(rawStatus).toLowerCase())) status = 'verified'
  else if (['rejected', 'failed', 'declined'].includes(String(rawStatus).toLowerCase())) status = 'rejected'

  return {
    referenceId: digioId,
    status,
    rejectionReason: status === 'rejected' ? (payload?.reason as string) || 'Document could not be verified' : undefined,
  }
}
