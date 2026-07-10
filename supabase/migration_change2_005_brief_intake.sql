-- ============================================================
-- Design Change #2 — Part 5: Role prioritization & document/email intake (Prompt 18)
-- Additive only. Run after migration_change2_004_company_users.sql.
-- ============================================================

alter table briefs
  add column priority text not null default 'standard'
    check (priority in ('urgent','high','standard')),
  add column source_type text not null default 'manual_form'
    check (source_type in ('manual_form','pdf_upload','doc_upload','forwarded_email'));

alter table brief_attachments
  add column parsed_fields jsonb;
