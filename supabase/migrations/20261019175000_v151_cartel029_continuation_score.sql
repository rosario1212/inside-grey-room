CREATE OR REPLACE FUNCTION public.igr_v44_fix_continuation(p_room text, p_reveal jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;arr jsonb;outv jsonb:='[]'::jsonb;v jsonb;protections int;score int;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p_room;
 IF NOT FOUND THEN RETURN;END IF;
 arr:=coalesce(r.state#>'{continuation,winners}','[]'::jsonb);
 protections:=public.igr_v44_protection_count(p_room);
 FOR v IN SELECT value FROM jsonb_array_elements(arr) LOOP
  IF r.scenario_id='029' AND coalesce((r.state->>'cartel029_ready')::boolean,false) THEN
    -- Score comes from the specialist winning objective. Old three-suspect
    -- truth levels and legacy judge bonuses never rank this dossier.
    score:=case v->>'public_role'
       when 'enqueteur' then 95 when 'analyste' then 94
       when 'procureur' then 92 when 'juge' then 92
       when 'journaliste' then 90 when 'suspect' then 90
       when 'don' then 90 when 'bras_droit' then 90 else 85 end;
    v:=jsonb_set(v,'{score}',to_jsonb(score),true);
  ELSE
    IF v->>'public_role'='maitre' THEN v:=jsonb_set(v,'{score}',to_jsonb(95),true);END IF;
    IF v->>'public_role'='juge' THEN v:=jsonb_set(v,'{score}',to_jsonb(100),true);END IF;
  END IF;
  outv:=outv||jsonb_build_array(v);
 END LOOP;
 UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{continuation,winners}',outv,true),updated_at=now()
 WHERE code=p_room;
END $function$
;
