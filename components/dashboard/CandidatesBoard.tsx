'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatINR } from '@/lib/utils'
import type { RankedCandidate } from '@/types/database'

type SortMode = 'score' | 'rate'

export function CandidatesBoard({ briefId, candidates }: { briefId: string; candidates: RankedCandidate[] }) {
  const [tier, setTier] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [maxRate, setMaxRate] = useState('')
  const [sort, setSort] = useState<SortMode>('score')

  const filtered = useMemo(() => {
    let list = candidates
    if (tier) list = list.filter((c) => c.developer.tier === tier)
    if (remoteOnly) list = list.filter((c) => c.developer.location_interests?.includes('Remote'))
    if (maxRate) list = list.filter((c) => (c.developer.monthly_rate_min ?? Infinity) <= Number(maxRate))
    return [...list].sort((a, b) =>
      sort === 'score' ? b.overall_score - a.overall_score : (a.developer.monthly_rate_min ?? 0) - (b.developer.monthly_rate_min ?? 0)
    )
  }, [candidates, tier, remoteOnly, maxRate, sort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white">
          <option value="">All tiers</option>
          <option value="Standard">Standard</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="rounded border-gray-300" />
          Remote only
        </label>
        <input
          type="number"
          placeholder="Max rate/mo"
          value={maxRate}
          onChange={(e) => setMaxRate(e.target.value)}
          className="w-32 px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
        />
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort:</span>
          <button onClick={() => setSort('score')} className={`px-3 py-1 rounded-full ${sort === 'score' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-600'}`}>Match score</button>
          <button onClick={() => setSort('rate')} className={`px-3 py-1 rounded-full ${sort === 'rate' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-600'}`}>Rate</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No candidates match these filters yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/developers/${c.developer.slug}`} className="font-medium text-gray-900 hover:text-[#2563EB]">{c.developer.full_name}</Link>
                  <p className="text-xs text-gray-500">{c.developer.primary_role} · {c.developer.tier ?? 'Standard'} · {c.developer.city}</p>
                </div>
                <span className="text-lg font-bold text-[#2563EB]">{Math.round(c.overall_score)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{c.reason_text}</p>
              {c.developer.monthly_rate_min && c.developer.monthly_rate_max && (
                <p className="text-xs text-gray-600 mt-2">{formatINR(c.developer.monthly_rate_min)}–{formatINR(c.developer.monthly_rate_max)}/mo</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                {(c.developer.tech_stack ?? []).slice(0, 4).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Link href={`/dashboard/briefs/${briefId}/rate/${c.developer_id}`} className="text-xs font-medium text-[#2563EB] hover:underline">Rate candidate</Link>
                <Link href={`/dashboard/briefs/${briefId}/offer/${c.developer_id}`} className="text-xs font-medium text-[#2563EB] hover:underline">Send offer</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
