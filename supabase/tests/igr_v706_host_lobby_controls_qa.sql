-- Execute within BEGIN ... ROLLBACK. Never alter real rooms.
DO $qa$
DECLARE c text:='K706A'; ht uuid; host_id uuid; host_player_token uuid; judge_id uuid;judge_token uuid;
 victim_id uuid;victim_token uuid; another_id uuid; another_token uuid; r jsonb;n integer;
BEGIN
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(c,'032') RETURNING host_token INTO ht;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,is_host)
 VALUES(c,'Hôte QA',0,true) RETURNING id,player_token INTO host_id,host_player_token;
 FOR n IN 1..6 LOOP
  IF n=1 THEN
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
   VALUES(c,'Juge QA',n) RETURNING id,player_token INTO judge_id,judge_token;
  ELSIF n=2 THEN
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
   VALUES(c,'À retirer QA',n) RETURNING id,player_token INTO victim_id,victim_token;
  ELSIF n=3 THEN
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
   VALUES(c,'Autre QA',n) RETURNING id,player_token INTO another_id,another_token;
  ELSE
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
   VALUES(c,'QA '||n,n);
  END IF;
 END LOOP;
 r:=public.igr_v4_choose_role(c,judge_token,'juge');
 IF r->>'role'<>'juge' THEN RAISE EXCEPTION 'unable to reserve judge'; END IF;

 -- A valid player's token must not substitute for the host's capability.
 BEGIN
  PERFORM public.igr_v706_host_kick_lobby(c,gen_random_uuid(),victim_id);
  RAISE EXCEPTION 'security breach: wrong host token kicked someone';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'security breach:%' THEN RAISE;END IF;
 END;
 BEGIN
  PERFORM public.igr_v706_host_kick_lobby(c,ht,host_id);
  RAISE EXCEPTION 'security breach: host kicked self';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'security breach:%' THEN RAISE; END IF;
 END;
 IF public.igr_v706_lobby_session_status(c,victim_token)->>'active'<>'true'
 THEN RAISE EXCEPTION 'guest must be active before kick'; END IF;
 r:=public.igr_v706_host_kick_lobby(c,ht,victim_id);
 IF r->>'ok'<>'true' OR (r->>'remaining')::int<>6
 THEN RAISE EXCEPTION 'host kick failed: %',r;END IF;
 IF public.igr_v706_lobby_session_status(c,victim_token)->>'active'<>'false'
 THEN RAISE EXCEPTION 'kicked token still active'; END IF;
 SELECT count(*) INTO n FROM public.igr_v4_players WHERE room_code=c;
 IF n<>6 THEN RAISE EXCEPTION 'seat not released: %',n;END IF;
 IF (SELECT preferred_role FROM public.igr_v4_players WHERE id=judge_id) IS NOT NULL
 THEN RAISE EXCEPTION 'v700 role reconciliation failed after kick';END IF;
 IF (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND event_type='player_excluded')<>1
 THEN RAISE EXCEPTION 'missing public kick event';END IF;
 IF (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND event_type='player_left')<>1
 THEN RAISE EXCEPTION 'missing public leave event';END IF;

 r:=public.igr_v4_leave_room(c,another_token);
 IF r->>'left'<>'true' OR (r->>'remaining')::int<>5
 THEN RAISE EXCEPTION 'voluntary lobby leave failed: %',r;END IF;
 IF public.igr_v706_lobby_session_status(c,another_token)->>'active'<>'false'
 THEN RAISE EXCEPTION 'departed token still active'; END IF;

 UPDATE public.igr_v4_rooms SET status='playing',phase='briefing' WHERE code=c;
 BEGIN
  PERFORM public.igr_v706_host_kick_lobby(c,ht,judge_id);
  RAISE EXCEPTION 'security breach: host kicked during play';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'security breach:%' THEN RAISE; END IF;
 END;
 r:=public.igr_v4_leave_room(c,judge_token);
 IF r->>'reason'<>'game_started'
 THEN RAISE EXCEPTION 'running game unexpectedly removed player: %',r;END IF;
 IF public.igr_v706_lobby_session_status(c,judge_token)->>'active'<>'true'
 THEN RAISE EXCEPTION 'running game session was revoked';END IF;

 -- A host leaving an unrelated pre-game room closes it for all occupants.
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES('K706B','032');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,is_host)
 VALUES('K706B','Hôte B',0,true) RETURNING player_token INTO host_player_token;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index)
 VALUES('K706B','Joueur B',1);
 r:=public.igr_v4_leave_room('K706B',host_player_token);
 IF r->>'room_closed'<>'true'
 THEN RAISE EXCEPTION 'host exit failed to close lobby: %',r;END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_rooms WHERE code='K706B')
 THEN RAISE EXCEPTION 'host lobby still exists';END IF;
END $qa$;
