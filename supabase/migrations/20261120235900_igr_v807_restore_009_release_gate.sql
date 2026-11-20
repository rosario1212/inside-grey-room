-- v807: rollback an experimental 009 roster relaxation.
-- The canonical 009 release status has eligible=false because the human
-- playtest gate is pending. Never make unpublished rooms appear 4-player ready.
-- This migration is intentionally idempotent on clean installations where
-- the v806 experiment was never installed.
DO $rollback$
DECLARE def text; oldv text; newv text;
BEGIN
  -- Restore certified room-mode whitelist (001 and 004 only).
  CREATE OR REPLACE FUNCTION public.igr_v805_team4_allowed(p_scenario text)
  RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
  AS $fn$ SELECT p_scenario IN ('001','004') $fn$;
  REVOKE ALL ON FUNCTION public.igr_v805_team4_allowed(text)
    FROM PUBLIC,anon,authenticated;

  SELECT pg_get_functiondef('public.igr_v4_min_players(text)'::regprocedure) INTO def;
  oldv:=$old$ when p_scenario='009' then 4
 when p_scenario in ('007','008','010','011','012','013','014','015','016') then 5$old$;
  newv:=$new$ when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5$new$;
  IF position(oldv IN def)>0 THEN EXECUTE replace(def,oldv,newv);
  ELSIF position(newv IN def)=0 THEN RAISE EXCEPTION 'unexpected 009 minimum; manual review required';END IF;

  SELECT pg_get_functiondef('public.igr_v800_role_for_seat(text,integer,integer)'::regprocedure) INTO def;
  oldv:=$old$  IF r.scenario_id='009' AND p_count=4 THEN
    IF p_seat NOT BETWEEN 0 AND 3 THEN RAISE EXCEPTION 'invalid classic-4 seat';END IF;
    RETURN (ARRAY['enqueteur','suspect','suspect','suspect']::text[])[p_seat+1];
  END IF;
$old$;
  IF position(oldv IN def)>0 THEN EXECUTE replace(def,oldv,'');END IF;

  SELECT pg_get_functiondef('public.igr_v800_role_capacity(text,text)'::regprocedure) INTO def;
  oldv:=$old$  IF r.scenario_id='009' AND n=4 THEN
    CASE role_name
      WHEN 'enqueteur' THEN RETURN 1;
      WHEN 'analyste' THEN RETURN 0;
      WHEN 'suspect' THEN RETURN 3;
      ELSE RETURN 0;
    END CASE;
  END IF;
$old$;
  IF position(oldv IN def)>0 THEN EXECUTE replace(def,oldv,'');END IF;

  SELECT pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure) INTO def;
  oldv:=$old$'title',CASE WHEN r.scenario_id='001' THEN 'DÉCLARATION CONSIGNÉE · CHAMBRE 222'
         WHEN r.scenario_id='004' THEN 'DÉCLARATION CONSIGNÉE · SOFIA'
         ELSE 'DÉCLARATION CONSIGNÉE · ORPHÉE' END$old$;
  newv:=$new$'title',CASE WHEN r.scenario_id='001' THEN 'DÉCLARATION CONSIGNÉE · CHAMBRE 222' ELSE 'DÉCLARATION CONSIGNÉE · SOFIA' END$new$;
  IF position(oldv IN def)>0 THEN def:=replace(def,oldv,newv);END IF;
  oldv:=$old$       WHEN r.scenario_id='004' THEN
         'Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés dans les pièces : ce récit ne disculpe ni n’accuse personne.'
       ELSE
         'Un membre de l’équipe ORPHÉE a remis une première déclaration et ne participe pas aux interrogatoires de la Grey Room. « Je travaillais au protocole. Ce que chacun savait au sujet du retrait du consentement et de l’ordre de poursuite doit être vérifié dans les dossiers. » Ce récit reste contestable et ne prouve ni décision autorisée ni innocence.'
       END$old$;
  newv:=$new$       ELSE
         'Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés dans les pièces : ce récit ne disculpe ni n’accuse personne.'
       END$new$;
  IF position(oldv IN def)>0 THEN def:=replace(def,oldv,newv);END IF;
  EXECUTE def;

  SELECT pg_get_functiondef('public.igr_v4_build_private_card(text,uuid)'::regprocedure) INTO def;
  oldv:=$old$'pseudo',CASE WHEN r.scenario_id='001' THEN 'Le client de l’hôtel (non joueur)'
     WHEN r.scenario_id='004' THEN 'Le proche de Sofia (non joueur)'
     ELSE 'Le membre de l’équipe ORPHÉE (non joueur)' END$old$;
  newv:=$new$'pseudo',CASE WHEN r.scenario_id='001' THEN 'Le client de l’hôtel (non joueur)' ELSE 'Le proche de Sofia (non joueur)' END$new$;
  IF position(oldv IN def)>0 THEN EXECUTE replace(def,oldv,newv);END IF;

  IF public.igr_v4_min_players('009')<>5
    OR public.igr_v805_team4_allowed('009')
    OR NOT public.igr_v805_team4_allowed('004')
  THEN RAISE EXCEPTION '009 release restoration failed';END IF;
END $rollback$;