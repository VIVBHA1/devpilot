import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { NegotiationPanel } from '@/components/negotiation/NegotiationPanel'

export default async function AdminNegotiatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, title, shortlists(id, status, developer_id, developers(full_name, primary_role))')
    .eq('id', id)
    .single()

  if (!brief) notFound()

  type ShortlistRow = { id: string; status: string; developer_id: string | null; developers: { full_name: string; primary_role: string } | { full_name: string; primary_role: string }[] | null }
  const shortlists = (brief.shortlists ?? []) as ShortlistRow[]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1E293B] text-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href={`/admin/briefs/${id}`} className="text-gray-400 hover:text-white text-sm">← Back to brief</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Relay negotiation — {brief.title}</h1>
        <p className="text-sm text-gray-500">Log the developer&apos;s real-world response (email/WhatsApp) here as their reply.</p>
        {shortlists.length === 0 && <p className="text-sm text-gray-400">No shortlisted developers yet.</p>}
        {shortlists.map((s) => {
          const dev = Array.isArray(s.developers) ? s.developers[0] : s.developers
          if (!dev) return null
          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{dev.full_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{s.status}</span>
              </div>
              <NegotiationPanel briefId={id} shortlistId={s.id} developerName={dev.full_name} mode="admin" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
