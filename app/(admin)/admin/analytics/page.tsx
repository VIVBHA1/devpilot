import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminNav } from '@/components/admin/AdminNav'
import { StageFunnelChart, SourceDonutChart, WeeklySignupsChart } from '@/components/admin/AnalyticsCharts'
import type { DeveloperStatusValue, SourceTypeValue } from '@/types/database'

const STAGE_ORDER: DeveloperStatusValue[] = [
  'applied', 'screening', 'code_test', 'design_call', 'reference_check', 'approved', 'rejected', 'suspended',
]
const STAGE_LABELS: Record<DeveloperStatusValue, string> = {
  applied: 'Applied',
  screening: 'Screening',
  code_test: 'Code test',
  design_call: 'Design call',
  reference_check: 'Reference check',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}
const SOURCE_LABELS: Record<SourceTypeValue, string> = {
  self_signup: 'Self-signup',
  staffing_partner: 'Staffing partner',
  field_recruiter: 'Field recruiter',
  referral: 'Referral',
  bulk_import: 'Bulk import',
}
const PENDING_STATUSES: DeveloperStatusValue[] = ['applied', 'screening', 'code_test', 'design_call', 'reference_check']

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `W${week}`
}

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient()

  const { data: developers } = await supabase
    .from('developers')
    .select('id, full_name, status, source_type, id_verification_status, created_at, kyc_verified_at, updated_at')

  const devs = developers ?? []

  const inPipeline = devs.filter((d) => PENDING_STATUSES.includes(d.status as DeveloperStatusValue)).length

  const now = Date.now()
  const weekAgo = now - 7 * 86400000
  const verifiedThisWeek = devs.filter((d) => d.kyc_verified_at && new Date(d.kyc_verified_at).getTime() >= weekAgo).length

  const verifiedDurations = devs
    .filter((d) => d.kyc_verified_at)
    .map((d) => (new Date(d.kyc_verified_at!).getTime() - new Date(d.created_at).getTime()) / 86400000)
  const avgTimeToVerify = verifiedDurations.length
    ? (verifiedDurations.reduce((a, b) => a + b, 0) / verifiedDurations.length).toFixed(1)
    : '—'

  const twoWeeksAgo = now - 14 * 86400000
  const needsAttention = devs.filter(
    (d) =>
      (d.id_verification_status === 'rejected' || d.status === 'rejected') &&
      new Date(d.updated_at).getTime() >= twoWeeksAgo
  )

  const funnelData = STAGE_ORDER.map((stage) => ({
    stage: STAGE_LABELS[stage],
    count: devs.filter((d) => d.status === stage).length,
  }))

  const sourceCounts = new Map<string, number>()
  for (const d of devs) {
    const key = d.source_type ?? 'self_signup'
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1)
  }
  const sourceData = [...sourceCounts.entries()].map(([source, count]) => ({
    source: SOURCE_LABELS[source as SourceTypeValue] ?? source,
    count,
  }))

  const weekBuckets = new Map<string, number>()
  const eightWeeksAgo = now - 56 * 86400000
  for (const d of devs) {
    const created = new Date(d.created_at).getTime()
    if (created < eightWeeksAgo) continue
    const key = isoWeek(new Date(d.created_at))
    weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1)
  }
  const weeklyData = [...weekBuckets.entries()].map(([week, count]) => ({ week, count }))

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav active="/admin/analytics" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Onboarding analytics</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'In pipeline', value: inPipeline },
            { label: 'Verified this week', value: verifiedThisWeek },
            { label: 'Avg time to verify', value: avgTimeToVerify === '—' ? '—' : `${avgTimeToVerify}d` },
            { label: 'Needs attention', value: needsAttention.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Stage funnel</h2>
            <StageFunnelChart data={funnelData} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Applicant source</h2>
            <SourceDonutChart data={sourceData} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Weekly signups</h2>
            <WeeklySignupsChart data={weeklyData} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 px-6 pt-6 pb-3">Needs attention</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-white text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {needsAttention.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nothing flagged in the last 14 days.</td></tr>
              )}
              {needsAttention.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{d.status}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{d.id_verification_status.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/application/${d.id}`} className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50">
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
