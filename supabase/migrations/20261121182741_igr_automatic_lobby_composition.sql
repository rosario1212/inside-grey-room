-- Keep certified four-player composition synchronized with explicit role choices.
DO $auto_mode$
DECLARE def text; oldv text; newv text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_choose_role(text,uuid,text)'::regprocedure) INTO def;
 oldv:=$a$ if p_role in ('','none','annuler','cancel') then update public.igr_v4_players set preferred_role=null where id=p.id; return jsonb_build_object('ok',true,'role',null,'cleared',true); end if;$a$;
 newv:=$b$ if p_role in ('','none','annuler','cancel') then
   update public.igr_v4_players set preferred_role=null where id=p.id;
   IF public.igr_v805_team4_allowed(r.scenario_id) THEN
     UPDATE public.igr_v4_rooms SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb(CASE WHEN EXISTS(SELECT 1 FROM public.igr_v4_players WHERE room_code=r.code AND preferred_role='analyste') THEN 'team'::text ELSE 'classic'::text END),true),updated_at=now() WHERE code=r.code;
   END IF;
   return jsonb_build_object('ok',true,'role',null,'cleared',true);
 end if;$b$;
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'cancel anchor changed'; END IF;
 def:=replace(def,oldv,newv);
 oldv:=$a$ IF p_role='analyste' AND c<=4 AND public.igr_v805_team4_allowed(r.scenario_id)
    AND coalesce(r.state->>'four_player_mode','classic')<>'team' THEN
   IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=r.code AND id<>p.id AND preferred_role='suspect')>2 THEN
     RAISE EXCEPTION 'role unavailable: three suspects already reserved';
   END IF;
   UPDATE public.igr_v4_rooms
     SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb('team'::text),true),updated_at=now()
     WHERE code=r.code;
 END IF;$a$;
 newv:=$b$ IF public.igr_v805_team4_allowed(r.scenario_id) AND c<=4 THEN
   IF p_role='analyste' AND (SELECT count(*) FROM public.igr_v4_players WHERE room_code=r.code AND id<>p.id AND preferred_role='suspect')>2 THEN
     RAISE EXCEPTION 'role unavailable: three suspects already reserved';
   END IF;
   -- Compute prospective composition, without discarding any other reservation.
   -- The room is locked; a failed capacity check rolls back this update.
   UPDATE public.igr_v4_rooms
     SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb(
       CASE WHEN p_role='analyste' OR EXISTS(SELECT 1 FROM public.igr_v4_players WHERE room_code=r.code AND id<>p.id AND preferred_role='analyste')
       THEN 'team'::text ELSE 'classic'::text END),true),updated_at=now()
     WHERE code=r.code;
 END IF;$b$;
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'reservation anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);

 SELECT pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure) INTO def;
 oldv:='  -- v700 departure role reconciliation: never leave a now-unavailable role claimed.';
 newv:=$b$  -- Reflect surviving Analyst reservations before reconciling seat limits.
  IF public.igr_v805_team4_allowed(r.scenario_id) AND v_count<=4 THEN
    UPDATE public.igr_v4_rooms SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb(
      CASE WHEN EXISTS(SELECT 1 FROM public.igr_v4_players WHERE room_code=v_code AND preferred_role='analyste')
      THEN 'team'::text ELSE 'classic'::text END),true) WHERE code=v_code;
  END IF;

  -- v700 departure role reconciliation: never leave a now-unavailable role claimed.$b$;
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'departure anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);
END $auto_mode$;
