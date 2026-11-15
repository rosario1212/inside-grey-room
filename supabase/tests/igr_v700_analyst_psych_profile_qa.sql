-- Run in a NEW transaction after v700 migration commits. ROLLBACK leaves no rooms.
BEGIN;
INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,phase_ends_at,state)
VALUES('V700QA1','006','playing',1,'interrogation_select',clock_timestamp(),
 clock_timestamp()+interval '10 minutes',jsonb_build_object('match_no',1));
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
VALUES('V700QA1','Analyst tester',0,'analyste','analyste'),
 ('V700QA1','Investigator tester',1,'enqueteur','enqueteur'),
 ('V700QA1','Witness tester',2,'temoin','temoin'),
 ('V700QA1','Suspect A',3,'suspect','suspect'),
 ('V700QA1','Suspect B',4,'suspect','suspect'),
 ('V700QA1','Suspect C',5,'suspect','suspect');
DO $qa$
DECLARE analyst_ uuid;investigator_ uuid;witness_ uuid;
 suspect_a uuid;suspect_b uuid;v jsonb;refused boolean;
BEGIN
 SELECT player_token INTO analyst_ FROM public.igr_v4_players WHERE room_code='V700QA1' AND public_role='analyste';
 SELECT player_token INTO investigator_ FROM public.igr_v4_players WHERE room_code='V700QA1' AND public_role='enqueteur';
 SELECT player_token INTO witness_ FROM public.igr_v4_players WHERE room_code='V700QA1' AND public_role='temoin';
 SELECT id INTO suspect_a FROM public.igr_v4_players WHERE room_code='V700QA1' AND pseudo='Suspect A';
 SELECT id INTO suspect_b FROM public.igr_v4_players WHERE room_code='V700QA1' AND pseudo='Suspect B';
 v:=public.igr_v700_psych_profiles('V700QA1',witness_);
 IF (v->>'enabled')::boolean OR jsonb_array_length(v->'profiles')<>0 THEN
  RAISE EXCEPTION 'Profile leaked to witness before finish';END IF;
 v:=public.igr_v700_psych_profiles('V700QA1',investigator_);
 IF (v->>'enabled')::boolean OR jsonb_array_length(v->'profiles')<>0 THEN
  RAISE EXCEPTION 'Profile leaked to investigator before finish';END IF;
 v:=public.igr_v700_psych_profiles('V700QA1',analyst_);
 IF NOT (v->>'can_write')::boolean OR jsonb_array_length(v->'suspects')<>3 THEN
  RAISE EXCEPTION 'Analyst could not view complete suspect roster';END IF;
 refused:=false;
 BEGIN
  PERFORM public.igr_v700_submit_psych_profile('V700QA1',investigator_,suspect_a,
   'Il semble rechercher le soutien de ses proches dans le groupe.','Ce constat reste à vérifier avec les témoignages disponibles et contradictoires.');
 EXCEPTION WHEN OTHERS THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Investigator forged analyst profile';END IF;
 PERFORM public.igr_v700_submit_psych_profile('V700QA1',analyst_,suspect_a,
  'Il semble éviter les conflits et la confrontation avec les autres.','Ce point découle de sa déclaration initiale, pas d un diagnostic.');
 PERFORM public.igr_v700_submit_psych_profile('V700QA1',analyst_,suspect_b,
  'Il semble minimiser la gravité de ses décisions personnelles et collectives.','Les récits publiés divergent sur l heure exacte du départ.');
 refused:=false;
 BEGIN
  PERFORM public.igr_v700_submit_psych_profile('V700QA1',analyst_,suspect_a,
   'Il cherche peut être à protéger un autre joueur.','Cette interprétation exige de nouvelles observations réellement objectives et corroborées.');
 EXCEPTION WHEN OTHERS THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Duplicate profile same cycle accepted';END IF;
 UPDATE public.igr_v4_rooms SET cycle=2 WHERE code='V700QA1';
 PERFORM public.igr_v700_submit_psych_profile('V700QA1',analyst_,suspect_a,
  'La nouvelle chronologie évoque une hésitation dans ses déclarations successives.','Des éléments tardifs contredisent désormais son premier récit sur les heures.');
 v:=public.igr_v700_psych_profiles('V700QA1',analyst_);
 IF jsonb_array_length(v->'profiles')<>3 THEN RAISE EXCEPTION 'Progressive timeline missing';END IF;
 IF (public.igr_v700_psych_profiles('V700QA1',witness_)->>'published')::boolean THEN
  RAISE EXCEPTION 'Witness has early profile access';END IF;
 UPDATE public.igr_v4_rooms SET status='finished',phase='reveal' WHERE code='V700QA1';
 v:=public.igr_v700_psych_profiles('V700QA1',witness_);
 IF NOT (v->>'published')::boolean OR jsonb_array_length(v->'profiles')<>3
 THEN RAISE EXCEPTION 'Postgame archive unavailable to all roles';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_events WHERE room_code='V700QA1'
  AND event_type='igr_v700_psych_profile')
 THEN RAISE EXCEPTION 'Profile prematurely broadcast in event log';END IF;
 UPDATE public.igr_v4_rooms SET status='playing',cycle=1,phase='interrogation_select',
 state=jsonb_build_object('match_no',2) WHERE code='V700QA1';
 v:=public.igr_v700_psych_profiles('V700QA1',analyst_);
 IF jsonb_array_length(v->'profiles')<>0
 THEN RAISE EXCEPTION 'Previous match profiles leaked';END IF;
 UPDATE public.igr_v4_rooms SET phase='final_audience' WHERE code='V700QA1';
 refused:=false;
 BEGIN PERFORM public.igr_v700_submit_psych_profile('V700QA1',analyst_,suspect_a,
  'Il semble chercher à obtenir une validation sociale au sein du groupe.','Le contexte de groupe motive cette interrogation prudente sur les motivations.');
 EXCEPTION WHEN OTHERS THEN refused:=true; END;
 IF NOT refused THEN RAISE EXCEPTION 'Final hearing allowed new profile';END IF;
END $qa$;
SELECT 'PASS v700: 2-question per-suspect storage, one/cycle, private until finish, all-role reveal, match isolation, final gate' AS result;
ROLLBACK;