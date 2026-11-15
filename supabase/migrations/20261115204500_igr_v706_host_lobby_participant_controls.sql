BEGIN;
-- v706: an actual lobby exit (including host-only removal) must release its seat,
-- undo expired preferred-role reservations, and revoke the departed session.
-- Explicitly do not delete a player from an already-running investigation.
DO $patch$
DECLARE ddl text;
 old_anchor text:=$old$
  select * into p from public.igr_v4_players
  where room_code=v_code and player_token=p_player_token
  for update;
  if not found then return jsonb_build_object('ok',true,'already_left',true); end if;

  select * into r from public.igr_v4_rooms where code=v_code for update;
  if not found then return jsonb_build_object('ok',true,'room_closed',true); end if;$old$;
 new_anchor text:=$new$
  -- v706: lock the room before the player. The host's kick uses the same order.
  select * into r from public.igr_v4_rooms where code=v_code for update;
  if not found then return jsonb_build_object('ok',true,'room_closed',true); end if;

  select * into p from public.igr_v4_players
  where room_code=v_code and player_token=p_player_token
  for update;
  if not found then return jsonb_build_object('ok',true,'already_left',true); end if;$new$;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure) INTO ddl;
 IF position('v706: lock the room before the player' IN ddl)=0 THEN
  IF position(old_anchor IN ddl)=0 OR position('v700 departure role reconciliation' IN ddl)=0
   THEN RAISE EXCEPTION 'v706 leave_room baseline changed, manual migration required'; END IF;
  ddl:=replace(ddl,old_anchor,new_anchor);
  ddl:=replace(ddl,
   '  delete from public.igr_v4_players where id=p.id;'||E'\n  select count(*) into v_count',
   $replacement$
  delete from public.igr_v4_players where id=p.id;
  -- v706: a departed player must not retain their old victory-role reservation.
  IF jsonb_typeof(r.state->'victory_reservations')='array' THEN
   UPDATE public.igr_v4_rooms
   SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{victory_reservations}',
       coalesce((SELECT jsonb_agg(item)
         FROM jsonb_array_elements(r.state->'victory_reservations') item
         WHERE item->>'player_id'<>p.id::text),'[]'::jsonb),true)
   WHERE code=v_code;
  END IF;
  INSERT INTO public.igr_v4_events(room_code,event_type,visibility,payload)
  VALUES(v_code,'player_left','public',
   jsonb_build_object('title','DÉPART DU LOBBY','text',p.pseudo||' a quitté la cellule.','player_id',p.id));
  UPDATE public.igr_v4_rooms SET updated_at=clock_timestamp() WHERE code=v_code;
  select count(*) into v_count$replacement$);
  IF position('v706: lock the room before the player' IN ddl)=0 OR
   position('DÉPART DU LOBBY' IN ddl)=0
  THEN RAISE EXCEPTION 'v706 leave_room patch incomplete';END IF;
  EXECUTE ddl;
 END IF;
END $patch$;

CREATE OR REPLACE FUNCTION public.igr_v706_host_kick_lobby(
 p_code text,p_host_token uuid,p_player_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;target public.igr_v4_players%rowtype;
 outcome jsonb;
BEGIN
 PERFORM igr_private.rate_limit('igr_v706_kick',coalesce(p_host_token::text,''),20,60);
 SELECT * INTO r FROM public.igr_v4_rooms
 WHERE code=upper(trim(p_code)) AND host_token=p_host_token FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'host authorization required'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'cannot exclude after the game starts';END IF;
 SELECT * INTO target FROM public.igr_v4_players
 WHERE room_code=r.code AND id=p_player_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'player no longer in lobby';END IF;
 IF target.is_host THEN RAISE EXCEPTION 'the host cannot be excluded';END IF;
 outcome:=public.igr_v4_leave_room(r.code,target.player_token);
 IF coalesce((outcome->>'left')::boolean,false) IS NOT TRUE THEN
  RAISE EXCEPTION 'lobby removal did not complete';END IF;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,payload)
 VALUES(r.code,'player_excluded','public',
  jsonb_build_object('title','PARTICIPANT RETIRÉ',
    'text',target.pseudo||' a été retiré du lobby par l’hôte.',
    'player_id',target.id));
 RETURN jsonb_build_object('ok',true,'removed_player_id',target.id,
   'remaining',outcome->'remaining',
   'role_reservations_released',outcome->'role_reservations_released');
END $function$;
REVOKE ALL ON FUNCTION public.igr_v706_host_kick_lobby(text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v706_host_kick_lobby(text,uuid,uuid) TO anon,authenticated;

-- Used only after a failed lobby sync, never as an unauthenticated player list.
-- A missing/removed token produces only a boolean, not room or user details.
CREATE OR REPLACE FUNCTION public.igr_v706_lobby_session_status(
 p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 SELECT jsonb_build_object('active',EXISTS(
   SELECT 1 FROM public.igr_v4_players p
   JOIN public.igr_v4_rooms r ON r.code=p.room_code
   WHERE p.room_code=upper(trim(p_code)) AND p.player_token=p_player_token
 ));
$function$;
REVOKE ALL ON FUNCTION public.igr_v706_lobby_session_status(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v706_lobby_session_status(text,uuid) TO anon,authenticated;

DO $verify$
DECLARE ddl text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure) INTO ddl;
 IF position('v706: lock the room before the player' IN ddl)=0
    OR position('v700 departure role reconciliation' IN ddl)=0
 THEN RAISE EXCEPTION 'v706 departure or role reconciliation not installed'; END IF;
END $verify$;
COMMIT;
