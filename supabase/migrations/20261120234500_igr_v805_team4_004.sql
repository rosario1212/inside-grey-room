-- v805: enable the second four-player composition for scenario 004 after
-- a narrative review of the three variant timelines and the third character.
-- Preserve variant truths. Make all existing 001 paths and five-player paths unchanged.

CREATE OR REPLACE FUNCTION public.igr_v805_team4_allowed(p_scenario text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $fn$ SELECT p_scenario IN ('001','004') $fn$;
REVOKE ALL ON FUNCTION public.igr_v805_team4_allowed(text) FROM PUBLIC,anon,authenticated;

DO $patch$
DECLARE def text; oldv text; newv text;
BEGIN
  SELECT pg_get_functiondef('public.igr_v800_team4_enabled(text)'::regprocedure) INTO def;
  oldv:='r.scenario_id=''001''';
  newv:='public.igr_v805_team4_allowed(r.scenario_id)';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 team4 guard changed'; END IF;
    EXECUTE replace(def,oldv,newv);
  END IF;

  SELECT pg_get_functiondef('public.igr_v800_role_capacity(text,text)'::regprocedure) INTO def;
  oldv:='r.scenario_id=''001'' AND n=4';
  newv:='public.igr_v805_team4_allowed(r.scenario_id) AND n=4';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 role capacity changed'; END IF;
    EXECUTE replace(def,oldv,newv);
  END IF;

  SELECT pg_get_functiondef('public.igr_v800_role_for_seat(text,integer,integer)'::regprocedure) INTO def;
  oldv:='r.scenario_id=''001'' AND p_count=4';
  newv:='public.igr_v805_team4_allowed(r.scenario_id) AND p_count=4';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 roster allocator changed'; END IF;
    EXECUTE replace(def,oldv,newv);
  END IF;

  SELECT pg_get_functiondef('public.igr_v800_set_four_player_mode(text,uuid,text)'::regprocedure) INTO def;
  oldv:='r.scenario_id<>''001'' OR n<>4';
  newv:='NOT public.igr_v805_team4_allowed(r.scenario_id) OR n<>4';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 host setter changed'; END IF;
    EXECUTE replace(def,oldv,newv);
  END IF;

  SELECT pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure) INTO def;
  oldv:='IF r.scenario_id=''001'' AND c=4 AND r.state->>''four_player_mode''=''team'' THEN';
  newv:='IF public.igr_v805_team4_allowed(r.scenario_id) AND c=4 AND r.state->>''four_player_mode''=''team'' THEN';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 start_game NPC gate changed'; END IF;
    def:=replace(def,oldv,newv);
  END IF;

  oldv:=$old$'title','DÉCLARATION CONSIGNÉE · CHAMBRE 222'$old$;
  newv:=$new$'title',CASE WHEN r.scenario_id='001' THEN 'DÉCLARATION CONSIGNÉE · CHAMBRE 222' ELSE 'DÉCLARATION CONSIGNÉE · SOFIA' END$new$;
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 NPC title changed'; END IF;
    def:=replace(def,oldv,newv);
  END IF;

  oldv:=$old$'text','Le client du même étage n’est pas présent dans la cellule. Sa première déclaration a été consignée : « J’étais à cet étage. J’ai entendu de l’agitation près de la chambre 222, mais je ne peux pas établir qui se trouvait dans la pièce ni l’origine de la blessure. » Ce récit n’est pas une preuve et peut être contesté.'$old$;
  newv:=$new$'text',CASE WHEN r.scenario_id='001' THEN
         'Le client du même étage n’est pas présent dans la cellule. Sa première déclaration a été consignée : « J’étais à cet étage. J’ai entendu de l’agitation près de la chambre 222, mais je ne peux pas établir qui se trouvait dans la pièce ni l’origine de la blessure. » Ce récit n’est pas une preuve et peut être contesté.'
       ELSE
         'Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés dans les pièces : ce récit ne disculpe ni n’accuse personne.'
       END$new$;
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 NPC statement changed'; END IF;
    def:=replace(def,oldv,newv);
  END IF;
  EXECUTE def;

  SELECT pg_get_functiondef('public.igr_v4_build_private_card(text,uuid)'::regprocedure) INTO def;
  oldv:='elsif r.scenario_id=''001'' and public.igr_v800_team4_enabled(r.code)';
  newv:='elsif public.igr_v805_team4_allowed(r.scenario_id) and public.igr_v800_team4_enabled(r.code)';
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 private relationship gate changed'; END IF;
    def:=replace(def,oldv,newv);
  END IF;
  oldv:=$old$'pseudo','Le client de l’hôtel (non joueur)'$old$;
  newv:=$new$'pseudo',CASE WHEN r.scenario_id='001' THEN 'Le client de l’hôtel (non joueur)' ELSE 'Le proche de Sofia (non joueur)' END$new$;
  IF position(newv IN def)=0 THEN
    IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v805 private relationship NPC label changed'; END IF;
    def:=replace(def,oldv,newv);
  END IF;
  EXECUTE def;
END $patch$;

-- Fail-closed guards: other dossiers cannot change modes by merely reaching
-- four players, and dossier 004's original minimum remains four.
DO $verify$
BEGIN
 IF NOT public.igr_v805_team4_allowed('001')
    OR NOT public.igr_v805_team4_allowed('004')
    OR public.igr_v805_team4_allowed('005')
    OR public.igr_v805_team4_allowed('008')
    OR public.igr_v4_min_players('004')<>4
 THEN RAISE EXCEPTION 'v805 certification boundaries changed'; END IF;
END $verify$;
