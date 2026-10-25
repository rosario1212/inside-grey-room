-- Display the true 008 protection-point cost in the procedural catalogue.
-- Other scenarios retain the original labels, objective text and mechanics.
DO $public_budget$
DECLARE src text; old_text text; new_text text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO src FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='igr_v50_judge_state_legacy';
 old_text:='jsonb_build_object(''id'',v->>''id'',''title'',v->>''title'')';
 new_text:='jsonb_build_object(''id'',v->>''id'',''title'',v->>''title''||CASE WHEN r.scenario_id=''008'' THEN '' · ''||coalesce(v->>''cost'',''1'')||'' pt'' ELSE '''' END,''cost'',greatest(1,coalesce((v->>''cost'')::integer,1)))';
 IF position(old_text in src)=0 THEN RAISE EXCEPTION 'Judge catalogue source changed';END IF;
 EXECUTE replace(src,old_text,new_text);
END;
$public_budget$;
