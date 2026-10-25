CREATE OR REPLACE FUNCTION igr_private.igr_v620_020_emit_evidence(p_room text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;pack jsonb;item jsonb;idx integer;total integer:=0;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room)) FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'020' OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RETURN 0;END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_events e WHERE e.room_code=r.code
  AND e.event_type='trame' AND (e.payload->>'cycle')::integer=r.cycle
  AND e.payload->>'director_version'='v620-020-guaranteed') THEN RETURN 0;END IF;
 pack:=igr_private.igr_v601_020_pinned_pack(r.code);
 IF pack IS NULL THEN RAISE EXCEPTION '020 evidence snapshot missing';END IF;
 FOR item,idx IN SELECT t.value,t.ordinality::integer-1
 FROM jsonb_array_elements(pack->'trames') WITH ORDINALITY AS t(value,ordinality)
 WHERE (t.value->>'min_cycle')::integer=r.cycle AND (t.value->>'guaranteed')::boolean
 ORDER BY t.ordinality LOOP
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 VALUES(r.code,'trame','roles',
 ARRAY['enqueteur','analyste','procureur','juge','inspecteur','expert']::text[],
 r.cycle,jsonb_build_object('title',item->>'title','text',item->>'text',
 'cycle',r.cycle,'director_version','v620-020-guaranteed',
 'guaranteed',true,'evidence_id',item->>'id'));
 UPDATE public.igr_v4_rooms rr SET state=jsonb_set(
 coalesce(rr.state,'{}'::jsonb),ARRAY['used_trames',idx::text],'true'::jsonb,true)
 WHERE rr.code=r.code;
 total:=total+1;
 END LOOP;
 IF total<>2 THEN RAISE EXCEPTION '020 needs exactly two proven evidences for cycle %',r.cycle;END IF;
 RETURN total;
END $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v620_020_emit_evidence(text) FROM public,anon,authenticated;
