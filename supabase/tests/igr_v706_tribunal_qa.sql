-- v706 transactional QA. Execute as BEGIN; <this file>; ROLLBACK; only after the migration.
-- No persistent rooms, players, actions, or verdicts remain after rollback.
DO $court_qa$
DECLARE
  mode_ text; room_ text; role_ text; rec record; q jsonb; r public.igr_v4_rooms%rowtype;
  expected_speech int; expected_defense int; current_player uuid; current_token uuid; judge_token uuid; suspect_token uuid; i int; received_error boolean;
BEGIN
  FOREACH mode_ IN ARRAY ARRAY['short','long'] LOOP
    room_:='T706'||upper(left(mode_,1));
    expected_speech:=CASE WHEN mode_='short' THEN 60 ELSE 90 END;
    expected_defense:=CASE WHEN mode_='short' THEN 180 ELSE 240 END;
    INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(room_,'014');
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
    VALUES
      (room_,'Enquêteur',0,'enqueteur',null),
      (room_,'Analyste',1,'analyste',null),
      (room_,'Avocat',2,'maitre',null),
      (room_,'Juge',3,'juge',null),
      (room_,'Suspect A',4,'suspect',1),
      (room_,'Suspect B',5,'suspect',2),
      (room_,'Suspect C',6,'suspect',3);
    UPDATE public.igr_v4_rooms
      SET status='playing',cycle=3,phase='closed',state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(mode_),true)
      WHERE code=room_;
    SELECT player_token INTO judge_token FROM public.igr_v4_players WHERE room_code=room_ AND public_role='juge';
    PERFORM public.igr_v52_begin_stage(room_,'audience');
    SELECT * INTO r FROM public.igr_v4_rooms WHERE code=room_;
    q:=r.state->'v52_queue';
    IF r.phase<>'final_audience' OR jsonb_array_length(q)<>7 THEN
      RAISE EXCEPTION 'v706 judge hearing queue failed %: %',mode_,q;
    END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(q) x WHERE (x->>'seconds')::int<>expected_speech OR (x->>'required')::boolean)
    THEN RAISE EXCEPTION 'v706 hearing duration or mandatory speech failure %',mode_;END IF;
    -- Anyone, including the Judge, may skip the hearing.
    FOR i IN 0..6 LOOP
      SELECT * INTO r FROM public.igr_v4_rooms WHERE code=room_;
      current_player:=(r.state->'v52_queue'->i->>'player_id')::uuid;
      SELECT player_token INTO current_token FROM public.igr_v4_players WHERE id=current_player;
      PERFORM public.igr_v52_stage_action(room_,current_token,'skip',null);
    END LOOP;
    SELECT * INTO r FROM public.igr_v4_rooms WHERE code=room_;
    IF r.phase<>'final_suspect_defenses' OR jsonb_array_length(r.state->'v52_queue')<>3
    THEN RAISE EXCEPTION 'v706 tribunal not entered %',mode_;END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(r.state->'v52_queue') x WHERE (x->>'seconds')::int<>expected_defense)
    THEN RAISE EXCEPTION 'v706 courtroom clock wrong %',mode_;END IF;
    SELECT player_token INTO suspect_token FROM public.igr_v4_players WHERE id=(r.state->'v52_queue'->0->>'player_id')::uuid;
    received_error:=false;
    BEGIN PERFORM public.igr_v52_stage_action(room_,suspect_token,'start',null);
      EXCEPTION WHEN OTHERS THEN received_error:=true;
    END;
    IF NOT received_error THEN RAISE EXCEPTION 'v706 suspect opened their own court appearance %',mode_;END IF;
    PERFORM public.igr_v52_stage_action(room_,judge_token,'start',null);
    received_error:=false;
    BEGIN PERFORM public.igr_v52_stage_action(room_,judge_token,'end',null);
      EXCEPTION WHEN OTHERS THEN received_error:=true;
    END;
    IF NOT received_error THEN RAISE EXCEPTION 'v706 judge curtailed protected defence %',mode_;END IF;
    PERFORM public.igr_v52_stage_action(room_,suspect_token,'defense_done',null);
    PERFORM public.igr_v52_stage_action(room_,judge_token,'end',null);
    SELECT * INTO r FROM public.igr_v4_rooms WHERE code=room_;
    IF (r.state->>'v52_index')::int<>1 OR r.state->>'v52_status'<>'waiting'
    THEN RAISE EXCEPTION 'v706 courtroom did not advance after waiver %',mode_;END IF;
  END LOOP;
  -- Without a Judge, preserve the special TERREUR hearing and defence copy.
  room_:='T706N';
  INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(room_,'026');
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
  VALUES (room_,'Enquêteur',0,'enqueteur',null),(room_,'Analyste',1,'analyste',null),(room_,'Officier',2,'officier_liaison',null),
   (room_,'Suspect 1',3,'suspect',1),(room_,'Suspect 2',4,'suspect',2),(room_,'Suspect 3',5,'suspect',3);
  UPDATE public.igr_v4_rooms SET status='playing',cycle=3,state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb('short'::text),true) WHERE code=room_;
  PERFORM public.igr_v52_begin_stage(room_,'audience');
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=room_;
  IF jsonb_array_length(r.state->'v52_queue')<>2 THEN RAISE EXCEPTION 'v706 no-Judge roster changed';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.igr_v4_events WHERE room_code=room_ AND payload->>'title'='AUDIENCE FINALE · TERREUR')
  THEN RAISE EXCEPTION 'v706 TERREUR hearing copy overwritten';END IF;
  PERFORM public.igr_v52_begin_stage(room_,'defenses');
  IF NOT EXISTS(SELECT 1 FROM public.igr_v4_events WHERE room_code=room_ AND payload->>'title'='DÉFENSES FINALES · TERREUR')
  THEN RAISE EXCEPTION 'v706 TERREUR defence copy overwritten';END IF;
  RAISE NOTICE 'v706 court QA: SHORT, LONG, judge skip, protected defence, waiver, no-Judge TERREUR PASS';
END $court_qa$;
