import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanySession } from '@/lib/auth/companySession'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'viewer']),
})

// Invite a teammate onto the signed-in user's company account. Owner/admin only —
// viewers get a 403, enforced server-side (not just hidden in the UI). §Prompt 16.
export async function POST(req: NextRequest) {
  const session = await getCompanySession()
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (session.companyUser.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot invite teammates' }, { status: 403 })
  }

  try {
    const { email, role } = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('company_users')
      .insert({ buyer_id: session.buyer.id, email, role })

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Already on the team' }, { status: 409 })
      throw error
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    console.error('Invite teammate error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
