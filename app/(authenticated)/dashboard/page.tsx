import Link from 'next/link'
import { getCompanySession } from '@/lib/auth/companySession'
import { createAdminClient } from '@/lib/supabase/admin'
import { BarChartGeneric, TrendLineChart } from '@/components/admin/AnalyticsCharts'
import { formatINR } from '@/lib/utils'
import type { Brief, Engagement } from '@/types/database'

const STATUS_ORDER = ['open', 'matching', 'shortlisted', 'contracted', 'closed', 'cancelled']

export default async function DashboardPage() {
  const session = await getCompanySession()
  if (!session) return null // (authenticated) layout already redirects unauthenticated requests

  const supabase = createAdminClient()
  const buyerId = session.buyer.id
  const isViewer = session.companyUser.role === 'viewer'

  const [{ data: briefsRaw }, { data: engagementsRaw }] = await Promise.all([
    supabase
      .from('briefs')
      .select('id, title, role_type, status, priority, start_date, created_at, matched_at, shortlists(id)')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('engagements')
      .select('*, developers(full_name)')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false }),
  ])

  type BriefRow = Pick<Brief, 'id' | 'title' | 'role_type' | 'status' | 'priority' | 'start_date' | 'created_at' | 'matched_at'> & {
    shortlists?: { id: string }[]
  }
  const briefs = (briefsRaw ?? []) as BriefRow[]
  const engagements = (engagementsRaw ?? []) as (Engagement & { developers: { full_name: string } | null })[]

  const openRoles = briefs.filter((b) => b.status === 'open').length
  const shortlistsReady = briefs.filter((b) => b.status === 'shortlisted').length
  const activeEngagements = engagements.filter((e) => e.status === 'active').length

  const { count: pendingOffers } = briefs.length
    ? await supabase
        .from('brief_negotiations')
        .select('*', { count: 'exact', head: true })
        .in('brief_id', briefs.map((b) => b.id))
        .eq('status', 'pending')
    : { count: 0 }

  const rolesByStatus = STATUS_ORDER.map((status) => ({
    stage: status[0].toUpperCase() + status.slice(1),
    count: briefs.filter((b) => b.status === status).length,
  }))

  const shortlistedTrend = briefs
    .filter((b) => b.matched_at)
    .slice(0, 6)
    .reverse()
    .map((b, i) => ({
      label: `Role ${i + 1}`,
      value: Math.round((new Date(b.matched_at!).getTime() - new Date(b.created_at).getTime()) / 86400000),
    }))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.buyer.company_name}</h1>
            <p className="text-sm text-gray-500 mt-1">Dashboard</p>
          </div>
          {!isViewer && (
            <Link href="/post-brief" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Post a role</Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open roles', value: openRoles },
            { label: 'Shortlists ready', value: shortlistsReady },
            { label: 'Offers pending response', value: pendingOffers ?? 0 },
            { label: 'Active engagements', value: activeEngagements },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Roles by status</h2>
            <BarChartGeneric data={rolesByStatus} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Days to shortlist (last 6 roles)</h2>
            {shortlistedTrend.length > 0 ? (
              <TrendLineChart data={shortlistedTrend} />
            ) : (
              <p className="text-sm text-gray-400 py-16 text-center">No shortlisted roles yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 px-6 pt-6 pb-3">Your roles</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-white text-left">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Start date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Shortlisted</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {briefs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No roles posted yet.</td></tr>
              )}
              {briefs.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{b.priority}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{b.start_date ? new Date(b.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{b.status}</td>
                  <td className="px-4 py-3 text-gray-600">{b.shortlists?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/briefs/${b.id}/candidates`} className="text-xs font-medium text-[#2563EB] hover:underline">
                      View candidates →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Active engagements</h2>
          {engagements.length === 0 ? (
            <p className="text-sm text-gray-400">No engagements yet.</p>
          ) : (
            <div className="space-y-3">
              {engagements.map((eng) => (
                <Link key={eng.id} href={`/engagements/${eng.id}`}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{eng.developers?.full_name ?? 'Developer'}</p>
                    <p className="text-sm text-gray-500">{formatINR(eng.monthly_rate)}/month</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${eng.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{eng.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
