import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SkillToolWithPath } from '@/types/database'

// Public reference data — the full domain > sub-discipline > tool tree, flattened with
// path names attached so the client picker doesn't need three round trips.
export async function GET() {
  const supabase = createAdminClient()

  const [{ data: domains, error: e1 }, { data: subs, error: e2 }, { data: tools, error: e3 }] =
    await Promise.all([
      supabase.from('skill_domains').select('id, name'),
      supabase.from('skill_subdisciplines').select('id, domain_id, name'),
      supabase.from('skill_tools').select('id, subdiscipline_id, name'),
    ])

  if (e1 || e2 || e3) {
    return NextResponse.json({ error: (e1 || e2 || e3)?.message }, { status: 500 })
  }

  const domainById = new Map((domains ?? []).map((d) => [d.id, d]))
  const subById = new Map((subs ?? []).map((s) => [s.id, s]))

  const flat: SkillToolWithPath[] = (tools ?? []).flatMap((t) => {
    const sub = subById.get(t.subdiscipline_id)
    const domain = sub ? domainById.get(sub.domain_id) : undefined
    if (!sub || !domain) return []
    return [{
      ...t,
      subdiscipline_name: sub.name,
      domain_name: domain.name,
      domain_id: domain.id,
    }]
  })

  return NextResponse.json({ tools: flat })
}
