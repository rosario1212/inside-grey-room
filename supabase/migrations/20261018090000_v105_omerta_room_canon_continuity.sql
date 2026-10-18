-- v105. Private-only: OMERTA rooms inherit their campaign's immutable A/B/C.
-- No client-visible variant letter, game RPC hook, editorial approval, or unlock.
create or replace function igr_private.igr_v99_pin_room_canon(p_room text)
returns boolean
language plpgsql security definer set search_path to ''
as $v105$
declare
  r public.igr_v4_rooms%rowtype;
  chosen igr_private.igr_v99_variant_manuscripts%rowtype;
  pinned igr_private.igr_v99_room_canons%rowtype;
  check_result jsonb;
  campaign_uuid uuid;
  campaign_branch text;
  is_omerta boolean;
begin
  if p_room is null or pg_catalog.length(pg_catalog.btrim(p_room))=0 then
    return false;
  end if;

  -- One row lock serializes competing starts and reconnections for a room.
  select * into r from public.igr_v4_rooms
  where code=pg_catalog.upper(pg_catalog.btrim(p_room)) for update;
  if not found then return false; end if;

  is_omerta := r.scenario_id between '021' and '025';

  -- Existing snapshots can never be rerolled. Also reject changed campaign link.
  if is_omerta then
    select l.campaign_id into campaign_uuid
    from public.igr_omerta_room_campaigns l where l.room_code=r.code;
    if not found or campaign_uuid is null then return false; end if;
  end if;

  select * into pinned from igr_private.igr_v99_room_canons x
  where x.room_code=r.code;
  if found then
    if pinned.scenario_id<>r.scenario_id then return false; end if;
    if is_omerta then
      -- A historical room must not disagree with its already locked campaign.
      select b.branch_id into campaign_branch
      from igr_private.igr_v101_omerta_campaign_branches b
      where b.campaign_id=campaign_uuid;
      return campaign_branch is not null and campaign_branch=pinned.variant_id;
    end if;
    return true;
  end if;

  if r.status <> 'lobby' then return false; end if;

  check_result:=igr_private.igr_v100_preflight(r.scenario_id);
  if coalesce((check_result->>'release_eligible')::boolean,false) is not true
    then return false;
  end if;

  if is_omerta then
    -- v101 serializes all five chapters on the campaign row and rejects
    -- any unapproved or non-verified A/B/C in any of the five chapters.
    campaign_branch:=igr_private.igr_v101_pin_omerta_branch(campaign_uuid);
    if campaign_branch is null then return false; end if;
  end if;

  select * into chosen from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=r.scenario_id and m.editorial_status='ready'
    and m.approved_by is not null and m.approved_at is not null
    and m.manuscript->>'status'='ready'
    and m.manuscript->>'human_review_approved'='true'
    and (not is_omerta or m.variant_id=campaign_branch)
  order by pg_catalog.gen_random_uuid() limit 1;
  if not found then return false; end if;

  insert into igr_private.igr_v99_room_canons
    (room_code,scenario_id,variant_id,manuscript,manuscript_md5)
  values (r.code,r.scenario_id,chosen.variant_id,chosen.manuscript,chosen.content_md5);
  return true;
end $v105$;
revoke all on function igr_private.igr_v99_pin_room_canon(text)
from public,anon,authenticated;
comment on function igr_private.igr_v99_pin_room_canon(text) is
'v105 internal-only dormant room pin: v103 triple preflight, OMERTA campaign A/B/C consistency, immutable snapshots. No public RPC hook.';