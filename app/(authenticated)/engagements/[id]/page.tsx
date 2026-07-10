'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react'
import { formatINR } from '@/lib/utils'
import type { Engagement, Milestone, WeeklyUpdate } from '@/types/database'

type EngagementDetail = Engagement & {
  developers?: { full_name: string; primary_role: string }
  buyers?: { company_name: string; contact_name: string }
}

const MILESTONE_ICON = {
  pending: <Clock className="w-5 h-5 text-gray-400" />,
  submitted: <Clock className="w-5 h-5 text-blue-500" />,
  approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  paid: <DollarSign className="w-5 h-5 text-green-600" />,
  disputed: <AlertCircle className="w-5 h-5 text-red-500" />,
}

export default function EngagementPage() {
  const { id } = useParams() as { id: string }
  const [engagement, setEngagement] = useState<EngagementDetail | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [updateText, setUpdateText] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  const load = useCallback(async () => {
    const [engRes, milRes] = await Promise.all([
      fetch(`/api/engagements/${id}`),
      fetch(`/api/engagements/${id}/milestones`),
    ])
    if (engRes.ok) setEngagement(await engRes.json())
    if (milRes.ok) setMilestones(await milRes.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const postUpdate = async () => {
    if (!updateText.trim()) return
    setPostingUpdate(true)
    await fetch(`/api/engagements/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: updateText }),
    })
    setUpdateText('')
    await load()
    setPostingUpdate(false)
  }

  const approveMilestone = async (milestoneId: string) => {
    await fetch(`/api/milestones/${milestoneId}/approve`, { method: 'POST' })
    await load()
  }

  const submitMilestone = async (milestoneId: string) => {
    await fetch(`/api/milestones/${milestoneId}/submit`, { method: 'POST' })
    await load()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  if (!engagement) return <div className="min-h-screen flex items-center justify-center text-gray-500">Engagement not found.</div>

  const dev = Array.isArray(engagement.developers) ? engagement.developers[0] : engagement.developers
  const buyer = Array.isArray(engagement.buyers) ? engagement.buyers[0] : engagement.buyers
  const updates: WeeklyUpdate[] = (engagement.weekly_updates as WeeklyUpdate[]) ?? []
  const finalMilestone = milestones[milestones.length - 1]
  const isComplete = milestones.every((m) => m.status === 'approved' || m.status === 'paid')
  const needsRating = isComplete && !engagement.rated_at

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{dev?.full_name ?? 'Developer'}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{dev?.primary_role} · {buyer?.company_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              engagement.status === 'active' ? 'bg-green-100 text-green-700' :
              engagement.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {engagement.status.charAt(0).toUpperCase() + engagement.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
            <div><p className="text-xs text-gray-400">Start date</p><p className="font-medium">{new Date(engagement.start_date).toLocaleDateString('en-IN')}</p></div>
            {engagement.end_date && <div><p className="text-xs text-gray-400">End date</p><p className="font-medium">{new Date(engagement.end_date).toLocaleDateString('en-IN')}</p></div>}
            <div><p className="text-xs text-gray-400">Monthly rate</p><p className="font-medium">{formatINR(engagement.monthly_rate)}</p></div>
            <div><p className="text-xs text-gray-400">Hours/week</p><p className="font-medium">{engagement.weekly_hours}</p></div>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            DevPilot platform fee of {engagement.platform_fee_pct}% is included in the rate shown above.
          </p>

          <a href={`mailto:hello@devpilot.in?subject=Issue with engagement ${id}`} className="mt-2 inline-block text-xs text-red-500 hover:underline">
            Report an issue
          </a>
        </div>

        {/* Rating CTA */}
        {needsRating && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-yellow-900">This engagement is ready to close</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Please rate {dev?.full_name?.split(' ')[0]} to release the final payment of {finalMilestone ? formatINR(finalMilestone.amount_inr) : ''}.
              </p>
            </div>
            <Link href={`/engagements/${id}/rate`}
              className="shrink-0 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
              Rate Developer
            </Link>
          </div>
        )}

        {/* Milestones */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Milestones</h2>
          {milestones.length === 0 && <p className="text-sm text-gray-400">No milestones yet. Contact DevPilot to set them up.</p>}
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={m.id} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0">
                <div className="mt-0.5">{MILESTONE_ICON[m.status]}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Milestone {i + 1}: {m.title}</p>
                      {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                      {m.due_date && <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(m.due_date).toLocaleDateString('en-IN')}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{formatINR(m.amount_inr)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.status === 'paid' ? 'bg-green-100 text-green-700' :
                        m.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        m.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                        m.status === 'disputed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {m.status === 'pending' && (
                      <button onClick={() => submitMilestone(m.id)}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                        Submit Milestone
                      </button>
                    )}
                    {m.status === 'submitted' && (
                      <button onClick={() => approveMilestone(m.id)}
                        className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                        Approve & Release Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Updates */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Weekly Updates</h2>
          {updates.length === 0 && <p className="text-sm text-gray-400 mb-4">No updates posted yet.</p>}
          <div className="space-y-3 mb-4">
            {updates.map((u, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">{u.author}</span>
                  <span className="text-xs text-gray-400">{new Date(u.date).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-sm text-gray-700">{u.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Post a weekly update..."
            />
            <button
              onClick={postUpdate}
              disabled={postingUpdate || !updateText.trim()}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-end"
            >
              {postingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
