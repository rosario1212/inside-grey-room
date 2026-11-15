-- v699 rollback-only multi-role smoke test. Run after DDL migration COMMITTED.
BEGIN;
INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,phase_ends_at,state)
VALUES('V699QA1','006','playing',1,'interrogation_select',clock_timestamp(),
 clock_timestamp()+interval '10 minutes','{}'::jsonb);
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
VALUES('V699QA1','Analyst QA',0,'analyste','analyste'),
 ('V699QA1','Investigator QA',1,'enqueteur','enqueteur'),
 ('V699QA1','Witness QA',2,'temoin','temoin'),
 ('V699QA1','Suspect one',3,'suspect','suspect'),
 ('V699QA1','Suspect two',4,'suspect','suspect'),
 ('V699QA1','Suspect three',5,'suspect','suspect');
DO $qa$
DECLARE analyst_token uuid; investigator_token uuid; witness_token uuid;
 levels_ jsonb; bad_levels jsonb; v jsonb; failed boolean;
BEGIN
 SELECT player_token INTO analyst_token FROM public.igr_v4_players
 WHERE room_code='V699QA1' AND public_role='analyste';
 SELECT player_token INTO investigator_token FROM public.igr_v4_players
 WHERE room_code='V699QA1' AND public_role='enqueteur';
 SELECT player_token INTO witness_token FROM public.igr_v4_players
 WHERE room_code='V699QA1' AND public_role='temoin';
 SELECT jsonb_object_agg(id::text,case when seat_index=4 then 2 else 1 end)
 INTO levels_ FROM public.igr_v4_players
 WHERE room_code='V699QA1' AND public_role='suspect';
 SELECT jsonb_object_agg(id::text,0) INTO bad_levels
 FROM public.igr_v4_players WHERE room_code='V699QA1' AND seat_index=3;
 v:=public.igr_v699_analyst_profile_state('V699QA1',analyst_token);
 IF (v->>'can_submit')::boolean IS DISTINCT FROM true
 OR jsonb_array_length(v->'suspects')<>3
 THEN RAISE EXCEPTION 'Analyst cannot assess full suspect roster';END IF;

 failed:=false;
 BEGIN PERFORM public.igr_v699_analyst_profile_state('V699QA1',witness_token);
 EXCEPTION WHEN OTHERS THEN failed:=true; END;
 IF NOT failed THEN RAISE EXCEPTION 'Witness could read private analytical profiles';END IF;

 failed:=false;
 BEGIN PERFORM public.igr_v699_analyst_profile_submit(
  'V699QA1',investigator_token,levels_,'recit',
  'Les contradictions entre les témoignages doivent être recoupées avant de conclure.',2);
 EXCEPTION WHEN OTHERS THEN failed:=true; END;
 IF NOT failed THEN RAISE EXCEPTION 'Investigator forged analyst assessment';END IF;

 failed:=false;
 BEGIN PERFORM public.igr_v699_analyst_profile_submit(
  'V699QA1',analyst_token,bad_levels,'recit',
  'Les contradictions entre les témoignages doivent être recoupées avant de conclure.',2);
 EXCEPTION WHEN OTHERS THEN failed:=true; END;
 IF NOT failed THEN RAISE EXCEPTION 'Incomplete list of suspect levels accepted';END IF;

 PERFORM public.igr_v699_analyst_profile_submit('V699QA1',analyst_token,
 levels_,'contrainte',
 'Je distingue la contrainte rapportée par les suspects de leurs actes et choix réellement documentés.',2);
 v:=public.igr_v699_analyst_profile_state('V699QA1',investigator_token);
 IF jsonb_array_length(v->'history')<>1 OR
  (v#>>'{history,0,focus}')<>'contrainte'
 THEN RAISE EXCEPTION 'Investigator did not receive first cycle hypothesis';END IF;
 IF coalesce((v#>>'{history,0,levels}')::jsonb,'{}'::jsonb)<>levels_
 THEN RAISE EXCEPTION 'The full responsibility profile was altered';END IF;

 failed:=false;
 BEGIN PERFORM public.igr_v699_analyst_profile_submit('V699QA1',
 analyst_token,levels_,'recit','La chronologie reste incompatible avec les éléments déjà publiés par le camp Enquête.',3);
 EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'Analyst submitted twice in one cycle';END IF;
 UPDATE public.igr_v4_rooms SET cycle=2,phase='interrogation_select'
 WHERE code='V699QA1';
 PERFORM public.igr_v699_analyst_profile_submit('V699QA1',analyst_token,
 levels_,'recit','De nouvelles données obligent à réévaluer les incohérences du récit sans poser de diagnostic.',1);
 v:=public.igr_v699_analyst_profile_state('V699QA1',analyst_token);
 IF jsonb_array_length(v->'history')<>2 OR
  (v#>>'{history,1,confidence}')::integer<>1
 THEN RAISE EXCEPTION 'Prior assessment history lost between cycles';END IF;

 UPDATE public.igr_v4_rooms SET cycle=3,phase='final_audience'
 WHERE code='V699QA1';
 failed:=false;
 BEGIN PERFORM public.igr_v699_analyst_profile_submit('V699QA1',analyst_token,
 levels_,'recit','Une audience finale ne doit pas autoriser une nouvelle évaluation pendant le verdict.',3);
 EXCEPTION WHEN OTHERS THEN failed:=true; END;
 IF NOT failed THEN RAISE EXCEPTION 'Post-final assessment accepted';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_events
 WHERE room_code='V699QA1' AND event_type='igr_v699_analyst_profile')
 THEN RAISE EXCEPTION 'Private assessment leaked to public event stream';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions WHERE room_code='V699QA1'
  AND action_type='igr_v699_analyst_profile'
  AND payload->>'canonical_evidence'<>'false')
 THEN RAISE EXCEPTION 'Assessment marked canonical'; END IF;
END $qa$;
SELECT 'PASS v699: private role guard, complete 0/1/2 profiles, one per cycle, chronological record, no public disclosure, post-final lock' AS result;
ROLLBACK;