import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Buyer, CompanyUser } from '@/types/database'

export interface CompanySession {
  userId: string
  email: string
  companyUser: CompanyUser
  buyer: Buyer
}

// Resolves the signed-in Supabase Auth user to their company_users row + buyer account,
// linking buyers.user_id on first login. Memoized per request. §Prompt 16.
export const getCompanySession = cache(async (): Promise<CompanySession | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const admin = createAdminClient()

  const { data: companyUser } = await admin
    .from('company_users')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!companyUser) return null

  const { data: buyer } = await admin
    .from('buyers')
    .select('*')
    .eq('id', companyUser.buyer_id)
    .single()
  if (!buyer) return null

  if (!buyer.user_id) {
    await admin.from('buyers').update({ user_id: user.id }).eq('id', buyer.id)
    buyer.user_id = user.id
  }

  if (!companyUser.joined_at) {
    await admin.from('company_users').update({ joined_at: new Date().toISOString() }).eq('id', companyUser.id)
    companyUser.joined_at = new Date().toISOString()
  }

  return { userId: user.id, email: user.email, companyUser, buyer }
})
