-- IGR v800 — certified experimental four-player composition for case 001 only.
-- No other scenario is made eligible. Preserve sealed variants and existing 4/5 rosters.
-- Team mode: 1 Investigator, 1 Analyst, 2 playable suspects; slot 3 stays a
-- nonplaying person in the story and remains part of the canonical reconstruction.

CREATE OR REPLACE FUNCTION public.igr_v800_team4_enabled(p_room text)
RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $fn$
  SELECT coalesce((
    SELECT r.scenario_id='001'
      AND r.state->>'four_player_mode'='team'
      AND (SELECT count(*) FROM public.igr_v4_players p WHERE p.room_code=r.code)=4
    FROM public.igr_v4_rooms r WHERE r.code=upper(trim(p_room))
  ),false)
$fn$;
REVOKE ALL ON FUNCTION public.igr_v800_team4_enabled(text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v800_role_capacity(p_room text,p_role text)
RETURNS integer LANGUAGE plpgsql STABLE SET search_path TO ''
AS $fn$
DECLARE r public.igr_v4_rooms%rowtype;
        n integer; role_name text:=lower(trim(coalesce(p_role,'')));
BEGIN
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room));
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT count(*) INTO n FROM public.igr_v4_players WHERE room_code=r.code;
  IF r.scenario_id='001' AND n=4 AND r.state->>'four_player_mode'='team' THEN
    CASE role_name
      WHEN 'enqueteur','analyste' THEN RETURN 1;
      WHEN 'suspect' THEN RETURN 2;
      ELSE RETURN 0;
    END CASE;
  END IF;
  RETURN public.igr_v4_role_capacity(r.scenario_id,n,role_name);
END $fn$;
REVOKE ALL ON FUNCTION public.igr_v800_role_capacity(text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v800_role_for_seat(p_room text,p_seat integer,p_count integer)
RETURNS text LANGUAGE plpgsql STABLE SET search_path TO ''
AS $fn$
DECLARE r public.igr_v4_rooms%rowtype;
BEGIN
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room));
  IF NOT FOUND THEN RAISE EXCEPTION 'room not found'; END IF;
  IF r.scenario_id='001' AND p_count=4
      AND r.state->>'four_player_mode'='team' THEN
    IF p_seat NOT BETWEEN 0 AND 3 THEN RAISE EXCEPTION 'invalid Team-4 seat'; END IF;
    RETURN (ARRAY['enqueteur','analyste','suspect','suspect']::text[])[p_seat+1];
  END IF;
  RETURN public.igr_v4_role_for_seat(r.scenario_id,p_seat,p_count);
END $fn$;
REVOKE ALL ON FUNCTION public.igr_v800_role_for_seat(text,integer,integer) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v800_set_four_player_mode(
  p_code text, p_host_token uuid, p_mode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE r public.igr_v4_rooms%rowtype;
        n integer; requested text:=lower(trim(coalesce(p_mode,'')));
        current_mode text;
BEGIN
  PERFORM igr_private.rate_limit('team4_mode',coalesce(p_host_token::text,'empty'),12,60);
  SELECT * INTO r FROM public.igr_v4_rooms
    WHERE code=upper(trim(p_code)) AND host_token=p_host_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF r.status<>'lobby' THEN RAISE EXCEPTION 'game already started'; END IF;
  SELECT count(*) INTO n FROM public.igr_v4_players WHERE room_code=r.code;
  IF r.scenario_id<>'001' OR n<>4 THEN
    RAISE EXCEPTION 'mode unavailable: this case and headcount are not certified';
  END IF;
  IF requested NOT IN ('classic','team') THEN RAISE EXCEPTION 'invalid mode'; END IF;
  current_mode:=coalesce(r.state->>'four_player_mode','classic');
  IF current_mode=requested THEN RETURN jsonb_build_object('ok',true,'mode',requested,'changed',false); END IF;
  UPDATE public.igr_v4_rooms SET
     state=jsonb_set(coalesce(state,'{}'::jsonb),'{four_player_mode}',to_jsonb(requested),true),
     updated_at=now()
  WHERE code=r.code;
  -- Reservations no longer match a different composition. No role is stolen.
  UPDATE public.igr_v4_players SET preferred_role=NULL WHERE room_code=r.code;
  INSERT INTO public.igr_v4_events(room_code,event_type,payload)
  VALUES(r.code,'mode',jsonb_build_object('title','COMPOSITION',
    'text',CASE WHEN requested='team' THEN
       'Quatre joueurs : Enquêteur, Analyste et deux Suspects.'
       ELSE 'Quatre joueurs : Enquêteur et trois Suspects.' END));
  RETURN jsonb_build_object('ok',true,'mode',requested,'changed',true,
    'reservations_reset',true);
END $fn$;
REVOKE ALL ON FUNCTION public.igr_v800_set_four_player_mode(text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.igr_v800_set_four_player_mode(text,uuid,text) TO anon,authenticated;

-- Minimal guarded rewiring of existing source: no changes to other scenarios.
DO $patch$
DECLARE definition text; old_anchor text; new_anchor text;
BEGIN
  SELECT pg_get_functiondef('public.igr_v4_choose_role(text,uuid,text)'::regprocedure) INTO definition;
  old_anchor:='cap:=public.igr_v4_role_capacity(r.scenario_id,c,p_role);';
  new_anchor:='cap:=public.igr_v800_role_capacity(r.code,p_role);';
  IF position(new_anchor IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'choose_role contract changed'; END IF;
    EXECUTE replace(definition,old_anchor,new_anchor);
  END IF;

  SELECT pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure) INTO definition;
  old_anchor:='public.igr_v4_role_for_seat(r.scenario_id, idx, c)';
  new_anchor:='public.igr_v800_role_for_seat(r.code, idx, c)';
  IF position(new_anchor IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'start_game role allocator contract changed'; END IF;
    definition:=replace(definition,old_anchor,new_anchor);
  END IF;

  old_anchor:='''match_no'', match_no,';
  new_anchor:='''four_player_mode'', CASE WHEN r.scenario_id=''001'' AND c=4 THEN coalesce(r.state->>''four_player_mode'',''classic'') ELSE ''classic'' END,'||chr(10)||'        ''match_no'', match_no,';
  IF position(new_anchor IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'start_game state anchor changed'; END IF;
    definition:=replace(definition,old_anchor,new_anchor);
  END IF;

  old_anchor:='perform igr_private.igr_v169_assign_cartel_lawyer(r.code);';
  new_anchor:=$new$
  -- v800: the third person is not a playable role, but does not disappear
  -- from the canonical events. The statement is deliberately unverified.
  IF r.scenario_id='001' AND c=4 AND r.state->>'four_player_mode'='team' THEN
    INSERT INTO public.igr_v4_events(room_code,event_type,payload)
    VALUES(r.code,'context',jsonb_build_object(
       'title','DÉCLARATION CONSIGNÉE · CHAMBRE 222',
       'text','Le client du même étage n’est pas présent dans la cellule. Sa première déclaration a été consignée : « J’étais à cet étage. J’ai entendu de l’agitation près de la chambre 222, mais je ne peux pas établir qui se trouvait dans la pièce ni l’origine de la blessure. » Ce récit n’est pas une preuve et peut être contesté.',
       'verified',false,'nonplayer',true));
  END IF;
  perform igr_private.igr_v169_assign_cartel_lawyer(r.code);$new$;
  IF position('v800: the third person' IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'start_game finale anchor changed'; END IF;
    definition:=replace(definition,old_anchor,new_anchor);
  END IF;
  EXECUTE definition;

  -- Preserve the relationship on a private card when its target is an offstage
  -- person, instead of silently dropping it and making a suspect's text opaque.
  SELECT pg_get_functiondef('public.igr_v4_build_private_card(text,uuid)'::regprocedure) INTO definition;
  old_anchor:=$old$if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if;$old$;
  new_anchor:=$new$if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text'));
     elsif r.scenario_id='001' and public.igr_v800_team4_enabled(r.code)
         and (rel->>'slot')::int=3
       then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo','Le client de l’hôtel (non joueur)','text',rel->>'text'));
     end if;$new$;
  IF position('Le client de l’hôtel (non joueur)' IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'private card relationship anchor changed'; END IF;
    EXECUTE replace(definition,old_anchor,new_anchor);
  END IF;

  -- Departure must remove surplus role reservations when five players
  -- shrink to Team-4; keep the existing v700 deterministic priority ordering.
  SELECT pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure) INTO definition;
  old_anchor:='public.igr_v4_role_capacity(r.scenario_id,v_count,v_role)';
  new_anchor:='public.igr_v800_role_capacity(r.code,v_role)';
  IF position(new_anchor IN definition)=0 THEN
    IF position(old_anchor IN definition)=0 THEN RAISE EXCEPTION 'leave_room role reconciliation changed'; END IF;
    EXECUTE replace(definition,old_anchor,new_anchor);
  END IF;
END $patch$;

-- Invariant: original rosters and four-player Team mode remain distinct.
DO $verify$
BEGIN
  IF public.igr_v4_role_for_seat('001',1,4)<>'suspect'
    OR public.igr_v4_role_capacity('001',4,'analyste')<>0
    OR public.igr_v4_min_players('007')<>5
  THEN RAISE EXCEPTION 'v800 altered canonical scenario default contracts'; END IF;
END $verify$;
