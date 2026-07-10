import type { RequirementTypeValue, SkillMatchTypeValue } from '@/types/database'

export interface TaggedSkill {
  skill_tool_id: string
  subdiscipline_id: string
  domain_id: string
}

export interface BriefSkillRequirement extends TaggedSkill {
  requirement_type: RequirementTypeValue
}

export interface ScoringWeights {
  skill_weight: number
  location_weight: number
  trust_weight: number
  rating_weight: number
}

export type CreditMap = Record<SkillMatchTypeValue, number>

export interface DeveloperForScoring {
  id_verification_status: string
  status: string
  profile_score: number | null
  total_engagements: number
  location_interests: string[] | null
}

export interface ScoreResult {
  skill_score: number
  location_score: number
  trust_score: number
  rating_score: number
  overall_score: number
  reason_text: string
}

function matchType(briefTag: BriefSkillRequirement, devTags: TaggedSkill[]): SkillMatchTypeValue {
  if (devTags.some((d) => d.skill_tool_id === briefTag.skill_tool_id)) return 'exact'
  if (devTags.some((d) => d.subdiscipline_id === briefTag.subdiscipline_id)) return 'same_subdiscipline'
  if (devTags.some((d) => d.domain_id === briefTag.domain_id)) return 'same_domain'
  return 'different_domain'
}

function computeSkillScore(
  briefTags: BriefSkillRequirement[],
  devTags: TaggedSkill[],
  creditMap: CreditMap
): { score: number; weakestRequired: boolean; anyExact: boolean } {
  if (briefTags.length === 0) return { score: 100, weakestRequired: false, anyExact: false }

  let totalImportance = 0
  let totalCredit = 0
  let missingRequired = false
  let anyExact = false

  for (const tag of briefTags) {
    const importance = tag.requirement_type === 'required' ? 1 : 0.5
    const type = matchType(tag, devTags)
    const credit = creditMap[type] ?? 0
    if (type === 'exact') anyExact = true
    if (tag.requirement_type === 'required' && credit < 1) missingRequired = true
    totalImportance += importance
    totalCredit += importance * credit
  }

  return { score: (totalCredit / totalImportance) * 100, weakestRequired: missingRequired, anyExact }
}

function computeLocationScore(dev: DeveloperForScoring): number {
  const interests = dev.location_interests ?? []
  if (interests.includes('Remote')) return 100
  if (interests.length > 0) return 55
  return 20
}

function computeTrustScore(dev: DeveloperForScoring): number {
  if (dev.status !== 'approved') return 10
  if (dev.id_verification_status === 'verified') return 100
  if (dev.id_verification_status === 'pending') return 60
  return 20
}

function computeRatingScore(dev: DeveloperForScoring): number {
  if (dev.total_engagements === 0) return 50
  const raw = dev.profile_score ?? 5
  return Math.min(100, Math.max(0, (raw / 10) * 100))
}

export function scoreDeveloper(
  briefTags: BriefSkillRequirement[],
  devTags: TaggedSkill[],
  dev: DeveloperForScoring,
  weights: ScoringWeights,
  creditMap: CreditMap
): ScoreResult {
  const skill = computeSkillScore(briefTags, devTags, creditMap)
  const location_score = computeLocationScore(dev)
  const trust_score = computeTrustScore(dev)
  const rating_score = computeRatingScore(dev)

  const overall_score =
    skill.score * weights.skill_weight +
    location_score * weights.location_weight +
    trust_score * weights.trust_weight +
    rating_score * weights.rating_weight

  const factors = [
    { name: 'skill', score: skill.score },
    { name: 'location', score: location_score },
    { name: 'trust', score: trust_score },
    { name: 'rating', score: rating_score },
  ].sort((a, b) => a.score - b.score)
  const weakest = factors[0]

  let reason_text: string
  if (overall_score >= 80) {
    reason_text = skill.anyExact
      ? 'Strong match: required skills covered, verified, good fit on location and history.'
      : 'Strong match overall, with related (not exact) skill experience.'
  } else if (skill.weakestRequired) {
    reason_text = 'Partial match: missing one or more required skills.'
  } else if (weakest.name === 'trust') {
    reason_text = 'Partial match: skills line up, but verification is still pending.'
  } else if (weakest.name === 'location') {
    reason_text = 'Partial match: skills line up, location/availability overlap is limited.'
  } else if (weakest.name === 'rating') {
    reason_text = dev.total_engagements === 0
      ? 'Good skill match — no rating history yet, so this is unproven but not penalized.'
      : 'Partial match: past engagement ratings pull the score down.'
  } else {
    reason_text = 'Partial match across the board — worth a manual look.'
  }

  return {
    skill_score: round(skill.score),
    location_score: round(location_score),
    trust_score: round(trust_score),
    rating_score: round(rating_score),
    overall_score: round(overall_score),
    reason_text,
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
