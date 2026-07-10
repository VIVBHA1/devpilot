-- ============================================================
-- Design Change #2 — Part 1: Skill taxonomy (Prompt 13)
-- Additive only. Run after schema.sql and migration_change1.sql.
-- ============================================================

create table skill_domains (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique
);

create table skill_subdisciplines (
  id              uuid primary key default gen_random_uuid(),
  domain_id       uuid not null references skill_domains(id) on delete cascade,
  name            text not null,
  unique (domain_id, name)
);

create table skill_tools (
  id              uuid primary key default gen_random_uuid(),
  subdiscipline_id uuid not null references skill_subdisciplines(id) on delete cascade,
  name            text not null,
  unique (subdiscipline_id, name)
);

create table developer_skill_tags (
  id              uuid primary key default gen_random_uuid(),
  developer_id    uuid not null references developers(id) on delete cascade,
  skill_tool_id   uuid not null references skill_tools(id) on delete cascade,
  proficiency_tier text not null default 'beginner'
                  check (proficiency_tier in ('beginner','intermediate','advanced','expert')),
  evidence_type   text not null default 'self_declared'
                  check (evidence_type in ('self_declared','portfolio','certification','skill_test','engagement_history')),
  evidence_ref    text,
  created_at      timestamptz default now(),
  unique (developer_id, skill_tool_id)
);

create table brief_skill_tags (
  id              uuid primary key default gen_random_uuid(),
  brief_id        uuid not null references briefs(id) on delete cascade,
  skill_tool_id   uuid not null references skill_tools(id) on delete cascade,
  requirement_type text not null default 'required'
                  check (requirement_type in ('required','preferred')),
  unique (brief_id, skill_tool_id)
);

alter table skill_domains enable row level security;
alter table skill_subdisciplines enable row level security;
alter table skill_tools enable row level security;
alter table developer_skill_tags enable row level security;
alter table brief_skill_tags enable row level security;

-- Taxonomy tables are reference data — readable by anyone (public pickers on /apply and /post-brief).
create policy "skill_domains_public_read" on skill_domains for select using (true);
create policy "skill_subdisciplines_public_read" on skill_subdisciplines for select using (true);
create policy "skill_tools_public_read" on skill_tools for select using (true);

-- developer_skill_tags: public can read tags belonging to a visible developer profile.
create policy "developer_skill_tags_public_read" on developer_skill_tags
  for select using (
    exists (select 1 from developers d where d.id = developer_id and d.is_visible = true)
  );

-- brief_skill_tags: no public policy — only the service role (admin client) reads/writes these today,
-- same as briefs itself. Company-scoped read access is added in migration_change2_004 once
-- company_users exists.

-- service role bypasses RLS entirely via the admin client, as with every other table.
