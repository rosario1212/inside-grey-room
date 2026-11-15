-- v693 military hearing access integration QA. Run against a migrated DB; no test data persists.
BEGIN;
DO $verify$
DECLARE sid text;code_ text;host_ uuid;officer_ uuid;enq_ uuid;enq_token_ uuid;
 s1 uuid;s2 uuid;started timestamptz;vsession text;res jsonb;n int;blocked bool;
BEGIN
 FOR sid IN SELECT unnest(ARRAY['026','027','028']) LOOP
  code_:='V93'||sid;
  INSERT INTO public.igr_v4_rooms(code,scenario_id)
  VALUES(code_,sid) RETURNING host_token INTO host_;
  PERFORM public.igr_v681_terror_set_city(code_,host_,'Citadelle');
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role) VALUES
   (code_,'Enquêteur',0,'enqueteur'),(code_,'Analyste',1,'analyste'),
   (code_,'Officier',2,'officier_liaison'),(code_,'Captif 1',3,'suspect'),
   (code_,'Captif 2',4,'suspect'),(code_,'Captif 3',5,'suspect');
  SELECT id,player_token INTO enq_,enq_token_
   FROM public.igr_v4_players WHERE room_code=code_ AND public_role='enqueteur';
  SELECT player_token INTO officer_
   FROM public.igr_v4_players WHERE room_code=code_ AND public_role='officier_liaison';
  SELECT id INTO s1 FROM public.igr_v4_players WHERE room_code=code_ AND seat_index=3;
  SELECT id INTO s2 FROM public.igr_v4_players WHERE room_code=code_ AND seat_index=4;

  UPDATE public.igr_v4_rooms SET status='playing',cycle=1,phase='interrogation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '5 minutes',
   state=jsonb_build_object('current_target',s1) WHERE code=code_;
  SELECT phase_started_at INTO started FROM public.igr_v4_rooms WHERE code=code_;
  blocked:=false;
  BEGIN PERFORM public.igr_v693_terror_officer_join(code_,officer_,'source',started);
  EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%no eligible live hearing%' THEN blocked:=true;ELSE RAISE;END IF;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'cycle 1 officer cannot join %',sid;END IF;

  UPDATE public.igr_v4_rooms SET cycle=2,phase='interrogation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '5 minutes',
   state=jsonb_build_object('current_target',s1) WHERE code=code_;
  SELECT phase_started_at INTO started FROM public.igr_v4_rooms WHERE code=code_;
  res:=public.igr_v693_terror_officer_join(code_,officer_,'source',started);
  IF res->>'kind'<>'interrogation' OR coalesce((res->>'remaining_visits')::int,-1)<>0 THEN
   RAISE EXCEPTION 'not a real cycle 2 interrogation visit %',sid;END IF;
  SELECT count(*) INTO n FROM public.igr_v4_events WHERE room_code=code_
   AND event_type='terror_v693_officer_visit' AND visibility='public';
  IF n<>1 THEN RAISE EXCEPTION 'officer intervention not visible publicly %',sid;END IF;
  IF (SELECT state#>>'{terror_v693_officer_visit,session_epoch_ms}' FROM public.igr_v4_rooms WHERE code=code_) IS NULL THEN
   RAISE EXCEPTION 'missing immutable hearing timestamp %',sid;END IF;

  blocked:=false;
  BEGIN PERFORM public.igr_v693_terror_officer_join(code_,officer_,'civils',started);
  EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%one officer intervention per cycle%' THEN blocked:=true;ELSE RAISE;END IF;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'same-cycle hearing visit reused %',sid;END IF;
  blocked:=false;
  BEGIN PERFORM public.igr_v693_terror_officer_join(code_,enq_token_,'acces',started);
  EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%only the military officer%' THEN blocked:=true;ELSE RAISE;END IF;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'enqueteur impersonated military officer %',sid;END IF;

  PERFORM public.igr_v4_video_set(code_,enq_token_,true,false);
  SELECT state->>'video_session' INTO vsession FROM public.igr_v4_rooms WHERE code=code_;
  IF nullif(vsession,'') IS NULL THEN RAISE EXCEPTION 'video stream was not activated %',sid;END IF;
  PERFORM public.igr_v4_signal_send(code_,officer_,enq_,'viewer_ready',jsonb_build_object('session',vsession));
  UPDATE public.igr_v4_rooms SET phase_started_at=clock_timestamp()+interval '1 second',
   phase_ends_at=clock_timestamp()+interval '4 minutes',
   state=jsonb_build_object('current_target',s2,'video_active',true,'video_session','new-stream') WHERE code=code_;
  blocked:=false;
  BEGIN PERFORM public.igr_v4_signal_send(code_,officer_,enq_,'viewer_ready',jsonb_build_object('session','new-stream'));
  EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%officer did not join this interrogation%' THEN blocked:=true;ELSE RAISE;END IF;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'video access reused across interrogations %',sid;END IF;

  UPDATE public.igr_v4_rooms SET cycle=3,phase='event_confrontation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '4 minutes',
   state=jsonb_build_object('event_active','confrontation','event_targets',jsonb_build_array(s1,s2),
    'event_participants',jsonb_build_array(s1,s2)) WHERE code=code_;
  SELECT phase_started_at INTO started FROM public.igr_v4_rooms WHERE code=code_;
  res:=public.igr_v693_terror_officer_join(code_,officer_,'civils',started);
  IF res->>'kind'<>'confrontation' THEN RAISE EXCEPTION 'cycle 3 confrontation missing %',sid;END IF;
  SELECT count(*) INTO n FROM jsonb_array_elements_text((SELECT state->'event_participants'
   FROM public.igr_v4_rooms WHERE code=code_)) z
   WHERE z=(SELECT id::text FROM public.igr_v4_players
     WHERE room_code=code_ AND public_role='officier_liaison');
  IF n<>1 THEN RAISE EXCEPTION 'confrontation participant not added exactly once %',sid;END IF;
  blocked:=false;
  BEGIN PERFORM public.igr_v693_terror_officer_join(code_,officer_,'acces',started);
  EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%one officer intervention per cycle%' THEN blocked:=true;ELSE RAISE;END IF;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'cycle 3 officer exceeded quota %',sid;END IF;
 END LOOP;
END; $verify$;
ROLLBACK;
