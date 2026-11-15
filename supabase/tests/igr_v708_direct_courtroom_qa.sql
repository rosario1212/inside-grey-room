-- v708 transactional QA: BEGIN; [v707, v708] [this file] ROLLBACK;
DO $qa$
DECLARE mode text; code_name text; rec public.igr_v4_rooms%rowtype; judge_token uuid;
 sus record; suspects uuid[]; found_error boolean; pg_count int;
BEGIN
 FOREACH mode IN ARRAY ARRAY['short','long'] LOOP
  code_name:=case when mode='short' then 'C708S' else 'C708L' end;
  IF EXISTS (SELECT 1 FROM public.igr_v4_rooms WHERE code=code_name) THEN RAISE EXCEPTION 'Room exists: %',code_name;END IF;
  INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(code_name,'014');
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
   VALUES(code_name,'Enqueteur',0,'enqueteur',null),(code_name,'Procureur',1,'procureur',null),
         (code_name,'Juge',2,'juge',null),(code_name,'Avocat',3,'maitre',null),
         (code_name,'A',4,'suspect',1),(code_name,'B',5,'suspect',2);
  UPDATE public.igr_v4_rooms SET status='playing',cycle=3,phase='closed',
   phase_ends_at=now()-interval '2 seconds',state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(mode),true)
   WHERE code=code_name;
  PERFORM public.igr_v4_tick(code_name);
  SELECT * INTO rec FROM public.igr_v4_rooms WHERE code=code_name;
  IF rec.phase<>'final_suspect_defenses' OR rec.state->>'v52_stage'<>'courtroom'
     OR rec.state->>'v708_court_step'<>'seating' OR rec.phase_ends_at IS NOT NULL
  THEN RAISE EXCEPTION 'No direct court %',mode;END IF;
  IF jsonb_array_length(rec.state->'v52_queue')<>0 THEN RAISE EXCEPTION 'Unexpected timed defendant queue';END IF;
  SELECT player_token INTO judge_token FROM public.igr_v4_players WHERE room_code=code_name AND public_role='juge';
  found_error:=false;
  BEGIN PERFORM public.igr_v708_court_action(code_name,judge_token,'close',null);
  EXCEPTION WHEN OTHERS THEN found_error:=true;
  END;
  IF NOT found_error THEN RAISE EXCEPTION 'Judge can close before hearing';END IF;
  PERFORM public.igr_v708_court_action(code_name,judge_token,'open',null);
  PERFORM public.igr_v708_court_action(code_name,judge_token,'toggle_point','charges');
  SELECT * INTO rec FROM public.igr_v4_rooms WHERE code=code_name;
  IF NOT (rec.state->'v708_checks' ? 'charges') THEN RAISE EXCEPTION 'Judge checklist not saved';END IF;
  PERFORM public.igr_v708_court_action(code_name,judge_token,'toggle_point','charges');
  PERFORM public.igr_v708_court_action(code_name,judge_token,'next',null);
  FOR sus IN SELECT id,player_token FROM public.igr_v4_players WHERE room_code=code_name AND public_role='suspect' LOOP
    PERFORM public.igr_v708_court_action(code_name,sus.player_token,'defense_done',null);
  END LOOP;
  PERFORM public.igr_v708_court_action(code_name,judge_token,'next',null);
  found_error:=false;
  BEGIN PERFORM public.igr_v708_court_action(code_name,judge_token,'close',null);
  EXCEPTION WHEN OTHERS THEN found_error:=true;
  END;
  IF NOT found_error THEN RAISE EXCEPTION 'Judge can close without last word';END IF;
  FOR sus IN SELECT id,player_token FROM public.igr_v4_players WHERE room_code=code_name AND public_role='suspect' LOOP
    PERFORM public.igr_v708_court_action(code_name,sus.player_token,'last_word_done',null);
  END LOOP;
  PERFORM public.igr_v708_court_action(code_name,judge_token,'close',null);
  SELECT * INTO rec FROM public.igr_v4_rooms WHERE code=code_name;
  IF rec.phase<>'locking' OR rec.phase_ends_at IS NOT NULL THEN RAISE EXCEPTION 'Court did not lead to secret vote';END IF;
 END LOOP;
 -- Host can declare a genuinely absent defendant without forging their speech or vote.
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES('C708A','014');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
  VALUES('C708A','Enqueteur',0,'enqueteur',null),('C708A','Juge',1,'juge',null),
         ('C708A','Suspect actif',2,'suspect',1),('C708A','Suspect absent',3,'suspect',2);
 UPDATE public.igr_v4_rooms SET status='playing',cycle=3 WHERE code='C708A';
 PERFORM public.igr_v52_begin_stage('C708A','courtroom');
 UPDATE public.igr_v4_rooms SET phase_started_at=now()-interval '90 seconds' WHERE code='C708A';
 DECLARE
  hostkey uuid;
  missing_id uuid;
  active_token uuid;
 BEGIN
  SELECT host_token INTO hostkey FROM public.igr_v4_rooms WHERE code='C708A';
  SELECT id INTO missing_id FROM public.igr_v4_players WHERE room_code='C708A' AND pseudo='Suspect absent';
  SELECT player_token INTO active_token FROM public.igr_v4_players WHERE room_code='C708A' AND pseudo='Suspect actif';
  SELECT player_token INTO judge_token FROM public.igr_v4_players WHERE room_code='C708A' AND public_role='juge';
  PERFORM public.igr_v59_host_recover('C708A',hostkey,missing_id,'Déconnexion confirmée du joueur');
  SELECT * INTO rec FROM public.igr_v4_rooms WHERE code='C708A';
  IF NOT (rec.state->'v59_absent' ? missing_id::text) OR rec.phase<>'final_suspect_defenses'
     THEN RAISE EXCEPTION 'Host recovery failed';END IF;
  IF rec.state->'v708_heard' ? missing_id::text OR rec.state->'v708_last_word' ? missing_id::text
     THEN RAISE EXCEPTION 'Host recovery forged a statement';END IF;
  PERFORM public.igr_v708_court_action('C708A',judge_token,'open',null);
  PERFORM public.igr_v708_court_action('C708A',judge_token,'next',null);
  PERFORM public.igr_v708_court_action('C708A',active_token,'defense_done',null);
  PERFORM public.igr_v708_court_action('C708A',judge_token,'next',null);
  PERFORM public.igr_v708_court_action('C708A',active_token,'last_word_done',null);
  PERFORM public.igr_v708_court_action('C708A',judge_token,'close',null);
  SELECT * INTO rec FROM public.igr_v4_rooms WHERE code='C708A';
  IF rec.phase<>'locking' THEN RAISE EXCEPTION 'Absent defendant blocks courtroom closure';END IF;
 END;
 -- No-Judge cases must still enter timed audience after cycle 3.
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES('C708N','014');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
  VALUES('C708N','Enqueteur',0,'enqueteur',null),('C708N','Analyste',1,'analyste',null),('C708N','Suspect',2,'suspect',1);
 UPDATE public.igr_v4_rooms SET status='playing',cycle=3,phase='closed',
   phase_ends_at=now()-interval '2 seconds',state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}','"short"'::jsonb,true)
   WHERE code='C708N';
 PERFORM public.igr_v4_tick('C708N');
 SELECT * INTO rec FROM public.igr_v4_rooms WHERE code='C708N';
 IF rec.phase<>'final_audience' OR rec.state->>'v52_stage'<>'audience'
    THEN RAISE EXCEPTION 'No-Judge timed hearing regressed';END IF;
 PERFORM public.igr_v52_begin_stage('C708N','defenses');
 SELECT * INTO rec FROM public.igr_v4_rooms WHERE code='C708N';
 IF (rec.state->'v52_queue'->0->>'seconds')::int<>120 THEN RAISE EXCEPTION 'No-Judge timed defence regressed';END IF;
 RAISE NOTICE 'v708 pass: COURT/LONG direct unclocked court, agenda, protected closure, no-Judge finale';
END $qa$;
