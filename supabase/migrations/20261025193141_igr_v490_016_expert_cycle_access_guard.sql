
DO $fix$
DECLARE src text; sig text; old_ text;
BEGIN
 FOREACH sig IN ARRAY ARRAY[
  'public.igr_v50_expert_analyze(text,uuid,text)',
  'public.igr_v50_expert_state(text,uuid)'
 ] LOOP
  src:=pg_get_functiondef(sig::regprocedure);
  src:=replace(src,'r.scenario_id in (''003'',''009'')','r.scenario_id in (''003'',''009'',''016'')');
  IF sig='public.igr_v50_expert_state(text,uuid)' THEN
   -- The expert must see only analyses unlocked by the current cycle.
   src:=replace(src,
    'for it in select value from jsonb_array_elements(coalesce(pack->''expert_actions'',''[]''::jsonb)) loop catalog:=catalog||jsonb_build_array(',
    'for it in select value from jsonb_array_elements(coalesce(pack->''expert_actions'',''[]''::jsonb)) loop IF r.scenario_id=''016'' AND r.cycle<coalesce((it->>''min_cycle'')::integer,1) THEN CONTINUE; END IF; catalog:=catalog||jsonb_build_array(');
  END IF;
  EXECUTE src;
 END LOOP;
END $fix$;
