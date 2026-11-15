-- v696 · Align command timers and player initiatives with the in-app rulebook.
-- Do not alter sealed variants, role scores, private clues, or existing room results.

DO $patch$
DECLARE definition text;anchor text;pos integer;
BEGIN
 SELECT pg_get_functiondef('public.igr_v694_terror_orders(text,uuid)'::regprocedure) INTO definition;
 IF position('v696 phase preparation gate' IN definition)=0 THEN
  anchor:=' v:=coalesce(r.state->''terror_v694'',''{}''::jsonb);';
  pos:=position(anchor IN definition);
  IF pos=0 THEN RAISE EXCEPTION 'v696 officer clock anchor changed'; END IF;
  definition:=substring(definition from 1 for pos-1)
    ||$replacement$
 -- v696 phase preparation gate. No military alert opens during role reading or
 -- the Investigation assembly. The three decision windows begin only afterward.
 IF r.phase IN ('briefing','role_reading','pre_investigation','investigation_assembly') THEN
   RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'completed',0,
     'total',3,'active',null,'preparation',true,'last_result',null);
 END IF;
 v:=coalesce(r.state->'terror_v694','{}'::jsonb);$replacement$
    ||substring(definition from pos+length(anchor));
  EXECUTE definition;
 END IF;
END $patch$;

DO $patch$
DECLARE definition text;old_ text;new_ text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v694_role_initiative(text,uuid,text,text)'::regprocedure) INTO definition;
 IF position('v696 initiative final-phase gate' IN definition)=0 THEN
  old_:='  OR r.phase IN (''briefing'',''role_reading'',''investigation_assembly'',''cycle_debrief'',''locking'',''reveal'')';
  new_:=$replacement$  -- v696 initiative final-phase gate: role notes cannot appear after the case closes.
  OR r.phase IN ('briefing','role_reading','pre_investigation','investigation_assembly',
   'cycle_debrief','trame','provisional_orals','provisional_lock','defense',
   'final_debrief','final_audience','final_suspect_defenses',
   'judge_speech','judge_integrity_vote','locking','reveal','closed')$replacement$;
  IF position(old_ IN definition)=0 THEN RAISE EXCEPTION 'v696 initiative phase anchor changed';END IF;
  definition:=replace(definition,old_,new_);
  EXECUTE definition;
 END IF;
END $patch$;

DO $check$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.igr_v694_terror_orders(text,uuid)'::regprocedure);
 IF position('v696 phase preparation gate' IN definition)=0 THEN
  RAISE EXCEPTION 'v696 officer preparation guard missing';END IF;
 definition:=pg_get_functiondef('public.igr_v694_role_initiative(text,uuid,text,text)'::regprocedure);
 IF position('v696 initiative final-phase gate' IN definition)=0 THEN
  RAISE EXCEPTION 'v696 initiative final-phase guard missing';END IF;
 IF has_function_privilege('anon','igr_private.igr_v694_commit(text,uuid,integer,integer,text,boolean)','EXECUTE')
 THEN RAISE EXCEPTION 'private military order calculation exposed';END IF;
END $check$;