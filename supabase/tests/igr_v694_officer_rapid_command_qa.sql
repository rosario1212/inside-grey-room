-- Run only in an isolated transaction with migration v694; roll back all test rooms.
DO $test$
DECLARE sid text;code_ text;host_ uuid;off_token uuid;off_id uuid;s1 uuid;s2 uuid;s3 uuid;
 start_ timestamptz;res jsonb;n integer;skipped boolean;v jsonb;
BEGIN
 FOR sid IN SELECT unnest(ARRAY['026','027','028']) LOOP
  code_:='Q94'||sid;
  INSERT INTO public.igr_v4_rooms(code,scenario_id)
    VALUES(code_,sid) RETURNING host_token INTO host_;
  PERFORM public.igr_v681_terror_set_city(code_,host_,'Capitale QA');
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
  VALUES(code_,'Enquêteur QA',0,'enqueteur'),(code_,'Analyste QA',1,'analyste'),
   (code_,'Officier QA',2,'officier_liaison'),(code_,'Suspect QA 1',3,'suspect'),
   (code_,'Suspect QA 2',4,'suspect'),(code_,'Suspect QA 3',5,'suspect');
  SELECT id,player_token INTO off_id,off_token FROM public.igr_v4_players
   WHERE room_code=code_ AND public_role='officier_liaison';
  SELECT id INTO s1 FROM public.igr_v4_players WHERE room_code=code_ AND seat_index=3;
  SELECT id INTO s2 FROM public.igr_v4_players WHERE room_code=code_ AND seat_index=4;
  SELECT id INTO s3 FROM public.igr_v4_players WHERE room_code=code_ AND seat_index=5;
  IF public.igr_v4_role_capacity(sid,6,'enqueteur')<>1
     OR public.igr_v4_role_capacity(sid,6,'analyste')<>1
     OR public.igr_v4_role_capacity(sid,6,'suspect')<>3
     OR public.igr_v4_role_capacity(sid,6,'officier_liaison')<>1 THEN
    RAISE EXCEPTION 'role capacity mismatch %',sid;
  END IF;
  UPDATE public.igr_v4_rooms SET status='playing',cycle=1,phase='interrogation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '6 minutes',
   state=jsonb_build_object('current_target',s1) WHERE code=code_;
  SELECT phase_started_at INTO start_ FROM public.igr_v4_rooms WHERE code=code_;
  res:=public.igr_v693_terror_officer_join(code_,off_token,'source',start_);
  IF res->>'kind'<>'interrogation' THEN RAISE EXCEPTION 'cycle 1 hearing failed %',sid;END IF;
  skipped:=false;
  BEGIN
   PERFORM public.igr_v693_terror_officer_join(code_,off_token,'source',start_);
  EXCEPTION WHEN others THEN skipped:=SQLERRM LIKE '%one officer intervention%';END;
  IF NOT skipped THEN RAISE EXCEPTION 'cycle 1 duplicate visit accepted %',sid;END IF;

  -- Timer is opened only outside an actual hearing.
  res:=public.igr_v694_terror_orders(code_,off_token);
  UPDATE public.igr_v4_rooms SET phase='cycle_live',
    state=jsonb_set(state,'{terror_v694,started_at}',to_jsonb((clock_timestamp()-interval '10 minutes')::text),true)
    WHERE code=code_;
  res:=public.igr_v694_terror_orders(code_,off_token);
  IF (res#>>'{active,slot}')::int<>1 THEN RAISE EXCEPTION 'first military order missing %',sid;END IF;
  -- Re-entering a hearing freezes the running deadline.
  UPDATE public.igr_v4_rooms SET phase='interrogation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '6 minutes',
   state=jsonb_set(state,'{current_target}',to_jsonb(s2::text),true) WHERE code=code_;
  SELECT state->'terror_v694' INTO v FROM public.igr_v4_rooms WHERE code=code_;
  IF v#>>'{active,paused_at}' IS NULL THEN RAISE EXCEPTION 'timer not paused %',sid;END IF;
  UPDATE public.igr_v4_rooms SET phase='cycle_live' WHERE code=code_;
  SELECT state->'terror_v694' INTO v FROM public.igr_v4_rooms WHERE code=code_;
  IF v#>>'{active,paused_at}' IS NOT NULL THEN RAISE EXCEPTION 'timer not resumed %',sid;END IF;
  res:=public.igr_v694_terror_confirm(code_,off_token,1,'archives');
  IF coalesce((res#>>'{result,slot}')::int,0)<>1 THEN
   RAISE EXCEPTION 'first command rejected %',sid;END IF;
  res:=public.igr_v694_terror_orders(code_,off_token);
  IF coalesce((res#>>'{active,slot}')::int,0)<>2 THEN
    RAISE EXCEPTION 'second order missing %',sid;END IF;
  res:=public.igr_v694_terror_confirm(code_,off_token,2,'secteur');
  res:=public.igr_v694_terror_orders(code_,off_token);
  IF coalesce((res#>>'{active,slot}')::int,0)<>3 THEN
    RAISE EXCEPTION 'third order missing %',sid;END IF;
  res:=public.igr_v694_terror_confirm(code_,off_token,3,'reconquerir');
  SELECT count(*) INTO n FROM public.igr_v4_actions WHERE room_code=code_
    AND action_type='terror_v694_military' AND cycle=1;
  IF n<>3 THEN RAISE EXCEPTION 'nine-order quota failed cycle 1 %',sid;END IF;
  SELECT count(*) INTO n FROM public.igr_v4_events WHERE room_code=code_
    AND event_type='terror_v694_military_result' AND cycle=1;
  IF n<>3 THEN RAISE EXCEPTION 'public immediate effects missing %',sid;END IF;
  SELECT state#>'{terror_v681,controlled}' INTO v FROM public.igr_v4_rooms WHERE code=code_;
  IF v IS NULL THEN RAISE EXCEPTION 'no immediate city update %',sid;END IF;

  UPDATE public.igr_v4_rooms SET phase='cycle_debrief' WHERE code=code_;
  UPDATE public.igr_v4_rooms SET cycle=2,phase='interrogation',
    phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '6 minutes',
    state=jsonb_set(state,'{current_target}',to_jsonb(s1::text),true) WHERE code=code_;
  SELECT phase_started_at INTO start_ FROM public.igr_v4_rooms WHERE code=code_;
  skipped:=false;
  BEGIN
    PERFORM public.igr_v693_terror_officer_join(code_,off_token,'source',start_);
  EXCEPTION WHEN others THEN skipped:=SQLERRM LIKE '%suspect already visited%';END;
  IF NOT skipped THEN RAISE EXCEPTION 'repeat suspect accepted in cycle 2 %',sid;END IF;
  UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{current_target}',to_jsonb(s2::text),true)
   WHERE code=code_;
  res:=public.igr_v693_terror_officer_join(code_,off_token,'civils',start_);
  IF res->>'kind'<>'interrogation' THEN RAISE EXCEPTION 'cycle 2 suspect missing %',sid;END IF;
  UPDATE public.igr_v4_rooms SET phase='event_confrontation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '4 minutes',
   state=jsonb_set(jsonb_set(jsonb_set(state,
     '{event_active}',to_jsonb('confrontation'::text),true),
     '{event_targets}',jsonb_build_array(s1,s2),true),
     '{event_participants}',jsonb_build_array(s1,s2),true) WHERE code=code_;
  SELECT phase_started_at INTO start_ FROM public.igr_v4_rooms WHERE code=code_;
  res:=public.igr_v694_officer_confront(code_,off_token,'acces',start_);
  IF NOT coalesce((res->>'joined')::boolean,false) THEN
    RAISE EXCEPTION 'independent confrontation missing %',sid;END IF;
  skipped:=false;
  BEGIN
    PERFORM public.igr_v694_officer_confront(code_,off_token,'civils',start_);
  EXCEPTION WHEN others THEN skipped:=SQLERRM LIKE '%one military confrontation%';END;
  IF NOT skipped THEN RAISE EXCEPTION 'duplicate confrontation accepted %',sid;END IF;

  -- A short cycle must resolve its remaining three missed orders without blocking the game.
  UPDATE public.igr_v4_rooms SET phase='cycle_debrief' WHERE code=code_;
  SELECT count(*) INTO n FROM public.igr_v4_actions WHERE room_code=code_
    AND cycle=2 AND action_type='terror_v694_military';
  IF n<>3 THEN RAISE EXCEPTION 'automatic debrief fallback not executed %',sid;END IF;
  SELECT count(*) INTO n FROM public.igr_v4_actions WHERE room_code=code_
    AND cycle=2 AND action_type='terror_v694_military'
    AND payload->>'auto'='true';
  IF n<>3 THEN RAISE EXCEPTION 'automatic orders should all be marked %',sid;END IF;

  UPDATE public.igr_v4_rooms SET cycle=3,phase='interrogation',
   phase_started_at=clock_timestamp(),phase_ends_at=clock_timestamp()+interval '6 minutes',
   state=jsonb_set(state,'{current_target}',to_jsonb(s3::text),true) WHERE code=code_;
  SELECT phase_started_at INTO start_ FROM public.igr_v4_rooms WHERE code=code_;
  res:=public.igr_v693_terror_officer_join(code_,off_token,'acces',start_);
  IF res->>'kind'<>'interrogation' THEN RAISE EXCEPTION 'cycle 3 third suspect missing %',sid;END IF;
  UPDATE public.igr_v4_rooms SET phase='cycle_debrief' WHERE code=code_;
  SELECT count(*) INTO n FROM public.igr_v4_actions WHERE room_code=code_
   AND action_type='terror_v694_military';
  IF n<>9 THEN RAISE EXCEPTION 'total nine commands missing %: %',sid,n;END IF;
 END LOOP;
END $test$;
