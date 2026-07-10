-- ============================================================
-- Design Change #2 — Part 6: Screening ratings & offer links (Prompts 19-20)
-- Additive only. Run after migration_change2_005_brief_intake.sql.
-- ============================================================

create table candidate_screening_ratings (
  id                  uuid primary key default gen_random_uuid(),
  brief_id            uuid not null references briefs(id) on delete cascade,
  developer_id        uuid not null references developers(id) on delete cascade,
  rated_by            uuid references company_users(id),
  profile_quality     integer not null check (profile_quality between 1 and 5),
  presentability      integer not null check (presentability between 1 and 5),
  responsiveness      integer not null check (responsiveness between 1 and 5),
  expectation_match   integer not null check (expectation_match between 1 and 5),
  notes               text,
  created_at          timestamptz default now(),
  locked_at           timestamptz,
  unique (brief_id, developer_id)
);

alter table candidate_screening_ratings enable row level security;

create policy "screening_ratings_company_rw" on candidate_screening_ratings
  for all using (
    exists (
      select 1 from briefs br
      join buyers b on b.id = br.buyer_id
      where br.id = candidate_screening_ratings.brief_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from briefs br
      join buyers b on b.id = br.buyer_id
      where br.id = candidate_screening_ratings.brief_id and b.user_id = auth.uid()
    )
  );

-- Single-use magic links for the candidate offer-response page (§Prompt 20).
-- No schema change to brief_negotiations — it already supports proposed_by in
-- ('buyer','developer','admin').
create table offer_links (
  id                    uuid primary key default gen_random_uuid(),
  brief_negotiation_id  uuid not null references brief_negotiations(id) on delete cascade,
  token                 text not null unique,
  expires_at            timestamptz not null,
  used_at               timestamptz,
  created_at            timestamptz default now()
);

create index offer_links_token_idx on offer_links(token);

alter table offer_links enable row level security;
-- No public policy — offer_links are only ever looked up by exact token via the service-role
-- client in app/api/offer-links/[token]/route.ts, never listed or browsed.
