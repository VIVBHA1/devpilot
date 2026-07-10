-- ============================================================
-- DevPilot — Design Change #1 Migration
-- Run AFTER the original schema.sql. Everything here is additive.
-- ============================================================

-- ── 2.1 developers: new columns ────────────────────────────
alter table developers
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('Male','Female','Non-binary','Prefer not to say')),
  add column if not exists state text,
  add column if not exists country text default 'India',
  add column if not exists job_interests text[],
  add column if not exists location_interests text[],
  add column if not exists video_intro_url text,
  add column if not exists id_document_type text check (id_document_type in ('Aadhaar','PAN','Passport','Driving License')),
  add column if not exists id_document_url text,
  add column if not exists id_document_last4 text,
  add column if not exists id_verification_status text default 'not_started'
    check (id_verification_status in ('not_started','pending','verified','rejected')),
  add column if not exists kyc_provider text,
  add column if not exists kyc_reference_id text,
  add column if not exists kyc_verified_at timestamptz,
  add column if not exists kyc_rejection_reason text;

-- ── 2.2 developer_work_history ─────────────────────────────
create table if not exists developer_work_history (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  company_name  text not null,
  role_title    text not null,
  start_date    date,
  end_date      date,                 -- null = currently working here
  description   text,
  client_reference_name text,
  client_reference_contact text
);

-- ── 2.3 developer_portfolio_items ──────────────────────────
create table if not exists developer_portfolio_items (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  title         text not null,
  description   text,
  project_url   text,
  image_url     text,
  tech_stack    text[],
  display_order integer default 0
);

-- ── 2.4 developer_certifications ───────────────────────────
create table if not exists developer_certifications (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  name          text not null,
  issuing_body  text,
  issue_date    date,
  expiry_date   date,
  certificate_file_url text,
  verified      boolean default false
);

-- ── 2.5 developer_skill_tests ──────────────────────────────
create table if not exists developer_skill_tests (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  skill_name    text not null,
  test_provider text default 'DevPilot Internal',
  score         numeric,
  max_score     numeric,
  test_date     date,
  certificate_url text
);

-- ── 2.6 developer_references ───────────────────────────────
create table if not exists developer_references (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  reference_name text not null,
  reference_email text,
  reference_phone text,
  relationship  text,
  company_name  text,
  contacted_status text default 'not_contacted'
    check (contacted_status in ('not_contacted','contacted','verified','unreachable')),
  notes         text
);

-- ── 2.7 developer_rate_cards ───────────────────────────────
create table if not exists developer_rate_cards (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid references developers(id) on delete cascade,
  skill_or_role text not null,
  engagement_type text check (engagement_type in ('hourly','project','monthly')),
  rate_amount   integer,              -- INR
  notes         text
);

-- ── 2.8 briefs: new columns ────────────────────────────────
alter table briefs
  add column if not exists project_type text check (project_type in ('fixed','hourly')),
  add column if not exists experience_level_required text check (experience_level_required in ('Junior','Mid','Senior','Any')),
  add column if not exists is_negotiable boolean default true;

-- ── 2.9 brief_attachments ──────────────────────────────────
create table if not exists brief_attachments (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid references briefs(id) on delete cascade,
  file_url      text not null,
  file_name     text,
  file_type     text,                 -- 'pdf' | 'figma_link' | 'image'
  uploaded_at   timestamptz default now()
);

-- ── 2.10 brief_negotiations (insert-only, immutable) ───────
create table if not exists brief_negotiations (
  id            uuid primary key default gen_random_uuid(),
  brief_id      uuid references briefs(id) on delete cascade,
  shortlist_id  uuid references shortlists(id) on delete cascade,
  proposed_by   text check (proposed_by in ('buyer','developer','admin')),
  proposed_rate integer,              -- monthly INR
  proposed_start_date date,
  message       text,
  status        text default 'pending' check (status in ('pending','accepted','rejected','countered')),
  created_at    timestamptz default now()
);

-- ============================================================
-- Business Rule §7.5 — auto-compute rate summary from rate cards
-- developers.monthly_rate_min / max = min/max across rate cards
-- ============================================================
create or replace function sync_developer_rate_summary()
returns trigger language plpgsql as $$
declare
  dev uuid;
begin
  dev := coalesce(new.developer_id, old.developer_id);
  update developers d set
    monthly_rate_min = sub.min_rate,
    monthly_rate_max = sub.max_rate
  from (
    select min(rate_amount) as min_rate, max(rate_amount) as max_rate
    from developer_rate_cards
    where developer_id = dev
  ) sub
  where d.id = dev;
  return coalesce(new, old);
end;
$$;

drop trigger if exists rate_card_sync on developer_rate_cards;
create trigger rate_card_sync
  after insert or update or delete on developer_rate_cards
  for each row execute function sync_developer_rate_summary();

-- ============================================================
-- Row Level Security for new tables
-- Public can read child tables only for visible developers.
-- Service role (admin client) bypasses RLS for writes.
-- ============================================================
alter table developer_work_history   enable row level security;
alter table developer_portfolio_items enable row level security;
alter table developer_certifications enable row level security;
alter table developer_skill_tests    enable row level security;
alter table developer_references     enable row level security;
alter table developer_rate_cards     enable row level security;
alter table brief_attachments        enable row level security;
alter table brief_negotiations       enable row level security;

-- Public read of profile child tables only when developer is visible.
create policy "work_history_public_read" on developer_work_history
  for select using (
    developer_id in (select id from developers where is_visible = true)
  );
create policy "portfolio_public_read" on developer_portfolio_items
  for select using (
    developer_id in (select id from developers where is_visible = true)
  );
create policy "certs_public_read" on developer_certifications
  for select using (
    developer_id in (select id from developers where is_visible = true)
  );
create policy "skill_tests_public_read" on developer_skill_tests
  for select using (
    developer_id in (select id from developers where is_visible = true)
  );
create policy "rate_cards_public_read" on developer_rate_cards
  for select using (
    developer_id in (select id from developers where is_visible = true)
  );
-- developer_references: NO public policy — vetting-internal only (service role only).

-- brief_attachments / brief_negotiations: buyer can read their own via brief ownership.
create policy "brief_attachments_buyer_read" on brief_attachments
  for select using (
    brief_id in (
      select id from briefs where buyer_id in (select id from buyers where user_id = auth.uid())
    )
  );
create policy "brief_negotiations_buyer_read" on brief_negotiations
  for select using (
    brief_id in (
      select id from briefs where buyer_id in (select id from buyers where user_id = auth.uid())
    )
  );

-- ============================================================
-- Business Rule §7 — is_visible only when approved AND id verified.
-- Enforced in application logic (admin approve action); this trigger
-- is a DB-level backstop that flips is_visible off if either fails.
-- ============================================================
create or replace function enforce_visibility_gate()
returns trigger language plpgsql as $$
begin
  if new.is_visible = true
     and (new.status <> 'approved' or new.id_verification_status <> 'verified') then
    new.is_visible := false;
  end if;
  return new;
end;
$$;

drop trigger if exists visibility_gate on developers;
create trigger visibility_gate
  before insert or update on developers
  for each row execute function enforce_visibility_gate();

-- ============================================================
-- Storage buckets (run once). The id-docs bucket MUST stay private.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('devpilot-public', 'devpilot-public', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('devpilot-id-docs', 'devpilot-id-docs', false)
  on conflict (id) do nothing;
