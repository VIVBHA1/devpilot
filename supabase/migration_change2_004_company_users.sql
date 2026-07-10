-- ============================================================
-- Design Change #2 — Part 4: Company registration, team & permissions (Prompt 16)
-- Additive only. Run after migration_change2_003_candidate_events.sql.
-- ============================================================

alter table buyers
  add column email_domain_verified boolean not null default false,
  add column email_verification_token text,
  add column email_verification_expires_at timestamptz;

create table company_users (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references buyers(id) on delete cascade,
  email           text not null,
  role            text not null default 'owner' check (role in ('owner','admin','viewer')),
  invited_at      timestamptz default now(),
  joined_at       timestamptz,
  unique (buyer_id, email)
);

create index company_users_email_idx on company_users(email);

alter table company_users enable row level security;

-- A signed-in company user can see their own team roster (via auth.uid() -> buyers.user_id).
create policy "company_users_own_team_read" on company_users
  for select using (
    exists (
      select 1 from buyers b
      where b.id = company_users.buyer_id and b.user_id = auth.uid()
    )
  );

-- Company users can read developer profiles that have been shortlisted/matched to one of their
-- briefs, in addition to the existing public "is_visible" policy. Never the full candidate DB,
-- and never vetting/KYC fields beyond what the public policy already exposes.
create policy "developers_company_matched_read" on developers
  for select using (
    is_visible = true
    and exists (
      select 1
      from match_scores ms
      join briefs br on br.id = ms.brief_id
      join buyers b on b.id = br.buyer_id
      where ms.developer_id = developers.id and b.user_id = auth.uid()
    )
  );

-- match_scores: a company user may read rows for briefs belonging to their own buyer account.
create policy "match_scores_company_read" on match_scores
  for select using (
    exists (
      select 1 from briefs br
      join buyers b on b.id = br.buyer_id
      where br.id = match_scores.brief_id and b.user_id = auth.uid()
    )
  );

-- Deliberately no policy grants company_users write access to developers, developer_skill_tags,
-- candidate_events, or any KYC/vetting table — those remain service-role-only, enforcing the
-- "company accounts never reach candidate-creation tooling" rule at the RLS layer, not just the UI.
