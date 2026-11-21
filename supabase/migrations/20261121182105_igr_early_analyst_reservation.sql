-- Allow an Analyst reservation as soon as a certified four-player lobby opens.
-- Use the existing authenticated, room-locked chooser; do not bypass capacity.
DO $early_analyst$
DECLARE def text; oldv text; newv text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v800_role_capacity(text,text)'::regprocedure) INTO def;
 oldv:='AND n=4 AND r.state->>''four_player_mode''=''team''';
 newv:='AND n<=4 AND r.state->>''four_player_mode''=''team''';
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'capacity team anchor changed'; END IF;
 def:=replace(def,oldv,newv);
 oldv:='IF r.scenario_id=''009'' AND n=4 THEN';
 newv:='IF r.scenario_id=''009'' AND n<=4 THEN';
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'capacity classic anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);

 SELECT pg_get_functiondef('public.igr_v800_set_four_player_mode(text,uuid,text)'::regprocedure) INTO def;
 oldv:='OR n<>4 THEN';
 newv:='OR n>4 THEN';
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'mode selector anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);

 SELECT pg_get_functiondef('public.igr_v4_choose_role(text,uuid,text)'::regprocedure) INTO def;
 oldv:=' cap:=public.igr_v800_role_capacity(r.code,p_role);';
 newv:=$body$
 -- Choosing Analyst opts into Team-4 atomically, without displacing another player.
 IF p_role='analyste' AND c<=4 AND public.igr_v805_team4_allowed(r.scenario_id)
    AND coalesce(r.state->>'four_player_mode','classic')<>'team' THEN
   IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=r.code AND id<>p.id AND preferred_role='suspect')>2 THEN
     RAISE EXCEPTION 'role unavailable: three suspects already reserved';
   END IF;
   UPDATE public.igr_v4_rooms
     SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb('team'::text),true),updated_at=now()
     WHERE code=r.code;
 END IF;
 cap:=public.igr_v800_role_capacity(r.code,p_role);$body$;
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'role chooser anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);

 -- Persist the certified composition in the launched room for every certified dossier.
 SELECT pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure) INTO def;
 oldv:='CASE WHEN r.scenario_id=''001'' AND c=4 THEN coalesce(r.state->>''four_player_mode'',''classic'')';
 newv:='CASE WHEN public.igr_v805_team4_allowed(r.scenario_id) AND c=4 THEN coalesce(r.state->>''four_player_mode'',''classic'')';
 IF position(oldv in def)=0 THEN RAISE EXCEPTION 'start composition anchor changed'; END IF;
 EXECUTE replace(def,oldv,newv);
END $early_analyst$;
