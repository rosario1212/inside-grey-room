-- Close procedural actions at the start of final provisional hearings;
-- protect against outdated UI versions requesting late role actions.
DO $closure$
DECLARE f text; src text; expected text; replacement text;
BEGIN
 FOR f IN SELECT unnest(ARRAY['igr_v44_submit_judge_request','igr_v44_judge_decide_request',
 'igr_v50_counter_expertise','igr_v50_share_expert_result']) LOOP
  SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=f;
  expected:='''closed'',''provisional_lock''';
  replacement:='''closed'',''provisional_orals'',''provisional_lock''';
  IF position(expected in src)=0 THEN RAISE EXCEPTION 'final-phase guard changed in %',f; END IF;
  EXECUTE replace(src,expected,replacement);
 END LOOP;

 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='igr_v50_expert_analyze';
 expected:='select * into r from public.igr_v4_rooms where code=me.room_code for update;';
 replacement:=expected||E'\n '||'if r.scenario_id in (''003'',''009'') and r.phase in (''provisional_orals'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote'') then raise exception ''expertise closed'';end if;';
 IF position(expected in src)=0 THEN RAISE EXCEPTION 'expert availability lookup changed';END IF;
 EXECUTE replace(src,expected,replacement);

 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='igr_v50_expert_state';
 expected:='r.phase not in (''role_reading'',''investigation_assembly'',''interrogation'',''event_confrontation'',''closed'',''reveal'')';
 replacement:=expected||' and (r.scenario_id not in (''003'',''009'') or r.phase not in (''provisional_orals'',''provisional_lock'',''defense'',''final_debrief'',''locking'',''judge_speech'',''judge_integrity_vote''))';
 IF position(expected in src)=0 THEN RAISE EXCEPTION 'expert can_analyze state changed';END IF;
 src:=replace(src,expected,replacement);
 expected:='''can_counter'',r.status=''playing'' and r.phase not in (''closed'',''provisional_lock''';
 replacement:='''can_counter'',r.status=''playing'' and r.phase not in (''closed'',''provisional_orals'',''provisional_lock''';
 IF position(expected in src)=0 THEN RAISE EXCEPTION 'expert can_counter state changed';END IF;
 EXECUTE replace(src,expected,replacement);

 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='igr_v49_expert_public_state';
 expected:='r.status=''playing'' and r.phase not in (''closed'',''provisional_lock''';
 replacement:='r.status=''playing'' and r.phase not in (''closed'',''provisional_orals'',''provisional_lock''';
 IF position(expected in src)=0 THEN RAISE EXCEPTION 'expert public state changed';END IF;
 EXECUTE replace(src,expected,replacement);

 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='igr_v49_publish_expert_result';
 expected:='if r.status<>''playing'' or r.phase in (''closed'',''provisional_lock''';
 replacement:='if r.status<>''playing'' or r.phase in (''closed'',''provisional_orals'',''provisional_lock''';
 IF position(expected in src)=0 THEN RAISE EXCEPTION 'expert publication phase guard changed';END IF;
 EXECUTE replace(src,expected,replacement);
END $closure$;
