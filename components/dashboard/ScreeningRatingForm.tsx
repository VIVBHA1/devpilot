'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2, Lock } from 'lucide-react'
import type { CandidateScreeningRating } from '@/types/database'

const PARAMETERS: { key: keyof Pick<CandidateScreeningRating, 'profile_quality' | 'presentability' | 'responsiveness' | 'expectation_match'>; label: string }[] = [
  { key: 'profile_quality', label: 'Profile quality' },
  { key: 'presentability', label: 'Presentability' },
  { key: 'responsiveness', label: 'Responsiveness' },
  { key: 'expectation_match', label: 'Match to expectations' },
]

export function ScreeningRatingForm({ briefId, developerId }: { briefId: string; developerId: string }) {
  const router = useRouter()
  const [ratings, setRatings] = useState<Record<string, number>>({
    profile_quality: 0, presentability: 0, responsiveness: 0, expectation_match: 0,
  })
  const [notes, setNotes] = useState('')
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/briefs/${briefId}/screening-ratings?developer_id=${developerId}`)
    if (res.ok) {
      const existing: CandidateScreeningRating | null = await res.json()
      if (existing) {
        setRatings({
          profile_quality: existing.profile_quality,
          presentability: existing.presentability,
          responsiveness: existing.responsiveness,
          expectation_match: existing.expectation_match,
        })
        setNotes(existing.notes ?? '')
        setLocked(!!existing.locked_at)
      }
    }
    setLoading(false)
  }, [briefId, developerId])

  useEffect(() => { load() }, [load])

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/briefs/${briefId}/screening-ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ developer_id: developerId, notes, ...ratings }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Failed to save')
      setSubmitting(false)
      return
    }
    setSaved(true)
    setSubmitting(false)
    router.refresh()
  }

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-5">
      {locked && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Lock className="w-4 h-4 shrink-0" /> An offer has been sent — this rating is locked as a record of the decision that was made.
        </div>
      )}
      {PARAMETERS.map((p) => (
        <div key={p.key}>
          <p className="text-sm font-medium text-gray-700 mb-1.5">{p.label}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={locked}
                onClick={() => setRatings((r) => ({ ...r, [p.key]: n }))}
                className="disabled:cursor-not-allowed"
              >
                <Star className={`w-6 h-6 ${n <= ratings[p.key] ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={locked}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          placeholder="Only visible to your team."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
      {!locked && (
        <button
          onClick={onSubmit}
          disabled={submitting || Object.values(ratings).some((v) => v === 0)}
          className="px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save rating'}
        </button>
      )}
    </div>
  )
}
