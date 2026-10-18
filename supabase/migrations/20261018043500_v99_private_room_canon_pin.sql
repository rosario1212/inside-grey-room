-- V99 private-only room canon pin. NO PUBLIC RPC, NO GAME HOOK.
-- An approved triple may be pinned only once; the frozen snapshot protects
-- running games from later editorial revisions. No branch identifier or
-- canonical truth is written to public room.state.
create table if not exists igr_private.igr_v99_room_canons (
  room_code text primary key references public.igr_v4_rooms(code) on delete cascade,
  scenario_id text not null,
  variant_id text not null check(variant_id in ('A','B','C')),
  manuscript jsonb not null,
  manuscript_md5 text not null,
  pinned_at timestamptz not null default now()
);
alter table igr_private.igr_v99_room_canons enable row level security;
revoke all on table igr_private.igr_v99_room_canons from public, anon, authenticated;

create or replace function igr_private.igr_v99_pin_room_canon(p_room text)
returns boolean
language plpgsql security definer set search_path to ''
as $v99$
declare
  r public.igr_v4_rooms%rowtype;
  chosen igr_private.igr_v99_variant_manuscripts%rowtype;
  elig_count int;
begin
  select * into r from public.igr_v4_rooms
  where code=upper(trim(p_room)) for update;
  if not found then return false; end if;
  if exists(select 1 from igr_private.igr_v99_room_canons x
     where x.room_code=r.code) then return true; end if;
  if r.status <> 'lobby' then return false; end if;
  select count(*)::int into elig_count from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=r.scenario_id and m.editorial_status='ready'
    and m.approved_at is not null and m.approved_by is not null
    and m.manuscript->>'status'='ready'
    and m.manuscript->>'human_review_approved'='true';
  if elig_count <> 3 then return false; end if;

  select * into chosen from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=r.scenario_id and m.editorial_status='ready'
    and m.approved_at is not null and m.approved_by is not null
  order by gen_random_uuid() limit 1;

  if not found then return false; end if;
  insert into igr_private.igr_v99_room_canons
   (room_code, scenario_id, variant_id, manuscript, manuscript_md5)
  values(r.code,r.scenario_id,chosen.variant_id,chosen.manuscript,chosen.content_md5);
  return true;
end $v99$;

create or replace function igr_private.igr_v99_pinned_room_canon(p_room text)
returns jsonb
language sql security definer set search_path to ''
as $v99$
  select x.manuscript from igr_private.igr_v99_room_canons x
  where x.room_code=upper(trim(p_room))
$v99$;

revoke all on function igr_private.igr_v99_pin_room_canon(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v99_pinned_room_canon(text) from public,anon,authenticated;

comment on function igr_private.igr_v99_pin_room_canon(text) is
'Internal-only staged implementation; not yet called by start-game or Heritage. No manuscript is ready and this must not be made public.';
