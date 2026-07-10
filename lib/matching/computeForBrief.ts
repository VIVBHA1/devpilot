import { createAdminClient } from '@/lib/supabase/admin'
import { scoreDeveloper, type BriefSkillRequirement, type CreditMap, type TaggedSkill } from '@/lib/matching/scoreDeveloper'
import { logCandidateEvent } from '@/lib/candidateEvents'
import type { SkillMatchTypeValue } from '@/types/database'

type NestedSkillTool = { subdiscipline_id: string; skill_subdisciplines: { domain_id: string } | { domain_id: string }[] | null }

function flattenTag(row: {
  skill_tool_id: string
  skill_tools: NestedSkillTool | NestedSkillTool[] | null
}): TaggedSkill | null {
  const tool = Array.isArray(row.skill_tools) ? row.skill_tools[0] : row.skill_tools
  if (!tool) return null
  const sub = Array.isArray(tool.skill_subdisciplines) ? tool.skill_subdisciplines[0] : tool.skill_subdisciplines
  if (!sub) return null
  return { skill_tool_id: row.skill_tool_id, subdiscipline_id: tool.subdiscipline_id, domain_id: sub.domain_id }
}

// Core matching computation, shared by the POST /api/matching/compute route and any
// server-side trigger (brief create/update, developer skill/verification changes). §Prompt 14.
export async function computeMatchScoresForBrief(briefId: string): Promise<{ scored: number } | { error: string }> {
  const supabase = createAdminClient()

  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('id, role_type')
    .eq('id', briefId)
    .single()
  if (briefError || !brief) return { error: 'Brief not found' }

  const [{ data: briefTagRows }, { data: weightsRow }, { data: creditRows }] = await Promise.all([
    supabase
      .from('brief_skill_tags')
      .select('skill_tool_id, requirement_type, skill_tools(subdiscipline_id, skill_subdisciplines(domain_id))')
      .eq('brief_id', briefId),
    supabase.from('scoring_weights').select('*').limit(1).single(),
    supabase.from('skill_match_credit').select('*'),
  ])

  const briefTags: BriefSkillRequirement[] = (briefTagRows ?? [])
    .map((r) => {
      const flat = flattenTag(r)
      return flat ? { ...flat, requirement_type: r.requirement_type } : null
    })
    .filter((t): t is BriefSkillRequirement => t !== null)

  const creditMap: CreditMap = Object.fromEntries(
    (creditRows ?? []).map((c) => [c.match_type as SkillMatchTypeValue, c.credit_multiplier])
  ) as CreditMap

  const weights = weightsRow ?? { skill_weight: 0.4, location_weight: 0.25, trust_weight: 0.2, rating_weight: 0.15 }

  const roleFilter = brief.role_type === 'Both' ? ['Full-Stack', 'Cloud', 'DevOps', 'Both'] : [brief.role_type, 'Both']

  const { data: developers } = await supabase
    .from('developers')
    .select('id, status, is_visible, id_verification_status, profile_score, total_engagements, location_interests, job_interests')
    .eq('status', 'approved')
    .eq('is_visible', true)
    .overlaps('job_interests', roleFilter)

  if (!developers?.length) return { scored: 0 }

  const devIds = developers.map((d) => d.id)
  const { data: devTagRows } = await supabase
    .from('developer_skill_tags')
    .select('developer_id, skill_tool_id, skill_tools(subdiscipline_id, skill_subdisciplines(domain_id))')
    .in('developer_id', devIds)

  const tagsByDeveloper = new Map<string, TaggedSkill[]>()
  for (const row of devTagRows ?? []) {
    const flat = flattenTag(row)
    if (!flat) continue
    const list = tagsByDeveloper.get(row.developer_id) ?? []
    list.push(flat)
    tagsByDeveloper.set(row.developer_id, list)
  }

  const rows = developers.map((dev) => ({
    developer_id: dev.id,
    brief_id: briefId,
    ...scoreDeveloper(briefTags, tagsByDeveloper.get(dev.id) ?? [], dev, weights, creditMap),
    computed_at: new Date().toISOString(),
  }))

  const { error: upsertError } = await supabase
    .from('match_scores')
    .upsert(rows, { onConflict: 'developer_id,brief_id' })

  if (upsertError) return { error: upsertError.message }

  // Fire-and-forget: one timeline event per developer touched by this compute pass. §Prompt 15.
  Promise.all(
    rows.map((r) => logCandidateEvent(r.developer_id, 'match_computed', 'system', { brief_id: briefId, overall_score: r.overall_score }))
  ).catch(console.error)

  return { scored: rows.length }
}

// Recomputes every open brief that a given developer is eligible for — used when a
// developer's skill tags or verification status change, since that affects their score
// across multiple briefs at once.
export async function recomputeForDeveloper(developerId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: briefs } = await supabase
    .from('briefs')
    .select('id')
    .in('status', ['open', 'matching'])
  await Promise.all((briefs ?? []).map((b) => computeMatchScoresForBrief(b.id)))
  void developerId // scoring is brief-scoped; developer id kept for call-site clarity/logging
}
