'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { NegotiationPanel } from '@/components/negotiation/NegotiationPanel'
import { formatINR } from '@/lib/utils'

type Shortlist = {
  id: string
  status: string
  position: number | null
  developer_id: string | null
  developers?: { full_name: string; primary_role: string; slug: string } | null
}
type BriefWithShortlists = {
  id: string
  title: string
  role_type: string
  status: string
  budget_min: number | null
  budget_max: number | null
  shortlists?: Shortlist[]
}
type Engagement = { id: string; status: string; monthly_rate: number; developers?: { full_name: string } | null }

function DashboardContent() {
  const searchParams = useSearchParams()
  const rated = searchParams.get('rated')
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [briefs, setBriefs] = useState<BriefWithShortlists[]>([])

  useEffect(() => {
    fetch('/api/engagements').then((r) => r.json()).then(setEngagements).catch(() => {})
    fetch('/api/briefs').then((r) => r.json()).then(setBriefs).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {rated && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Rating submitted and final payment released. Thank you!
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
          <Link href="/post-brief" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Post a Brief</Link>
        </div>

        {/* Shortlists & Negotiation */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your matches &amp; offers</h2>
          {briefs.length === 0 ? (
            <p className="text-sm text-gray-400">No shortlists yet. Once we match your brief, your 3 developers appear here.</p>
          ) : (
            <div className="space-y-6">
              {briefs.map((brief) => (
                <div key={brief.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{brief.title}</p>
                      <p className="text-xs text-gray-500">
                        {brief.role_type}
                        {brief.budget_min && brief.budget_max ? ` · ${formatINR(brief.budget_min)}–${formatINR(brief.budget_max)}/mo` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{brief.status}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(brief.shortlists ?? []).map((s) => {
                      const dev = s.developers
                      if (!dev) return null
                      return (
                        <div key={s.id} className="border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Link href={`/developers/${dev.slug}`} className="font-medium text-gray-900 text-sm hover:text-[#2563EB]">{dev.full_name}</Link>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{dev.primary_role}</p>
                          <NegotiationPanel
                            briefId={brief.id}
                            shortlistId={s.id}
                            developerName={dev.full_name}
                            mode="buyer"
                            onContracted={(engId) => (window.location.href = `/engagements/${engId}`)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Engagements */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Active Engagements</h2>
          {engagements.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-3">No active engagements yet.</p>
              <Link href="/post-brief" className="text-[#2563EB] text-sm hover:underline">Post your first brief →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {engagements.map((eng) => {
                const dev = eng.developers
                return (
                  <Link key={eng.id} href={`/engagements/${eng.id}`}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{dev?.full_name ?? 'Developer'}</p>
                      <p className="text-sm text-gray-500">{formatINR(eng.monthly_rate)}/month</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${eng.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{eng.status}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Rehire CTA */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-sm text-gray-600">Looking to hire again?</p>
          <Link href="/post-brief" className="mt-2 inline-block text-[#2563EB] text-sm font-medium hover:underline">Post a new brief →</Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  )
}
