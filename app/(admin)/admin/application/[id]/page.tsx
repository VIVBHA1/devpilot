'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Copy, Check, Loader2, ShieldCheck, ShieldAlert, ShieldX, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatINR } from '@/lib/utils'
import type {
  Developer, DeveloperStatusValue, IdVerificationStatusValue,
  WorkHistory, PortfolioItem, Certification, SkillTest, DeveloperReference, RateCard,
} from '@/types/database'

type DeveloperFull = Developer & {
  developer_work_history?: WorkHistory[]
  developer_portfolio_items?: PortfolioItem[]
  developer_certifications?: Certification[]
  developer_skill_tests?: SkillTest[]
  developer_references?: DeveloperReference[]
  developer_rate_cards?: RateCard[]
  id_doc_signed_url?: string | null
}

type Transition = {
  label: string
  next: DeveloperStatusValue
  destructive?: boolean
}

const KYC_UI: Record<IdVerificationStatusValue, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  not_started: { label: 'Not started', cls: 'bg-gray-100 text-gray-600', Icon: ShieldAlert },
  pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700', Icon: ShieldAlert },
  verified: { label: 'Verified', cls: 'bg-green-100 text-green-700', Icon: ShieldCheck },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', Icon: ShieldX },
}

const TRANSITIONS: Record<string, Transition[]> = {
  applied: [{ label: 'Start Screening', next: 'screening' }],
  screening: [{ label: 'Send Code Test', next: 'code_test' }],
  code_test: [{ label: 'Schedule Design Call', next: 'design_call' }],
  design_call: [{ label: 'Begin Reference Check', next: 'reference_check' }],
  reference_check: [{ label: 'Approve Developer', next: 'approved' }],
}

const TECH_COLORS: Record<string, string> = {
  React: 'bg-blue-100 text-blue-700',
  'Next.js': 'bg-gray-900 text-white',
  'Vue.js': 'bg-green-100 text-green-700',
  AWS: 'bg-orange-100 text-orange-700',
  GCP: 'bg-blue-100 text-blue-700',
  Azure: 'bg-blue-200 text-blue-800',
  Docker: 'bg-blue-100 text-blue-700',
  Kubernetes: 'bg-blue-600 text-white',
  Terraform: 'bg-purple-100 text-purple-700',
  'Node.js': 'bg-green-100 text-green-700',
  Python: 'bg-yellow-100 text-yellow-700',
  PostgreSQL: 'bg-blue-100 text-blue-700',
  MongoDB: 'bg-green-100 text-green-700',
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [developer, setDeveloper] = useState<DeveloperFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [kycLoading, setKycLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState<Date | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Senior' | 'Lead' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ label: string; next: DeveloperStatusValue } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchDeveloper = useCallback(async () => {
    const res = await fetch(`/api/developers/${id}`)
    if (res.ok) {
      const dev = await res.json()
      setDeveloper(dev)
      setNotes(dev.vetting_notes || '')
      setSelectedTier(dev.tier || null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDeveloper() }, [fetchDeveloper])

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/developers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vetting_notes: notes }),
    })
    setNotesSaved(new Date())
    setSavingNotes(false)
  }

  const applyTransition = async (transition: Transition) => {
    if (transition.next === 'approved' && !selectedTier) {
      alert('Please select a tier before approving.')
      return
    }
    setActionLoading(true)
    setConfirmModal(null)
    const payload: Record<string, unknown> = { status: transition.next }
    if (transition.next === 'approved' && selectedTier) payload.tier = selectedTier
    const res = await fetch(`/api/developers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(body.error || 'Action failed')
    }
    await fetchDeveloper()
    setActionLoading(false)
  }

  const kycOverride = async (action: 'verify' | 'reject') => {
    setKycLoading(true)
    await fetch(`/api/developers/${id}/kyc/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: action === 'reject' ? 'Rejected by admin during review' : undefined }),
    })
    await fetchDeveloper()
    setKycLoading(false)
  }

  const copyProfileUrl = () => {
    if (!developer?.slug) return
    navigator.clipboard.writeText(`${window.location.origin}/developers/${developer.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }
  if (!developer) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Developer not found.</div>
  }

  const transitions = TRANSITIONS[developer.status] ?? []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devpilot.in'
  const kyc = KYC_UI[developer.id_verification_status] ?? KYC_UI.not_started
  const refCount = developer.developer_references?.length ?? 0
  const canApprove = developer.id_verification_status === 'verified' && refCount >= 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Nav */}
      <nav className="bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Back to Applications</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Developer Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{developer.full_name}</h1>
                  <p className="text-gray-500 mt-0.5">{developer.city}</p>
                </div>
                <StatusBadge status={developer.status} size="md" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoRow label="Email" value={<a href={`mailto:${developer.email}`} className="text-[#2563EB]">{developer.email}</a>} />
                <InfoRow label="Phone" value={developer.phone || '—'} />
                <InfoRow label="Date of Birth" value={developer.date_of_birth ? new Date(developer.date_of_birth).toLocaleDateString('en-IN') : '—'} />
                <InfoRow label="Gender" value={developer.gender || '—'} />
                <InfoRow label="Location" value={[developer.city, developer.state, developer.country].filter(Boolean).join(', ')} />
                <InfoRow label="Role" value={developer.primary_role} />
                <InfoRow label="Experience" value={`${developer.years_exp}+ years`} />
                <InfoRow label="Hours" value={`${developer.weekly_hours} hrs/week`} />
                <InfoRow label="Available" value={developer.available_from ? new Date(developer.available_from).toLocaleDateString('en-IN') : '—'} />
                <InfoRow
                  label="Rate (summary)"
                  value={developer.monthly_rate_min && developer.monthly_rate_max
                    ? `${formatINR(developer.monthly_rate_min)} – ${formatINR(developer.monthly_rate_max)}/mo`
                    : '—'}
                />
                <InfoRow label="Job Interests" value={developer.job_interests?.join(', ') || '—'} />
                <InfoRow label="Location Interests" value={developer.location_interests?.join(', ') || '—'} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {developer.linkedin_url && (
                  <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50">
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {developer.github_url && (
                  <a href={developer.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
                    GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {developer.portfolio_url && (
                  <a href={developer.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
                    Portfolio <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {developer.tech_stack.map((t) => (
                  <span key={t} className={`px-2.5 py-1 rounded-full text-xs font-medium ${TECH_COLORS[t] ?? 'bg-gray-100 text-gray-700'}`}>{t}</span>
                ))}
              </div>
            </div>

            {/* Rate Cards */}
            {developer.developer_rate_cards && developer.developer_rate_cards.length > 0 && (
              <Panel title="Rate Cards">
                <div className="space-y-2">
                  {developer.developer_rate_cards.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-gray-700">{r.skill_or_role} <span className="text-gray-400">· {r.engagement_type}</span></span>
                      <span className="font-medium text-gray-900">{r.rate_amount ? formatINR(r.rate_amount) : '—'}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Work History */}
            {developer.developer_work_history && developer.developer_work_history.length > 0 && (
              <Panel title="Work History">
                <div className="space-y-3">
                  {developer.developer_work_history.map((w) => (
                    <div key={w.id} className="border-l-2 border-blue-100 pl-3">
                      <p className="text-sm font-medium text-gray-900">{w.role_title} · {w.company_name}</p>
                      <p className="text-xs text-gray-400">
                        {w.start_date ? new Date(w.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                        {' – '}
                        {w.end_date ? new Date(w.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}
                      </p>
                      {w.description && <p className="text-sm text-gray-600 mt-0.5">{w.description}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Portfolio */}
            {developer.developer_portfolio_items && developer.developer_portfolio_items.length > 0 && (
              <Panel title="Portfolio">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {developer.developer_portfolio_items.map((p) => (
                    <div key={p.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-28 object-cover" />}
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">{p.title}</p>
                        {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                        {p.project_url && <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563EB] hover:underline mt-1 inline-block">View project ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Certifications */}
            {developer.developer_certifications && developer.developer_certifications.length > 0 && (
              <Panel title="Certifications">
                <div className="space-y-2">
                  {developer.developer_certifications.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                      <div>
                        <span className="text-gray-900 font-medium">{c.name}</span>
                        {c.issuing_body && <span className="text-gray-400"> · {c.issuing_body}</span>}
                      </div>
                      {c.certificate_file_url && <a href={c.certificate_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563EB] hover:underline">View ↗</a>}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Skill Tests */}
            {developer.developer_skill_tests && developer.developer_skill_tests.length > 0 && (
              <Panel title="Skill Tests">
                <div className="space-y-2">
                  {developer.developer_skill_tests.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-gray-700">{s.skill_name} <span className="text-gray-400">· {s.test_provider}</span></span>
                      <span className="font-medium text-gray-900">{s.score != null && s.max_score != null ? `${s.score}/${s.max_score}` : '—'}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* References */}
            <Panel title={`References (${refCount})`}>
              {refCount === 0 ? (
                <p className="text-sm text-red-500">No references — required before approval.</p>
              ) : (
                <div className="space-y-2">
                  {developer.developer_references!.map((r) => (
                    <div key={r.id} className="text-sm border-b border-gray-50 pb-2 last:border-0">
                      <p className="text-gray-900 font-medium">{r.reference_name} <span className="text-gray-400 font-normal">· {r.relationship || 'Reference'}</span></p>
                      <p className="text-xs text-gray-500">{[r.company_name, r.reference_email, r.reference_phone].filter(Boolean).join(' · ')}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize mt-1 inline-block">{r.contacted_status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Vetting Notes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Internal notes <span className="font-normal text-gray-400">(not shown to developer)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add vetting notes here..."
              />
              <div className="flex items-center justify-between mt-2">
                {notesSaved && (
                  <span className="text-xs text-gray-400">
                    Last saved {notesSaved.toLocaleTimeString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Save notes
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Vetting Controls */}
          <div className="space-y-4">
            {/* KYC / Identity Verification */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identity Verification</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${kyc.cls}`}>
                  <kyc.Icon className="w-3.5 h-3.5" /> {kyc.label}
                </span>
                {developer.id_document_type && <span className="text-xs text-gray-400">{developer.id_document_type}{developer.id_document_last4 ? ` ••••${developer.id_document_last4}` : ''}</span>}
              </div>
              {developer.kyc_provider && <p className="text-xs text-gray-400 mb-1">Provider: {developer.kyc_provider}</p>}
              {developer.id_verification_status === 'rejected' && developer.kyc_rejection_reason && (
                <p className="text-xs text-red-600 mb-2">Reason: {developer.kyc_rejection_reason}</p>
              )}
              {developer.id_doc_signed_url && (
                <a href={developer.id_doc_signed_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline mb-3">
                  <Eye className="w-3.5 h-3.5" /> View ID document (private, expires in 5 min)
                </a>
              )}
              <div className="flex gap-2">
                <button onClick={() => kycOverride('verify')} disabled={kycLoading || developer.id_verification_status === 'verified'}
                  className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40">
                  Force Verify
                </button>
                <button onClick={() => kycOverride('reject')} disabled={kycLoading || developer.id_verification_status === 'rejected'}
                  className="flex-1 py-2 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40">
                  Force Reject
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Vetting Controls</h2>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Current status</p>
                <StatusBadge status={developer.status} size="md" />
              </div>

              {/* Tier selection (always visible, required for approve) */}
              {developer.status !== 'approved' && developer.status !== 'rejected' && developer.status !== 'suspended' && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Tier assignment</p>
                  <div className="space-y-2">
                    {(['Standard', 'Senior', 'Lead'] as const).map((tier) => (
                      <label key={tier} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                        selectedTier === tier ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'
                      }`}>
                        <input type="radio" name="tier" value={tier} checked={selectedTier === tier}
                          onChange={() => setSelectedTier(tier)} className="sr-only" />
                        <span className="text-sm font-medium">{tier}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval gate notice */}
              {transitions.some((t) => t.next === 'approved') && !canApprove && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  Before approval: {developer.id_verification_status !== 'verified' && 'identity must be verified'}
                  {developer.id_verification_status !== 'verified' && refCount < 1 && ' and '}
                  {refCount < 1 && 'at least one reference is required'}.
                </div>
              )}

              {/* Progression buttons */}
              <div className="space-y-2">
                {transitions.map((t) => {
                  const blocked = t.next === 'approved' && !canApprove
                  return (
                    <button
                      key={t.next}
                      onClick={() => setConfirmModal(t)}
                      disabled={actionLoading || blocked}
                      className="w-full py-2.5 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.label}
                    </button>
                  )
                })}

                {!['rejected', 'suspended'].includes(developer.status) && (
                  <button
                    onClick={() => setConfirmModal({ label: 'Reject Application', next: 'rejected' })}
                    disabled={actionLoading}
                    className="w-full py-2.5 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
              </div>

              {/* Approved profile link */}
              {developer.status === 'approved' && developer.slug && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-1">Profile live at:</p>
                  <p className="text-xs text-green-800 break-all mb-2">{appUrl}/developers/{developer.slug}</p>
                  <button
                    onClick={copyProfileUrl}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Confirm action</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to <strong>{confirmModal.label}</strong>? This action may trigger an email to the developer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => applyTransition(confirmModal)}
                className={`flex-1 py-2 text-sm font-medium text-white rounded-lg ${
                  confirmModal.next === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2563EB] hover:bg-blue-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  )
}
