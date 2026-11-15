-- TERREUR v705: run inside BEGIN; ... ROLLBACK; 
-- Ensures six-role public messages while preserving final-audience phase flow.
DO $qa$
DECLARE sid text;c text;ht uuid;i integer;message_ text;phase_ text;
BEGIN
 FOREACH sid IN ARRAY ARRAY['026','027','028'] LOOP
  c:='T7C'||sid;
  INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(c,sid) RETURNING host_token INTO ht;
  PERFORM public.igr_v681_terror_set_city(c,ht,'Capitale QA');
  FOR i IN 0..5 LOOP INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index) VALUES(c,'Test '||i,i);END LOOP;
  PERFORM public.igr_v4_start_game(c,ht);
  PERFORM public.igr_v52_begin_stage(c,'audience');
  SELECT payload->>'text' INTO message_ FROM public.igr_v4_events
    WHERE room_code=c AND payload->>'title'='AUDIENCE FINALE · TERREUR'
    ORDER BY id DESC LIMIT 1;
  IF message_ IS NULL OR message_ LIKE '%Inspecteur%' OR message_ LIKE '%Procureur%' OR message_ LIKE '%Juge%'
  THEN RAISE EXCEPTION 'obsolete TERREUR role listed in audience for %: %',sid,message_;END IF;
  PERFORM public.igr_v52_advance(c,'qa');
  PERFORM public.igr_v52_advance(c,'qa');
  SELECT phase INTO phase_ FROM public.igr_v4_rooms WHERE code=c;
  IF phase_<>'final_suspect_defenses' THEN RAISE EXCEPTION 'TERREUR suspect defense stage missing for %',sid;END IF;
  SELECT payload->>'text' INTO message_ FROM public.igr_v4_events
    WHERE room_code=c AND payload->>'title'='DÉFENSES FINALES · TERREUR'
    ORDER BY id DESC LIMIT 1;
  IF message_ IS NULL OR message_ LIKE '%Son Avocat officiel%'
   THEN RAISE EXCEPTION 'obsolete lawyer in TERREUR defenses %: %',sid,message_;END IF;
 END LOOP;
END $qa$;
