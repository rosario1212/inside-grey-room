-- v164: isolated authoring sandbox for CARTEL 030, no runtime readers.
-- Never expose spoiler-bearing data through public schema or GitHub.
create table if not exists igr_private.igr_v164_030_design_drafts (
  variant_id text primary key check (variant_id in ('A','B','C')),
  editorial_status text not null default 'review' check (editorial_status in ('draft','review','approved')),
  design jsonb not null check (jsonb_typeof(design) = 'object'),
  author_review_approved boolean not null default false,
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint cartel030_approval_guard check (
    editorial_status <> 'approved' or (author_review_approved and approved_at is not null)
  )
);
alter table igr_private.igr_v164_030_design_drafts enable row level security;
revoke all on igr_private.igr_v164_030_design_drafts from public, anon, authenticated;
comment on table igr_private.igr_v164_030_design_drafts is
  'v164 isolated private spoiler-bearing working drafts for CARTEL 030.
   Neither game runtime nor release gate reads this table.
   This design is not an approved or active scenario.';
