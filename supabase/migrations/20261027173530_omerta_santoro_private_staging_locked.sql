-- OMERTÀ Santoro: stockage privé de brouillons, jamais une activation de gameplay.
-- Aucun manuscrit secret dans le dépôt, aucune modification de la synchronisation V4.
create table if not exists igr_private.igr_omerta_santoro_v25_drafts (
  scenario_id text not null check(scenario_id in ('021','022','023','024','025')),
  variant_id text not null check(variant_id in ('A','B','C')),
  manuscript jsonb not null,
  editorial_status text not null default 'review'
    check(editorial_status in ('review','ready','rejected')),
  approved_by text,
  approved_at timestamptz,
  content_md5 text,
  staged_at timestamptz not null default now(),
  primary key(scenario_id,variant_id),
  check((editorial_status='ready')=(approved_by is not null and approved_at is not null))
);
alter table igr_private.igr_omerta_santoro_v25_drafts enable row level security;
revoke all on table igr_private.igr_omerta_santoro_v25_drafts
  from public,anon,authenticated;

create table if not exists igr_private.igr_omerta_standalone_release_control (
  id integer primary key check(id=1),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table igr_private.igr_omerta_standalone_release_control enable row level security;
revoke all on table igr_private.igr_omerta_standalone_release_control
  from public,anon,authenticated;
insert into igr_private.igr_omerta_standalone_release_control (id,enabled)
values (1,false) on conflict(id) do nothing;
