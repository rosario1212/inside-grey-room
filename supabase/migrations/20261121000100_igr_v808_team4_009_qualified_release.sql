-- v806: certify the 009 investigative roster at four players.
-- Subject 17 remains the focus of consent analysis; doctor and director are
-- the two playable suspects in team mode. The third team member remains a
-- documented nonplaying person, not a silent/empty suspect seat.
-- This is the first previously five-player classical dossier adapted to four.

CREATE OR REPLACE FUNCTION public.igr_v805_team4_allowed(p_scenario text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $fn$ SELECT p_scenario IN ('001','004','009') $fn$;
REVOKE ALL ON FUNCTION public.igr_v805_team4_allowed(text) FROM PUBLIC,anon,authenticated;

DO $patch$
DECLARE def text; oldv text; newv text;
BEGIN
 -- Four players are now allowed at the authoritative capacity layer.
 SELECT pg_get_functiondef('public.igr_v4_min_players(text)'::regprocedure) INTO def;
 oldv:=$old$ when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5$old$;
 newv:=$new$ when p_scenario='009' then 4
 when p_scenario in ('007','008','010','011','012','013','014','015','016') then 5$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 min_player rule moved';END IF;
   EXECUTE replace(def,oldv,newv);
 END IF;

 -- Team-4 is already handled by the certified helper. For classic-4,
 -- original 009's five-person allocator must not leave an Analyst ghost.
 SELECT pg_get_functiondef('public.igr_v800_role_for_seat(text,integer,integer)'::regprocedure) INTO def;
 oldv:='  RETURN public.igr_v4_role_for_seat(r.scenario_id,p_seat,p_count);';
 newv:=$new$  IF r.scenario_id='009' AND p_count=4 THEN
    IF p_seat NOT BETWEEN 0 AND 3 THEN RAISE EXCEPTION 'invalid classic-4 seat';END IF;
    RETURN (ARRAY['enqueteur','suspect','suspect','suspect']::text[])[p_seat+1];
  END IF;
  RETURN public.igr_v4_role_for_seat(r.scenario_id,p_seat,p_count);$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 role_for_seat changed';END IF;
   EXECUTE replace(def,oldv,newv);
 END IF;

 SELECT pg_get_functiondef('public.igr_v800_role_capacity(text,text)'::regprocedure) INTO def;
 oldv:='  RETURN public.igr_v4_role_capacity(r.scenario_id,n,role_name);';
 newv:=$new$  IF r.scenario_id='009' AND n=4 THEN
    CASE role_name
      WHEN 'enqueteur' THEN RETURN 1;
      WHEN 'analyste' THEN RETURN 0;
      WHEN 'suspect' THEN RETURN 3;
      ELSE RETURN 0;
    END CASE;
  END IF;
  RETURN public.igr_v4_role_capacity(r.scenario_id,n,role_name);$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 role_capacity changed';END IF;
   EXECUTE replace(def,oldv,newv);
 END IF;

 SELECT pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure) INTO def;
 oldv:=$old$'title',CASE WHEN r.scenario_id='001' THEN 'DÉCLARATION CONSIGNÉE · CHAMBRE 222' ELSE 'DÉCLARATION CONSIGNÉE · SOFIA' END$old$;
 newv:=$new$'title',CASE WHEN r.scenario_id='001' THEN 'DÉCLARATION CONSIGNÉE · CHAMBRE 222'
         WHEN r.scenario_id='004' THEN 'DÉCLARATION CONSIGNÉE · SOFIA'
         ELSE 'DÉCLARATION CONSIGNÉE · ORPHÉE' END$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 narrative title changed';END IF;
   def:=replace(def,oldv,newv);
 END IF;
 oldv:=$old$       ELSE
         'Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés dans les pièces : ce récit ne disculpe ni n’accuse personne.'
       END$old$;
 newv:=$new$       WHEN r.scenario_id='004' THEN
         'Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés dans les pièces : ce récit ne disculpe ni n’accuse personne.'
       ELSE
         'Un membre de l’équipe ORPHÉE a remis une première déclaration et ne participe pas aux interrogatoires de la Grey Room. « Je travaillais au protocole. Ce que chacun savait au sujet du retrait du consentement et de l’ordre de poursuite doit être vérifié dans les dossiers. » Ce récit reste contestable et ne prouve ni décision autorisée ni innocence.'
       END$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 narrative testimony changed';END IF;
   def:=replace(def,oldv,newv);
 END IF;
 EXECUTE def;

 SELECT pg_get_functiondef('public.igr_v4_build_private_card(text,uuid)'::regprocedure) INTO def;
 oldv:=$old$'pseudo',CASE WHEN r.scenario_id='001' THEN 'Le client de l’hôtel (non joueur)' ELSE 'Le proche de Sofia (non joueur)' END$old$;
 newv:=$new$'pseudo',CASE WHEN r.scenario_id='001' THEN 'Le client de l’hôtel (non joueur)'
     WHEN r.scenario_id='004' THEN 'Le proche de Sofia (non joueur)'
     ELSE 'Le membre de l’équipe ORPHÉE (non joueur)' END$new$;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION 'v806 NPC relation changed';END IF;
   EXECUTE replace(def,oldv,newv);
 END IF;
END $patch$;

-- Dossier 009 owner release guard previously assumed exactly five minimum
-- players; retain every signature, approval, pack, secrecy and max-player check.
-- Only the minimum-size clause is now conditional on the separately certified
-- 4-player roster. Never drop or bypass the 009 trigger.
DO $eligibility$
DECLARE def text;
 oldv text:='public.igr_v4_min_players(''009'')=5 and public.igr_v4_max_players(''009'')=6';
 newv text:='(public.igr_v4_min_players(''009'')=5 or (public.igr_v805_team4_allowed(''009'') and public.igr_v4_min_players(''009'')=4)) and public.igr_v4_max_players(''009'')=6';
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v331_009_release_status()'::regprocedure) INTO def;
 IF position(newv IN def)=0 THEN
   IF position(oldv IN def)=0 THEN RAISE EXCEPTION '009 release gate changed; review manually';END IF;
   EXECUTE replace(def,oldv,newv);
 END IF;
 IF coalesce((igr_private.igr_v331_009_release_status()->>'eligible')::boolean,false) IS NOT TRUE
 THEN RAISE EXCEPTION '009 canonical release approvals failed, four-player mode must not publish';END IF;
END $eligibility$;

DO $assert$
BEGIN
 IF public.igr_v4_min_players('009')<>4
   OR public.igr_v4_min_players('008')<>5
   OR NOT public.igr_v805_team4_allowed('009')
   OR public.igr_v805_team4_allowed('008')
 THEN RAISE EXCEPTION 'v806 certification boundary failed';END IF;
END $assert$;
