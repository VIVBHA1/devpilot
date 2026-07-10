-- ============================================================
-- Design Change #2 — Part 2: Matching engine (Prompt 14)
-- Additive only. Run after migration_change2_001_taxonomy.sql.
-- ============================================================

create table scoring_weights (
  id              uuid primary key default gen_random_uuid(),
  skill_weight    numeric(3,2) not null default 0.40,
  location_weight numeric(3,2) not null default 0.25,
  trust_weight    numeric(3,2) not null default 0.20,
  rating_weight   numeric(3,2) not null default 0.15,
  updated_at      timestamptz default now()
);

insert into scoring_weights (skill_weight, location_weight, trust_weight, rating_weight)
values (0.40, 0.25, 0.20, 0.15);

create table skill_match_credit (
  id              uuid primary key default gen_random_uuid(),
  match_type      text not null unique
                  check (match_type in ('exact','same_subdiscipline','same_domain','different_domain')),
  credit_multiplier numeric(3,2) not null
);

insert into skill_match_credit (match_type, credit_multiplier) values
  ('exact', 1.0),
  ('same_subdiscipline', 0.6),
  ('same_domain', 0.25),
  ('different_domain', 0.0);

create table match_scores (
  id              uuid primary key default gen_random_uuid(),
  developer_id    uuid not null references developers(id) on delete cascade,
  brief_id        uuid not null references briefs(id) on delete cascade,
  skill_score     numeric(5,2) not null default 0,
  location_score  numeric(5,2) not null default 0,
  trust_score     numeric(5,2) not null default 0,
  rating_score    numeric(5,2) not null default 0,
  overall_score   numeric(5,2) not null default 0,
  reason_text     text,
  computed_at     timestamptz default now(),
  unique (developer_id, brief_id)
);

create index match_scores_brief_overall_idx on match_scores(brief_id, overall_score desc);

alter table scoring_weights enable row level security;
alter table skill_match_credit enable row level security;
alter table match_scores enable row level security;

-- Config tables + computed scores: no public policy. Read via the admin/candidates API routes
-- (service role today; company_users-scoped read added once Prompt 16/19 land — see
-- migration_change2_004 for the company_users-based policy on match_scores).
