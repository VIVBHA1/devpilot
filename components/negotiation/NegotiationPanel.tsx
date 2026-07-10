'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Send, Check } from 'lucide-react'
import { formatINR } from '@/lib/utils'
import type { BriefNegotiation } from '@/types/database'

interface Props {
  briefId: string
  shortlistId: string
  developerName: string
  // 'buyer' shows Send Offer + Accept. 'admin' can log an offer on behalf of the developer.
  mode: 'buyer' | 'admin'
  onContracted?: (engagementId: string) => void
}

export function NegotiationPanel({ briefId, shortlistId, developerName, mode, onContracted }: Props) {
  const [offers, setOffers] = useState<BriefNegotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [onBehalf, setOnBehalf] = useState(false) // admin: log developer's reply

  const load = useCallback(async () => {
    const res = await fetch(`/api/briefs/${briefId}/negotiations?shortlist_id=${shortlistId}`)
    if (res.ok) setOffers(await res.json())
    setLoading(false)
  }, [briefId, shortlistId])

  useEffect(() => { load() }, [load])

  const sendOffer = async () => {
    if (!rate) return
    setSending(true)
    const proposed_by = mode === 'admin' ? (onBehalf ? 'developer' : 'admin') : 'buyer'
    await fetch(`/api/briefs/${briefId}/negotiations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortlist_id: shortlistId, proposed_by, proposed_rate: Number(rate), proposed_start_date: startDate || undefined, message: message || undefined }),
    })
    setRate(''); setStartDate(''); setMessage('')
    await load()
    setSending(false)
  }

  const acceptOffer = async (negotiationId: string) => {
    setSending(true)
    const res = await fetch(`/api/briefs/${briefId}/negotiations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortlist_id: shortlistId, negotiation_id: negotiationId, accepted_by: mode }),
    })
    if (res.ok) {
      const { engagement_id } = await res.json()
      onContracted?.(engagement_id)
    }
    await load()
    setSending(false)
  }

  const contracted = offers.some((o) => o.status === 'accepted')
  const latestPending = [...offers].reverse().find((o) => o.status === 'pending')

  if (loading) return <div className="py-3 text-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" /></div>

  return (
    <div className="space-y-3">
      {/* Thread */}
      {offers.length > 0 && (
        <div className="space-y-1.5">
          {offers.map((o) => (
            <div key={o.id} className={`text-xs px-3 py-2 rounded-lg ${o.status === 'accepted' ? 'bg-green-50 border border-green-200' : o.proposed_by === 'buyer' ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize text-gray-700">
                  {o.proposed_by}{o.status === 'accepted' ? ' · accepted' : ''}
                </span>
                <span className="text-gray-400">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
              </div>
              <p className="text-gray-900 mt-0.5">
                {o.proposed_rate ? `${formatINR(o.proposed_rate)}/mo` : ''}
                {o.proposed_start_date ? ` · from ${new Date(o.proposed_start_date).toLocaleDateString('en-IN')}` : ''}
              </p>
              {o.message && <p className="text-gray-500 mt-0.5">{o.message}</p>}
            </div>
          ))}
        </div>
      )}

      {contracted ? (
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          <Check className="w-4 h-4" /> Contracted — engagement created.
        </div>
      ) : (
        <>
          {/* Accept latest pending offer */}
          {latestPending && (
            <button onClick={() => acceptOffer(latestPending.id)} disabled={sending}
              className="w-full py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              Accept latest offer ({latestPending.proposed_rate ? formatINR(latestPending.proposed_rate) : ''}/mo)
            </button>
          )}

          {/* Send / log an offer */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {mode === 'admin' && (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={onBehalf} onChange={(e) => setOnBehalf(e.target.checked)} className="h-3.5 w-3.5" />
                Log this as {developerName.split(' ')[0]}&apos;s reply (on behalf)
              </label>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate ₹/mo"
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optional)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={sendOffer} disabled={sending || !rate}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {mode === 'admin' && onBehalf ? 'Log offer' : 'Send offer'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
