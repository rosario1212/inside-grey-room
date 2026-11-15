-- Run inside BEGIN; ... ROLLBACK; after v704. The three 6-player
-- simulations validate sealed starts, actual order choices and cycle reports.
DO $qa$
DECLARE sid text; room_ text; host_ uuid; token_ uuid; response_ jsonb;state_ jsonb;i integer;
BEGIN
 FOREACH sid IN ARRAY ARRAY['026','027','028'] LOOP
  room_:='T4P'||sid;
  INSERT INTO public.igr_v4_rooms(code,scenario_id)
  VALUES(room_,sid) RETURNING host_token INTO host_;
  PERFORM public.igr_v681_terror_set_city(room_,host_,'Capitale QA');
  FOR i IN 0..5 LOOP
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
   VALUES(room_,'V704 joueur '||i,i);
  END LOOP;
  response_:=public.igr_v4_start_game(room_,host_);
  IF response_->>'ok'<>'true' THEN RAISE EXCEPTION 'v704 game start failed for %',sid;END IF;
  SELECT player_token INTO token_ FROM public.igr_v4_players
  WHERE room_code=room_ AND public_role='officier_liaison';
  IF token_ IS NULL THEN RAISE EXCEPTION 'v704 no officer for %',sid;END IF;
  UPDATE public.igr_v4_rooms SET cycle=1,phase='cycle_live',
    phase_started_at=clock_timestamp(),
    phase_ends_at=clock_timestamp()+interval '10 minutes'
   WHERE code=room_;
  response_:=public.igr_v694_terror_orders(room_,token_);
  UPDATE public.igr_v4_rooms
    SET state=jsonb_set(state,'{terror_v694,started_at}',
      to_jsonb((clock_timestamp()-interval '12 minutes')::text),true)
   WHERE code=room_;
  response_:=public.igr_v694_terror_orders(room_,token_);
  IF (response_#>>'{active,slot}')::int IS DISTINCT FROM 1
  THEN RAISE EXCEPTION 'v704 missing first order for %',sid;END IF;
  response_:=public.igr_v694_terror_confirm(room_,token_,1,'archives');
  response_:=public.igr_v694_terror_orders(room_,token_);
  response_:=public.igr_v694_terror_confirm(room_,token_,2,'secteur');
  response_:=public.igr_v694_terror_orders(room_,token_);
  response_:=public.igr_v694_terror_confirm(room_,token_,3,'reconquerir');
  UPDATE public.igr_v4_rooms SET phase='cycle_debrief' WHERE code=room_;
  UPDATE public.igr_v4_rooms SET cycle=2,phase='cycle_live',
    phase_started_at=clock_timestamp(),
    phase_ends_at=clock_timestamp()+interval '10 minutes'
   WHERE code=room_;
  SELECT state->'terror_v681' INTO state_ FROM public.igr_v4_rooms WHERE code=room_;
  IF state_#>>'{history,0,military_operation}' IS DISTINCT FROM 'reconquerir'
    OR state_#>>'{history,0,military_order_label}' IS DISTINCT FROM 'Reconquête limitée'
    OR coalesce(length(state_#>>'{history,0,military_order_text}'),0)<20
  THEN RAISE EXCEPTION 'v704 debrief did not preserve real final military order for %: %',
     sid,state_#>'{history,0}';END IF;
  IF state_#>>'{history,0,band}' NOT LIKE 'RECONQUÊTE TENTÉE%'
  THEN RAISE EXCEPTION 'v704 debrief still describes obsolete defensive order %: %',
    sid,state_#>>'{history,0,band}';END IF;
 END LOOP;
END $qa$;
