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
