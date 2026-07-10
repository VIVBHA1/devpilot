'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatINR } from '@/lib/utils'

type OfferDetails = {
  role_title?: string
  company_name?: string
  proposed_rate?: number
  proposed_start_date?: string
  message?: string
}

export default function OfferResponsePage() {
  const { token } = useParams() as { token: string }
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [offer, setOffer] = useState<OfferDetails | null>(null)
  const [result, setResult] = useState<'accepted' | 'rejected' | 'countered' | null>(null)
  const [showCounter, setShowCounter] = useState(false)
  const [counterRate, setCounterRate] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/offer-links/${token}`)
    const body = await res.json()
    setValid(body.valid)
    setReason(body.reason ?? null)
    setOffer(body.offer ?? null)
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const respond = async (action: 'accept' | 'reject' | 'counter') => {
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/offer-links/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        proposed_rate: action === 'counter' ? Number(counterRate) : undefined,
        message: action === 'counter' ? counterMessage : undefined,
      }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Something went wrong')
      setSubmitting(false)
      return
    }
    setResult(action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'countered')
    setSubmitting(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <Clock className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">This link is no longer active</h1>
          <p className="text-sm text-gray-600">
            {reason === 'used' ? 'This offer has already been responded to.' : reason === 'expired' ? 'This offer link has expired.' : 'We couldn\'t find this offer.'}
            {' '}Contact the DevPilot team if you still need to respond.
          </p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {result === 'accepted' ? 'Offer accepted' : result === 'rejected' ? 'Response recorded' : 'Counter sent'}
          </h1>
          <p className="text-sm text-gray-600">Our team will follow up with next steps by email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Offer from {offer?.company_name}</h1>
        <p className="text-sm text-gray-500 mb-6">{offer?.role_title}</p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-medium text-gray-900">{offer?.proposed_rate ? `${formatINR(offer.proposed_rate)}/mo` : '—'}</span></div>
          {offer?.proposed_start_date && (
            <div className="flex justify-between"><span className="text-gray-500">Start date</span><span className="font-medium text-gray-900">{new Date(offer.proposed_start_date).toLocaleDateString('en-IN')}</span></div>
          )}
          {offer?.message && <p className="text-gray-600 pt-2 border-t border-gray-100">&quot;{offer.message}&quot;</p>}
        </div>

        <p className="text-xs text-gray-400 mb-4">Your response is relayed to the company by our team, not sent directly.</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {!showCounter ? (
          <div className="space-y-2">
            <button onClick={() => respond('accept')} disabled={submitting}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Accept
            </button>
            <button onClick={() => setShowCounter(true)} disabled={submitting}
              className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              Counter
            </button>
            <button onClick={() => respond('reject')} disabled={submitting}
              className="w-full py-2.5 text-red-600 text-sm font-medium hover:underline disabled:opacity-50 flex items-center justify-center gap-1.5">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="number" value={counterRate} onChange={(e) => setCounterRate(e.target.value)} placeholder="Your rate (₹/mo)"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} placeholder="Message (optional)" rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => respond('counter')} disabled={submitting || !counterRate}
              className="w-full py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Send counter
            </button>
            <button onClick={() => setShowCounter(false)} className="w-full text-xs text-gray-400 hover:text-gray-600">Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
