-- v99: spoiler-bearing author manuscripts are kept in the private schema.
-- This migration is safe and inert: it has no public RPC and makes no gameplay changes.
-- Never copy these rows into public scenario packs or a public GitHub repository.
create table if not exists igr_private.igr_v99_variant_manuscripts (
  scenario_id text not null,
  variant_id text not null check (variant_id in ('A','B','C')),
  manuscript jsonb not null check (jsonb_typeof(manuscript)='object'),
  editorial_status text not null default 'review' check (editorial_status in ('review','ready','retired')),
  approved_by text,
  approved_at timestamptz,
  content_md5 text generated always as (md5(manuscript::text)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scenario_id,variant_id),
  check ((editorial_status <> 'ready') or (approved_by is not null and approved_at is not null))
);
alter table igr_private.igr_v99_variant_manuscripts enable row level security;
revoke all on table igr_private.igr_v99_variant_manuscripts from public,anon,authenticated;
comment on table igr_private.igr_v99_variant_manuscripts is
'Confidential A/B/C author manuscripts. No public access and no runtime use before approved, tested integration.';
