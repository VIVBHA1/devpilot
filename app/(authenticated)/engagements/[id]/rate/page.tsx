'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import { formatINR } from '@/lib/utils'

const RATING_PARAMS = [
  { key: 'rating_quality', label: 'Quality of Work', desc: 'Was the output what you expected?' },
  { key: 'rating_communication', label: 'Communication', desc: 'Did they update you proactively and respond promptly?' },
  { key: 'rating_deadlines', label: 'Deadlines', desc: 'Did they deliver on time?' },
  { key: 'rating_scope', label: 'Scope Adherence', desc: 'Did they stick to what was agreed?' },
  { key: 'rating_rehire', label: 'Would You Hire Again?', desc: 'Would you bring this developer back?' },
] as const

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

type Ratings = Record<string, number>

export default function RatePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [devName, setDevName] = useState('')
  const [finalMilestone, setFinalMilestone] = useState<{ id: string; amount_inr: number; title: string } | null>(null)
  const [ratings, setRatings] = useState<Ratings>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [engRes, milRes] = await Promise.all([
      fetch(`/api/engagements/${id}`),
      fetch(`/api/engagements/${id}/milestones`),
    ])
    if (engRes.ok) {
      const eng = await engRes.json()
      const dev = Array.isArray(eng.developers) ? eng.developers[0] : eng.developers
      setDevName(dev?.full_name ?? 'Developer')
    }
    if (milRes.ok) {
      const mils = await milRes.json()
      if (mils.length > 0) setFinalMilestone(mils[mils.length - 1])
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const setRating = (key: string, value: number) => setRatings((prev) => ({ ...prev, [key]: value }))

  const allRated = RATING_PARAMS.every((p) => ratings[p.key] >= 1)
  const overall = allRated
    ? Object.values(ratings).reduce((a, b) => a + b, 0) / RATING_PARAMS.length
    : null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRated) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/engagements/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratings, rating_comment: comment }),
      })
      if (!res.ok) throw new Error('Rating submission failed')
      router.push('/dashboard?rated=1')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Rate your experience with {devName.split(' ')[0]}</h1>
          <p className="mt-1 text-gray-500 text-sm">Your rating helps other buyers and rewards great developers.</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            {RATING_PARAMS.map((param) => (
              <div key={param.key}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{param.label}</p>
                    <p className="text-xs text-gray-400">{param.desc}</p>
                  </div>
                  {ratings[param.key] && (
                    <span className="text-xs text-gray-500 ml-2 shrink-0">
                      {ratings[param.key]} — {STAR_LABELS[ratings[param.key]]}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(param.key, n)}
                      className="p-1"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          n <= (ratings[param.key] ?? 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 fill-gray-200 hover:text-yellow-200 hover:fill-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Overall */}
            {overall !== null && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                <div className="text-3xl font-bold text-[#2563EB]">{overall.toFixed(1)}</div>
                <div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(overall) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Overall rating (auto-calculated)</p>
                </div>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Written feedback <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="What did they do well? Anything to improve?"
              />
            </div>

            {/* Payment notice */}
            {finalMilestone && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                By submitting this rating, the final payment of{' '}
                <strong>{formatINR(finalMilestone.amount_inr)}</strong> will be released to{' '}
                <strong>{devName}</strong>.
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!allRated || submitting}
            className="mt-6 w-full flex justify-center items-center gap-2 py-3.5 bg-[#2563EB] text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Rating and Release Final Payment
          </button>
        </form>
      </div>
    </div>
  )
}
