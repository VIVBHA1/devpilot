import { getCompanySession } from '@/lib/auth/companySession'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteTeammateForm } from '@/components/dashboard/InviteTeammateForm'

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-700',
  admin: 'bg-gray-100 text-gray-700',
  viewer: 'bg-amber-100 text-amber-700',
}

export default async function TeamPage() {
  const session = await getCompanySession()
  if (!session) return null // (authenticated) layout already redirects unauthenticated requests

  const supabase = createAdminClient()
  const { data: teammates } = await supabase
    .from('company_users')
    .select('*')
    .eq('buyer_id', session.buyer.id)
    .order('invited_at', { ascending: true })

  const isViewer = session.companyUser.role === 'viewer'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">{session.buyer.company_name}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Members</h2>
          <div className="divide-y divide-gray-100">
            {(teammates ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.email}</p>
                  <p className="text-xs text-gray-400">{m.joined_at ? 'Joined' : 'Invited'} {new Date(m.joined_at ?? m.invited_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_STYLES[m.role]}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        {!isViewer && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Invite a teammate</h2>
            <InviteTeammateForm />
          </div>
        )}
      </div>
    </div>
  )
}
