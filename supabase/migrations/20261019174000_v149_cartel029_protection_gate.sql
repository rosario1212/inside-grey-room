CREATE OR REPLACE FUNCTION public.igr_v118_029_protection(p_code text, p_token uuid, p_target text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;caption text;
BEGIN
 PERFORM igr_private.rate_limit('029_protection',p_token::text,10,60);
 SELECT * INTO a FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_token;
 IF NOT FOUND OR a.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=a.room_code FOR UPDATE;
 IF r.scenario_id<>'029' OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 OR NOT igr_private.igr_v108_029_is_enabled() THEN RAISE EXCEPTION 'not active';END IF;
 IF r.phase NOT IN ('investigation_assembly','interrogation_select','interrogation','cycle_debrief','trame')
 AND r.phase NOT LIKE 'event_%' AND r.phase NOT LIKE 'annex_%'
 THEN RAISE EXCEPTION 'protection outside investigation';END IF;
 IF p_target NOT IN ('survivors','relatives','captives') THEN RAISE EXCEPTION 'invalid target';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions x WHERE x.room_code=r.code
 AND x.action_type='cartel029_protection' AND (x.cycle=r.cycle OR x.payload->>'target'=p_target))
 THEN RAISE EXCEPTION 'protection already requested';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,a.id,r.cycle,'cartel029_protection',jsonb_build_object('target',p_target));
 caption:=CASE p_target WHEN 'survivors' THEN 'La protection des trois rescapés est renforcée.'
 WHEN 'relatives' THEN 'Les proches des rescapés sont placés à l’abri.'
 ELSE 'Une demande urgente de libération des vingt captifs est transmise.' END;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'public_notice','public',r.cycle,
 jsonb_build_object('title','PROTECTION','text',caption,'target',p_target,'verified',true,'source','Grey Room','public_broadcast',true));
 RETURN jsonb_build_object('ok',true);
END $function$
;
