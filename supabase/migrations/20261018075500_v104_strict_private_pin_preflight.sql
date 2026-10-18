-- v104: dormant private room pin cannot bypass v103 release verification.
-- This does not touch the public game RPCs, the active packs, or editorial statuses.
create or replace function igr_private.igr_v99_pin_room_canon(p_room text)
returns boolean
language plpgsql security definer set search_path to ''
as $v104$
declare
  r public.igr_v4_rooms%rowtype;
  chosen igr_private.igr_v99_variant_manuscripts%rowtype;
  check_result jsonb;
begin
  if p_room is null or pg_catalog.length(pg_catalog.btrim(p_room)) = 0 then
    return false;
  end if;

  -- Serialize starts and reconnects for this room.
  select * into r
  from public.igr_v4_rooms
  where code=pg_catalog.upper(pg_catalog.btrim(p_room))
  for update;
  if not found then return false; end if;

  -- Never reroll a prior selection. Reject a stale snapshot after scenario changes.
  if exists (select 1 from igr_private.igr_v99_room_canons x where x.room_code=r.code) then
    return exists (
      select 1 from igr_private.igr_v99_room_canons x
      where x.room_code=r.code and x.scenario_id=r.scenario_id
    );
  end if;

  if r.status <> 'lobby' then return false; end if;

  -- The complete A/B/C triple must have individually reviewed evidence,
  -- distinct canonical truths, and valid saga continuity.
  check_result := igr_private.igr_v100_preflight(r.scenario_id);
  if coalesce((check_result->>'release_eligible')::boolean,false) is not true then
    return false;
  end if;

  select * into chosen from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=r.scenario_id and m.editorial_status='ready'
    and m.approved_by is not null and m.approved_at is not null
    and m.manuscript->>'status'='ready'
    and m.manuscript->>'human_review_approved'='true'
  order by pg_catalog.gen_random_uuid() limit 1;
  if not found then return false; end if;

  insert into igr_private.igr_v99_room_canons
    (room_code,scenario_id,variant_id,manuscript,manuscript_md5)
  values (r.code,r.scenario_id,chosen.variant_id,chosen.manuscript,chosen.content_md5);

  return true;
end $v104$;

revoke all on function igr_private.igr_v99_pin_room_canon(text)
  from public, anon, authenticated;

comment on function igr_private.igr_v99_pin_room_canon(text) is
'v104 internal-only dormant pin: requires strict v103 release preflight; preserves existing immutable snapshot and rejects scenario mismatch. No public game hook.';