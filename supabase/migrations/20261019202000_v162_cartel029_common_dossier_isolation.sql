-- v162: keep previous matches out of the Dossier commun in 029 only.
CREATE OR REPLACE FUNCTION public.igr_v106_common_dossier(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  shared jsonb;
begin
  perform igr_private.rate_limit('v106_common_dossier',p_player_token::text,90,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code;
  if not found then raise exception 'room not found'; end if;
  select coalesce(jsonb_agg(
    jsonb_build_object('id',e.id,'event_type',e.event_type,
      'title',left(coalesce(e.payload->>'title',''),160),
      'text',left(coalesce(e.payload->>'text',e.payload->>'summary',''),1200),
      'author',left(coalesce(e.payload->>'author',''),80),
      'source',left(coalesce(e.payload->>'source',''),50),
      'press_claim',e.payload->>'press_claim'='true',
      'verified',e.payload->>'verified'='true',
      'cycle',e.cycle,'created_at',e.created_at)
    order by e.id),'[]'::jsonb) into shared
  from public.igr_v4_events e
  where e.room_code=actor.room_code and e.visibility='public'
    -- 029 reuses a room code across matches; exclude old public stories/reveals.
    and (current_room.scenario_id<>'029'
      or e.id >= coalesce((select max(start_event.id)
        from public.igr_v4_events start_event
        where start_event.room_code=actor.room_code and start_event.event_type='context'),0))
    and (e.event_type in (
      'breaking_news','context','public_announcement','public_notice',
      'public_evidence','public_statement','public_event','announcement'
    ) or e.payload->>'public_broadcast'='true'
       or (e.event_type='reveal' and current_room.status='finished'))
    and coalesce(e.payload->>'title',e.payload->>'text',e.payload->>'summary','')<>'';
  return jsonb_build_object('room_code',current_room.code,
    'context',(select left(coalesce(sp.pack->>'context',''),1800)
       from public.igr_v4_scenario_packs sp where sp.scenario_id=current_room.scenario_id),
    'events',shared);
end $function$;
