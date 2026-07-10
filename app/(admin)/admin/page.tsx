import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminNav } from '@/components/admin/AdminNav'
import type { Developer, DeveloperStatusValue } from '@/types/database'

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const PENDING_STATUSES: DeveloperStatusValue[] = ['applied', 'screening', 'code_test', 'design_call', 'reference_check']

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || 'all'
  const supabase = await createClient()

  // Stats
  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: activeEngagements },
  ] = await Promise.all([
    supabase.from('developers').select('*', { count: 'exact', head: true }),
    supabase.from('developers').select('*', { count: 'exact', head: true }).in('status', PENDING_STATUSES),
    supabase.from('developers').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('engagements').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  // Developer list with filter
  let query = supabase
    .from('developers')
    .select('id, full_name, primary_role, tech_stack, city, created_at, status')
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.in('status', PENDING_STATUSES)
  else if (filter === 'approved') query = query.eq('status', 'approved')
  else if (filter === 'rejected') query = query.eq('status', 'rejected')

  const { data: developersRaw } = await query
  const developers = developersRaw as Pick<Developer, 'id' | 'full_name' | 'primary_role' | 'tech_stack' | 'city' | 'created_at' | 'status'>[] | null

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Developer Applications</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: total ?? 0 },
            { label: 'Pending Review', value: pending ?? 0 },
            { label: 'Approved', value: approved ?? 0 },
            { label: 'Active Engagements', value: activeEngagements ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin?filter=${f.value}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-white text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Stack</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">City</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {developers?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No applications found.</td>
                </tr>
              )}
              {developers?.map((dev) => (
                <tr key={dev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{dev.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{dev.primary_role}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {(dev.tech_stack ?? []).slice(0, 3).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{dev.city}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                    {new Date(dev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={dev.status as DeveloperStatusValue} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/application/${dev.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
