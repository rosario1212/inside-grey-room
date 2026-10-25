-- Keep Expert action titles inaccessible until their release cycle.
-- Preserve earlier dossiers' existing catalog behavior.
DO $patch$
DECLARE src text;old_ text;new_ text;
BEGIN
 src:=pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure);
 old_:=$old$from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v;else expert_meta$old$;
 new_:=$new$from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v where (r.scenario_id not in ('016','017') or coalesce((v->>'min_cycle')::integer,1)<=r.cycle);else expert_meta$new$;
 IF position(new_ IN src)>0 THEN RETURN;END IF;
 IF position(old_ IN src)=0 THEN RAISE EXCEPTION 'Expert metadata source changed; audit before release';END IF;
 EXECUTE replace(src,old_,new_);
END $patch$;
