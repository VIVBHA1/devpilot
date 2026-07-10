import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatINR } from '@/lib/utils'
import type { Brief, BriefStatusValue } from '@/types/database'

type BriefRow = Pick<Brief, 'id' | 'created_at' | 'role_type' | 'duration_weeks' | 'budget_min' | 'budget_max' | 'status' | 'buyer_id'> & {
  buyers: { company_name: string; contact_name: string } | null
}

export default async function AdminBriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || 'all'
  const supabase = await createClient()

  let query = supabase
    .from('briefs')
    .select('id, created_at, role_type, duration_weeks, budget_min, budget_max, status, buyer_id, buyers(company_name, contact_name)')
    .order('created_at', { ascending: false })

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: briefsRaw } = await query
  const briefs = briefsRaw as BriefRow[] | null

  const FILTERS = ['all', 'open', 'matching', 'shortlisted', 'contracted']

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-bold text-blue-400">DevPilot Admin</span>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">Applications</Link>
          <Link href="/admin/briefs" className="text-sm text-white font-medium border-b border-white pb-0.5">Briefs</Link>
          <Link href="/admin/engagements" className="text-sm text-gray-400 hover:text-white">Engagements</Link>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyer Briefs</h1>

        <div className="flex gap-2 mb-4">
          {FILTERS.map((f) => (
            <Link key={f} href={`/admin/briefs?filter=${f}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}>
              {f}
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-white text-left">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Duration</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Budget</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!briefs?.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No briefs found.</td></tr>
              )}
              {briefs?.map((brief) => {
                const buyer = brief.buyers
                return (
                  <tr key={brief.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{buyer?.company_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{brief.role_type}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{brief.duration_weeks}w</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {brief.budget_min && brief.budget_max
                        ? `${formatINR(brief.budget_min)}–${formatINR(brief.budget_max)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                      {new Date(brief.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={brief.status as BriefStatusValue} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/briefs/${brief.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50">
                        View Brief
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
