import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminNav } from '@/components/admin/AdminNav'
import { formatINR } from '@/lib/utils'
import type { Engagement, EngagementStatusValue } from '@/types/database'

type EngRow = Engagement & {
  developers: { full_name: string } | null
  buyers: { company_name: string } | null
}

export default async function AdminEngagementsPage() {
  const supabase = await createClient()
  const { data: engRaw } = await supabase
    .from('engagements')
    .select('*, developers(full_name), buyers(company_name)')
    .order('created_at', { ascending: false })
  const engagements = engRaw as EngRow[] | null

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/admin/engagements" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Engagements</h1>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-white text-left">
                <th className="px-4 py-3 font-medium">Developer</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Rate</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Start</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!engagements?.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No engagements yet.</td></tr>
              )}
              {engagements?.map((eng) => {
                const dev = eng.developers
                const buyer = eng.buyers
                return (
                  <tr key={eng.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{dev?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{buyer?.company_name ?? '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{formatINR(eng.monthly_rate)}/mo</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                      {new Date(eng.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={eng.status as EngagementStatusValue} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/engagements/${eng.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50">
                        View
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
