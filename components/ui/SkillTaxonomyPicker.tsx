'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { ProficiencyTierValue, RequirementTypeValue, SkillToolWithPath } from '@/types/database'

export type SkillTagValue = {
  skill_tool_id: string
  name: string
  proficiency_tier?: ProficiencyTierValue
  requirement_type?: RequirementTypeValue
}

const PROFICIENCY_TIERS: ProficiencyTierValue[] = ['beginner', 'intermediate', 'advanced', 'expert']

export function SkillTaxonomyPicker({
  mode,
  value,
  onChange,
}: {
  mode: 'developer' | 'brief'
  value: SkillTagValue[]
  onChange: (tags: SkillTagValue[]) => void
}) {
  const [tools, setTools] = useState<SkillToolWithPath[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/skill-taxonomy')
      .then((r) => r.json())
      .then((body) => setTools(body.tools ?? []))
      .catch(() => setTools([]))
  }, [])

  const selectedIds = useMemo(() => new Set(value.map((v) => v.skill_tool_id)), [value])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? tools.filter((t) => t.name.toLowerCase().includes(q)) : tools
    const byDomain = new Map<string, { domain: string; subs: Map<string, { sub: string; tools: SkillToolWithPath[] }> }>()
    for (const t of filtered) {
      if (!byDomain.has(t.domain_id)) byDomain.set(t.domain_id, { domain: t.domain_name, subs: new Map() })
      const d = byDomain.get(t.domain_id)!
      if (!d.subs.has(t.subdiscipline_id)) d.subs.set(t.subdiscipline_id, { sub: t.subdiscipline_name, tools: [] })
      d.subs.get(t.subdiscipline_id)!.tools.push(t)
    }
    return byDomain
  }, [tools, search])

  const toggle = (tool: SkillToolWithPath) => {
    if (selectedIds.has(tool.id)) {
      onChange(value.filter((v) => v.skill_tool_id !== tool.id))
    } else {
      onChange([
        ...value,
        mode === 'developer'
          ? { skill_tool_id: tool.id, name: tool.name, proficiency_tier: 'beginner' as ProficiencyTierValue }
          : { skill_tool_id: tool.id, name: tool.name, requirement_type: 'required' as RequirementTypeValue },
      ])
    }
  }

  const updateTag = (id: string, patch: Partial<SkillTagValue>) => {
    onChange(value.map((v) => (v.skill_tool_id === id ? { ...v, ...patch } : v)))
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills (e.g. LangChain, React, dbt)…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-3">
        {tools.length === 0 && <p className="text-sm text-gray-400">Loading skill taxonomy…</p>}
        {[...grouped.values()].map((d) => (
          <div key={d.domain}>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">{d.domain}</p>
            {[...d.subs.values()].map((s) => (
              <div key={s.sub} className="mb-2">
                <p className="text-xs text-gray-400 mb-1">{s.sub}</p>
                <div className="flex flex-wrap gap-2">
                  {s.tools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedIds.has(t.id)
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            {mode === 'developer' ? 'Selected skills — set your proficiency' : 'Selected skills — required or preferred'}
          </p>
          {value.map((v) => (
            <div key={v.skill_tool_id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-800">{v.name}</span>
              {mode === 'developer' ? (
                <select
                  value={v.proficiency_tier}
                  onChange={(e) => updateTag(v.skill_tool_id, { proficiency_tier: e.target.value as ProficiencyTierValue })}
                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
                >
                  {PROFICIENCY_TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                </select>
              ) : (
                <select
                  value={v.requirement_type}
                  onChange={(e) => updateTag(v.skill_tool_id, { requirement_type: e.target.value as RequirementTypeValue })}
                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
