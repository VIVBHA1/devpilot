import { createAdminClient } from '@/lib/supabase/admin'
import type { RankedCandidate } from '@/types/database'

// Shared by GET /api/briefs/[id]/candidates and the company-facing candidates page —
// one query, read from two call sites. §Prompt 14/19.
export async function getRankedCandidates(briefId: string): Promise<RankedCandidate[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('match_scores')
    .select(
      'id, developer_id, brief_id, skill_score, location_score, trust_score, rating_score, overall_score, reason_text, computed_at, ' +
      'developer:developers(id, full_name, slug, primary_role, tech_stack, tier, monthly_rate_min, monthly_rate_max, location_interests, city, profile_score)'
    )
    .eq('brief_id', briefId)
    .order('overall_score', { ascending: false })

  return (data ?? []) as unknown as RankedCandidate[]
}
