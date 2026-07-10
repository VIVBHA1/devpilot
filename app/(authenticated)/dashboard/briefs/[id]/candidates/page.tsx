import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCompanySession } from '@/lib/auth/companySession'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRankedCandidates } from '@/lib/matching/getRankedCandidates'
import { CandidatesBoard } from '@/components/dashboard/CandidatesBoard'

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCompanySession()
  if (!session) return null

  const supabase = createAdminClient()
  const { data: brief } = await supabase
    .from('briefs')
    .select('id, title, buyer_id')
    .eq('id', id)
    .single()

  if (!brief || brief.buyer_id !== session.buyer.id) notFound()

  const candidates = await getRankedCandidates(id)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← Back to dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">{brief.title}</h1>
        <CandidatesBoard briefId={id} candidates={candidates} />
      </div>
    </div>
  )
}
