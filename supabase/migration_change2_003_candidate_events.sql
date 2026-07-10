-- ============================================================
-- Design Change #2 — Part 3: Candidate events & sourcing (Prompt 15)
-- Additive only. Run after migration_change2_002_matching.sql.
-- ============================================================

create table sourcing_partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_email   text,
  type            text not null
                  check (type in ('staffing_partner','field_recruiter','referral_program')),
  created_at      timestamptz default now()
);

alter table developers
  add column source_type text not null default 'self_signup'
    check (source_type in ('self_signup','staffing_partner','field_recruiter','referral','bulk_import')),
  add column sourced_by_partner_id uuid references sourcing_partners(id);

create table candidate_events (
  id              uuid primary key default gen_random_uuid(),
  developer_id    uuid not null references developers(id) on delete cascade,
  event_type      text not null,
  actor_type      text not null check (actor_type in ('system','candidate','admin','partner')),
  actor_id        text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index candidate_events_developer_idx on candidate_events(developer_id, created_at desc);
create index candidate_events_type_idx on candidate_events(event_type, created_at desc);

alter table sourcing_partners enable row level security;
alter table candidate_events enable row level security;

-- No public policy on either table — admin-analytics-only, read via the service role client.
