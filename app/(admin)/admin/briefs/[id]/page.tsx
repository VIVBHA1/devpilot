'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, X, Check, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { NegotiationPanel } from '@/components/negotiation/NegotiationPanel'
import { formatINR } from '@/lib/utils'
import type { Brief, Developer } from '@/types/database'

type ShortlistRow = {
  id: string
  status: string
  position: number | null
  developer_id: string | null
  developers?: { full_name: string; primary_role: string; slug: string } | null
}
type BriefAttachmentRow = { id: string; file_url: string; file_name: string | null; file_type: string | null }
type BriefWithBuyer = Brief & {
  buyers?: { company_name: string; contact_name: string; company_email: string }
  shortlists?: ShortlistRow[]
  brief_attachments?: BriefAttachmentRow[]
}

export default function AdminBriefDetailPage() {
  const { id } = useParams() as { id: string }
  const [brief, setBrief] = useState<BriefWithBuyer | null>(null)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [selected, setSelected] = useState<Developer[]>([])
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [briefRes, devRes] = await Promise.all([
      fetch(`/api/briefs/${id}`),
      fetch('/api/developers?status=approved'),
    ])
    if (briefRes.ok) setBrief(await briefRes.json())
    if (devRes.ok) setDevelopers(await devRes.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const toggle = (dev: Developer) => {
    setSelected((prev) => {
      if (prev.find((d) => d.id === dev.id)) return prev.filter((d) => d.id !== dev.id)
      if (prev.length >= 3) return prev
      return [...prev, dev]
    })
  }

  const confirmShortlist = async () => {
    if (selected.length !== 3) return
    setConfirming(true)
    await fetch(`/api/briefs/${id}/shortlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ developer_ids: selected.map((d) => d.id) }),
    })
    setDone(true)
    setConfirming(false)
    load()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  if (!brief) return <div className="min-h-screen flex items-center justify-center text-gray-500">Brief not found.</div>

  const buyer = Array.isArray(brief.buyers) ? brief.buyers[0] : brief.buyers

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/admin/briefs" className="text-gray-400 hover:text-white text-sm">← Back to Briefs</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brief details */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">{brief.role_type} Brief</h1>
                <StatusBadge status={brief.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <Info label="Company" value={buyer?.company_name ?? '—'} />
                <Info label="Contact" value={buyer?.contact_name ?? '—'} />
                <Info label="Email" value={buyer?.company_email ?? '—'} />
                <Info label="Duration" value={`${brief.duration_weeks} weeks`} />
                <Info label="Hours" value={`${brief.weekly_hours} hrs/week`} />
                <Info label="Budget" value={
                  brief.budget_min && brief.budget_max
                    ? `${formatINR(brief.budget_min)} – ${formatINR(brief.budget_max)}/mo`
                    : 'Not specified'
                } />
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{brief.description}</p>
              </div>
              {brief.tech_stack?.length ? (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Tech required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.tech_stack.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {brief.brief_attachments && brief.brief_attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Attachments</p>
                  <div className="space-y-1.5">
                    {brief.brief_attachments.map((a) => (
                      <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#2563EB] hover:underline">
                        <FileText className="w-4 h-4" /> {a.file_name || a.file_type || 'Attachment'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Negotiation threads for existing shortlists */}
            {brief.shortlists && brief.shortlists.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Negotiations</h2>
                <div className="space-y-4">
                  {brief.shortlists.map((s) => (
                    s.developers && (
                      <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{s.developers.full_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{s.status}</span>
                        </div>
                        <NegotiationPanel briefId={id} shortlistId={s.id} developerName={s.developers.full_name} mode="admin" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Selected panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Selected developers ({selected.length}/3)
              </h2>
              {selected.length === 0 && (
                <p className="text-sm text-gray-400">No developers selected yet.</p>
              )}
              {selected.map((dev, i) => (
                <div key={dev.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-900">{i + 1}. {dev.full_name} <span className="text-gray-400">({dev.primary_role})</span></span>
                  <button onClick={() => toggle(dev)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {done && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" /> Shortlist confirmed. Buyer notified.
                </div>
              )}
              <button
                onClick={confirmShortlist}
                disabled={selected.length !== 3 || confirming || done}
                className="mt-4 w-full py-2.5 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {confirming ? 'Confirming...' : 'Confirm Shortlist (3 required)'}
              </button>
            </div>
          </div>

          {/* Developer picker */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Select 3 developers to shortlist</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {developers.map((dev) => {
                const isSelected = selected.some((d) => d.id === dev.id)
                const canAdd = selected.length < 3 || isSelected
                return (
                  <div key={dev.id} className={`p-3 rounded-lg border transition-colors ${isSelected ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{dev.full_name}</p>
                        <p className="text-xs text-gray-500">{dev.primary_role} · {dev.city}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dev.tech_stack.slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                          ))}
                        </div>
                        {dev.monthly_rate_min && dev.monthly_rate_max && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatINR(dev.monthly_rate_min)}–{formatINR(dev.monthly_rate_max)}/mo
                          </p>
                        )}
                        {dev.available_from && (
                          <p className="text-xs text-gray-400 mt-0.5">Available: {new Date(dev.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggle(dev)}
                        disabled={!canAdd}
                        className={`ml-3 p-1.5 rounded-lg ${isSelected ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                      >
                        {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
