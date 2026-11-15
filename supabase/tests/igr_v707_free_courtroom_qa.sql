-- v707 transactional QA, run after migration inside BEGIN ... ROLLBACK.
-- Exercises a real JWT-free game-room fixture through the existing authenticated player-token RPC.
DO $qa$
DECLARE m text; rc text; rr public.igr_v4_rooms%rowtype; jp uuid; sp uuid; q jsonb; failed boolean; i int;
BEGIN
 FOREACH m IN ARRAY ARRAY['short','long'] LOOP
  rc:='C707'||upper(left(m,1));
  IF EXISTS(SELECT 1 FROM public.igr_v4_rooms WHERE code=rc) THEN RAISE EXCEPTION 'QA code already exists';END IF;
  INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(rc,'014');
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
  VALUES (rc,'Enqueteur',0,'enqueteur',null),(rc,'Analyste',1,'analyste',null),
  (rc,'Juge',2,'juge',null),(rc,'Avocat',3,'maitre',null),
  (rc,'Suspect A',4,'suspect',1),(rc,'Suspect B',5,'suspect',2),(rc,'Suspect C',6,'suspect',3);
  UPDATE public.igr_v4_rooms SET status='playing',cycle=3,
    state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(m),true) WHERE code=rc;
  SELECT player_token INTO jp FROM public.igr_v4_players WHERE room_code=rc AND public_role='juge';
  PERFORM public.igr_v52_begin_stage(rc,'audience');
  SELECT * INTO rr FROM public.igr_v4_rooms WHERE code=rc;
  q:=rr.state->'v52_queue';
  IF rr.phase_ends_at IS NULL OR jsonb_array_length(q)<>3 THEN RAISE EXCEPTION 'Audience was modified unexpectedly %',m;END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(q) x WHERE x->>'role' NOT IN ('enqueteur','analyste','juge'))
  THEN RAISE EXCEPTION 'Non-investigator in audience %',m;END IF;
  PERFORM public.igr_v52_begin_stage(rc,'defenses');
  SELECT * INTO rr FROM public.igr_v4_rooms WHERE code=rc;
  q:=rr.state->'v52_queue';
  IF rr.phase_ends_at IS NOT NULL OR (q->0->>'seconds')::int<>0
  THEN RAISE EXCEPTION 'Court waiting is incorrectly timed in %',m;END IF;
  SELECT player_token INTO sp FROM public.igr_v4_players WHERE id=(q->0->>'player_id')::uuid;
  PERFORM public.igr_v52_stage_action(rc,jp,'start',null);
  SELECT * INTO rr FROM public.igr_v4_rooms WHERE code=rc;
  IF rr.phase_ends_at IS NOT NULL OR rr.state->>'v52_status'<>'active'
  THEN RAISE EXCEPTION 'Court started with a countdown in %',m;END IF;
  failed:=false;
  BEGIN PERFORM public.igr_v52_stage_action(rc,jp,'end',null);
   EXCEPTION WHEN OTHERS THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Judge bypassed suspect right to speak %',m;END IF;
  PERFORM public.igr_v52_stage_action(rc,sp,'defense_done',null);
  PERFORM public.igr_v52_stage_action(rc,jp,'end',null);
  SELECT * INTO rr FROM public.igr_v4_rooms WHERE code=rc;
  IF (rr.state->>'v52_index')::int<>1 OR rr.phase_ends_at IS NOT NULL
  THEN RAISE EXCEPTION 'Court failed to progress without a countdown %',m;END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.igr_v4_rooms WHERE code='C707N') THEN RAISE EXCEPTION 'No-Judge QA code already exists';END IF;
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES('C707N','014');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
 VALUES ('C707N','Enqueteur',0,'enqueteur',null),('C707N','Analyste',1,'analyste',null),
 ('C707N','Suspect A',2,'suspect',1);
 UPDATE public.igr_v4_rooms SET status='playing',cycle=3,
 state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}','"short"'::jsonb,true) WHERE code='C707N';
 PERFORM public.igr_v52_begin_stage('C707N','defenses');
 SELECT * INTO rr FROM public.igr_v4_rooms WHERE code='C707N';
 IF (rr.state->'v52_queue'->0->>'seconds')::int<>120 OR rr.phase_ends_at IS NOT NULL
 THEN RAISE EXCEPTION 'No-Judge waiting behaviour changed';END IF;
 SELECT player_token INTO sp FROM public.igr_v4_players WHERE room_code='C707N' AND public_role='suspect';
 PERFORM public.igr_v52_stage_action('C707N',sp,'start',null);
 SELECT * INTO rr FROM public.igr_v4_rooms WHERE code='C707N';
 IF rr.phase_ends_at IS NULL THEN RAISE EXCEPTION 'No-Judge defense lost its timer';END IF;
 RAISE NOTICE 'v707 passed: SHORT/LONG Judge courtroom no timer, protected defence, unchanged Judge-free stage';
END $qa$;
