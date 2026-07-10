import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCompanySession } from '@/lib/auth/companySession'
import { createAdminClient } from '@/lib/supabase/admin'
import { NegotiationPanel } from '@/components/negotiation/NegotiationPanel'

export default async function OfferPage({ params }: { params: Promise<{ id: string; developerId: string }> }) {
  const { id, developerId } = await params
  const session = await getCompanySession()
  if (!session) return null

  const supabase = createAdminClient()
  const [{ data: brief }, { data: developer }, { data: shortlist }] = await Promise.all([
    supabase.from('briefs').select('id, title, buyer_id').eq('id', id).single(),
    supabase.from('developers').select('full_name, primary_role').eq('id', developerId).single(),
    supabase.from('shortlists').select('id').eq('brief_id', id).eq('developer_id', developerId).maybeSingle(),
  ])

  if (!brief || brief.buyer_id !== session.buyer.id || !developer) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Link href={`/dashboard/briefs/${id}/candidates`} className="text-sm text-gray-500 hover:text-gray-900">← Back to candidates</Link>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-lg font-bold text-gray-900">{developer.full_name}</h1>
          <p className="text-sm text-gray-500 mb-1">{developer.primary_role} · Offer for &quot;{brief.title}&quot;</p>
          <p className="text-xs text-gray-400 mb-5">Relayed by our team, not a live chat — the candidate responds via a secure link we send them.</p>
          {shortlist ? (
            <NegotiationPanel briefId={id} shortlistId={shortlist.id} developerName={developer.full_name} mode="buyer" />
          ) : (
            <p className="text-sm text-gray-400">This candidate hasn&apos;t been formally shortlisted yet — ask admin to confirm the shortlist before sending an offer.</p>
          )}
        </div>
      </div>
    </div>
  )
}
