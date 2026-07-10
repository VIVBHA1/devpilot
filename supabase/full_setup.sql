-- ============================================
-- DevPilot full setup: base schema + Change #1 + seed
-- Paste this whole file into Supabase SQL Editor and Run.
-- ============================================

-- DevPilot Database Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- TABLE: developers
-- ============================================================
create table developers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  -- Personal
  full_name       text not null,
  email           text not null unique,
  phone           text,
  city            text default 'Bengaluru',

  -- Professional links
  linkedin_url    text not null,
  github_url      text,
  portfolio_url   text,
  cv_url          text,

  -- Role
  primary_role    text not null check (primary_role in ('Full-Stack', 'Cloud', 'Both')),
  years_exp       integer not null,
  tech_stack      text[] not null,

  -- Availability + rate
  available_from  date,
  weekly_hours    integer check (weekly_hours in (20, 40)),
  monthly_rate_min integer,
  monthly_rate_max integer,

  -- Vetting
  status          text not null default 'applied'
                  check (status in ('applied','screening','code_test','design_call',
                                    'reference_check','approved','rejected','suspended')),
  vetting_notes   text,
  vetted_at       timestamptz,
  vetted_by       text,
  tier            text check (tier in ('Standard','Senior','Lead')),

  -- Platform
  slug            text unique,
  is_visible      boolean default false,
  profile_score   numeric(3,1),
  total_engagements integer default 0
);

-- ============================================================
-- TABLE: buyers
-- ============================================================
create table buyers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  user_id         uuid references auth.users(id),

  company_name    text not null,
  company_email   text not null unique,
  website         text,
  company_size    text check (company_size in ('1-10','11-50','51-200','200+')),
  stage           text check (stage in ('Idea','Pre-Seed','Seed','Series A','Series B+','SME')),
  industry        text,

  contact_name    text not null,
  contact_role    text,

  subscription_tier text default 'free' check (subscription_tier in ('free','growth','portfolio')),
  subscription_until timestamptz,
  total_engagements integer default 0
);

-- ============================================================
-- TABLE: briefs
-- ============================================================
create table briefs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  buyer_id        uuid references buyers(id),

  role_type       text not null check (role_type in ('Full-Stack','Cloud','DevOps','Both')),
  title           text not null,
  description     text not null,
  tech_stack      text[],
  duration_weeks  integer not null,
  weekly_hours    integer check (weekly_hours in (20,40)),
  start_date      date,
  budget_min      integer,
  budget_max      integer,

  status          text default 'open'
                  check (status in ('open','matching','shortlisted','contracted','closed','cancelled')),
  matched_at      timestamptz
);

-- ============================================================
-- TABLE: shortlists
-- ============================================================
create table shortlists (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  brief_id        uuid references briefs(id),
  developer_id    uuid references developers(id),
  position        integer check (position in (1,2,3)),
  status          text default 'pending'
                  check (status in ('pending','accepted','declined','contracted'))
);

-- Enforce max 3 shortlists per brief
create unique index shortlists_brief_position_unique on shortlists(brief_id, position);

-- ============================================================
-- TABLE: engagements
-- ============================================================
create table engagements (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  brief_id        uuid references briefs(id),
  developer_id    uuid references developers(id),
  buyer_id        uuid references buyers(id),

  start_date      date not null,
  end_date        date,
  weekly_hours    integer,
  monthly_rate    integer not null,
  platform_fee_pct numeric(4,2) default 13.00,

  status          text default 'active'
                  check (status in ('active','paused','completed','cancelled','disputed')),

  -- Weekly updates stored as JSONB array
  weekly_updates  jsonb default '[]'::jsonb,

  -- Rating
  rating_quality        integer check (rating_quality between 1 and 5),
  rating_communication  integer check (rating_communication between 1 and 5),
  rating_deadlines      integer check (rating_deadlines between 1 and 5),
  rating_scope          integer check (rating_scope between 1 and 5),
  rating_rehire         integer check (rating_rehire between 1 and 5),
  rating_overall        numeric(3,2),
  rating_comment        text,
  rated_at              timestamptz
);

-- ============================================================
-- TABLE: milestones
-- ============================================================
create table milestones (
  id              uuid primary key default gen_random_uuid(),
  engagement_id   uuid references engagements(id),
  title           text not null,
  description     text,
  due_date        date,
  amount_inr      integer not null,
  status          text default 'pending'
                  check (status in ('pending','submitted','approved','paid','disputed')),
  submitted_at    timestamptz,
  approved_at     timestamptz,
  paid_at         timestamptz,
  razorpay_payment_id text
);

-- ============================================================
-- TRIGGER: auto-update updated_at on developers
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger developers_updated_at
  before update on developers
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table developers enable row level security;
alter table buyers enable row level security;
alter table briefs enable row level security;
alter table shortlists enable row level security;
alter table engagements enable row level security;
alter table milestones enable row level security;

-- developers: public can only see approved/visible profiles
create policy "developers_public_read" on developers
  for select using (is_visible = true);

-- developers: service role has full access (set via admin client — bypasses RLS)

-- buyers: authenticated users see only their own row
create policy "buyers_own_read" on buyers
  for select using (auth.uid() = user_id);

create policy "buyers_own_update" on buyers
  for update using (auth.uid() = user_id);

-- briefs: buyers see only their own briefs
create policy "briefs_buyer_read" on briefs
  for select using (
    buyer_id in (select id from buyers where user_id = auth.uid())
  );

create policy "briefs_buyer_insert" on briefs
  for insert with check (
    buyer_id in (select id from buyers where user_id = auth.uid())
  );

-- engagements: buyer or (future) developer can see their own
create policy "engagements_buyer_read" on engagements
  for select using (
    buyer_id in (select id from buyers where user_id = auth.uid())
  );

-- milestones: accessible through engagement ownership
create policy "milestones_buyer_read" on milestones
  for select using (
    engagement_id in (
      select id from engagements
      where buyer_id in (select id from buyers where user_id = auth.uid())
    )
  );


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


-- Seed: 3 approved developers for testing
insert into developers (
  full_name, email, phone, city,
  linkedin_url, github_url,
  primary_role, years_exp, tech_stack,
  available_from, weekly_hours,
  monthly_rate_min, monthly_rate_max,
  status, tier, slug, is_visible, id_verification_status,
  vetted_at, vetted_by, profile_score, total_engagements
) values
(
  'Arjun Mehta', 'arjun.mehta@example.com', '+91 9876543210', 'Bengaluru',
  'https://linkedin.com/in/arjunmehta', 'https://github.com/arjunmehta',
  'Full-Stack', 6, ARRAY['React','Next.js','TypeScript','Node.js','PostgreSQL','AWS'],
  current_date + interval '7 days', 40,
  150000, 250000,
  'approved', 'Senior', 'arjun-mehta-a1b2', true, 'verified',
  now(), 'admin@devpilot.in', 4.8, 3
),
(
  'Priya Sharma', 'priya.sharma@example.com', '+91 9765432109', 'Hyderabad',
  'https://linkedin.com/in/priyasharma', 'https://github.com/priyasharma',
  'Cloud', 8, ARRAY['AWS','Terraform','Kubernetes','Docker','Python','CI/CD'],
  current_date + interval '14 days', 40,
  200000, 350000,
  'approved', 'Lead', 'priya-sharma-c3d4', true, 'verified',
  now(), 'admin@devpilot.in', 4.9, 5
),
(
  'Rohan Verma', 'rohan.verma@example.com', '+91 9654321098', 'Delhi-NCR',
  'https://linkedin.com/in/rohanverma', null,
  'Both', 4, ARRAY['React','Node.js','GCP','Docker','MongoDB','GraphQL'],
  current_date + interval '3 days', 20,
  80000, 140000,
  'approved', 'Standard', 'rohan-verma-e5f6', true, 'verified',
  now(), 'admin@devpilot.in', null, 0
);
