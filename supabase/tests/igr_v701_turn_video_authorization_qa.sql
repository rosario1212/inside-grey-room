-- v701 authorization behavior. Must be run inside one transaction and rolled back.
-- This fixture creates temporary test rooms and never modifies real player data.
DO $qa$
DECLARE
  enq_token uuid;
  analyst_token uuid;
  suspect_token uuid;
  officer_token uuid;
  officer_id uuid;
  start_at timestamptz:=clock_timestamp();
BEGIN
  IF NOT has_function_privilege('anon','public.igr_v701_turn_authorize(text,uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.igr_v701_turn_authorize(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'v701 TURN RPC privilege mismatch'; END IF;
  INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,state)
    VALUES('QA701','001','playing',1,'interrogation',start_at,
           '{"video_active":true,"video_session":"test-session"}'::jsonb);
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
    VALUES('QA701','Investigator QA',1,'enqueteur')
    RETURNING player_token INTO enq_token;
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
    VALUES('QA701','Analyst QA',2,'analyste')
    RETURNING player_token INTO analyst_token;
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
    VALUES('QA701','Suspect QA',3,'suspect')
    RETURNING player_token INTO suspect_token;
  IF NOT public.igr_v701_turn_authorize('QA701',enq_token)
     OR NOT public.igr_v701_turn_authorize('QA701',analyst_token)
     OR public.igr_v701_turn_authorize('QA701',suspect_token)
     OR public.igr_v701_turn_authorize('QA701',gen_random_uuid())
     OR public.igr_v701_turn_authorize('OTHER',analyst_token)
  THEN RAISE EXCEPTION 'v701 active interrogation role isolation failed'; END IF;
  UPDATE public.igr_v4_rooms
     SET state=jsonb_set(state,'{video_active}','false'::jsonb,true)
     WHERE code='QA701';
  IF public.igr_v701_turn_authorize('QA701',analyst_token)
     OR NOT public.igr_v701_turn_authorize('QA701',enq_token)
  THEN RAISE EXCEPTION 'v701 spectator must wait for active video'; END IF;
  UPDATE public.igr_v4_rooms
     SET phase='briefing',phase_started_at=clock_timestamp()
     WHERE code='QA701';
  IF public.igr_v701_turn_authorize('QA701',enq_token)
  THEN RAISE EXCEPTION 'v701 must reject video outside interrogation'; END IF;
  INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,state)
    VALUES('QA702','026','playing',2,'interrogation',start_at,
           '{"video_active":true,"video_session":"terror-session"}'::jsonb);
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
    VALUES('QA702','Officer QA',1,'officier_liaison')
    RETURNING id,player_token INTO officer_id,officer_token;
  IF public.igr_v701_turn_authorize('QA702',officer_token)
  THEN RAISE EXCEPTION 'officer can access video before authorized visit'; END IF;
  INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    VALUES('QA702',officer_id,2,'terror_v693_officer_join',
           jsonb_build_object('session_type','interrogation','session_started_at',start_at::text));
  IF NOT public.igr_v701_turn_authorize('QA702',officer_token)
  THEN RAISE EXCEPTION 'officer with current interrogation visit should have video'; END IF;
  UPDATE public.igr_v4_rooms SET phase_started_at=clock_timestamp()+interval '30 seconds' WHERE code='QA702';
  IF public.igr_v701_turn_authorize('QA702',officer_token)
  THEN RAISE EXCEPTION 'officer must not reuse an older interrogation authorization'; END IF;
END
$qa$;
