import { cn } from '@/lib/utils'
import type { DeveloperStatusValue, BriefStatusValue, EngagementStatusValue, MilestoneStatusValue } from '@/types/database'

type StatusValue = DeveloperStatusValue | BriefStatusValue | EngagementStatusValue | MilestoneStatusValue

const STATUS_STYLES: Record<string, string> = {
  // Developer
  applied: 'bg-gray-100 text-gray-700',
  screening: 'bg-blue-100 text-blue-700',
  code_test: 'bg-yellow-100 text-yellow-700',
  design_call: 'bg-orange-100 text-orange-700',
  reference_check: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-900/20 text-red-900',
  // Brief
  open: 'bg-blue-100 text-blue-700',
  matching: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  contracted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  // Engagement
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  disputed: 'bg-red-100 text-red-700',
  // Milestone
  pending: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  code_test: 'Code Test',
  design_call: 'Design Call',
  reference_check: 'Ref Check',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  open: 'Open',
  matching: 'Matching',
  shortlisted: 'Shortlisted',
  contracted: 'Contracted',
  closed: 'Closed',
  cancelled: 'Cancelled',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  disputed: 'Disputed',
  pending: 'Pending',
  submitted: 'Submitted',
  paid: 'Paid',
}

export function StatusBadge({ status, size = 'sm' }: { status: StatusValue; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
