-- 029 leadership decisions: private, token-authorized, one per cycle.
-- Decisions change personal objectives at the ending, never automatically harm anyone.
CREATE OR REPLACE FUNCTION public.igr_v155_029_leadership_decision(p_code text,p_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $leader$
DECLARE a public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
BEGIN
 PERFORM igr_private.rate_limit('029_leadership_decision',coalesce(p_token::text,'none'),8,60);
 SELECT * INTO a FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_token;
 IF NOT FOUND OR a.public_role NOT IN ('don','bras_droit') THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=a.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'029' OR r.status<>'playing'
 OR r.cycle NOT BETWEEN 1 AND 3 OR NOT igr_private.igr_v108_029_is_enabled()
 THEN RAISE EXCEPTION 'not active'; END IF;
 IF r.phase NOT IN ('investigation_assembly','interrogation_select','interrogation','cycle_debrief','trame')
 AND r.phase NOT LIKE 'event_%' AND r.phase NOT LIKE 'annex_%'
 THEN RAISE EXCEPTION 'outside investigation'; END IF;
 IF (a.public_role='don' AND p_choice NOT IN ('contain','cooperate'))
 OR (a.public_role='bras_droit' AND p_choice NOT IN ('loyal','cooperate'))
 THEN RAISE EXCEPTION 'invalid decision'; END IF;
 IF EXISTS (SELECT 1 FROM public.igr_v4_actions
 WHERE room_code=r.code AND player_id=a.id AND action_type='cartel029_leadership'
 AND cycle=r.cycle) THEN RAISE EXCEPTION 'decision already made this cycle'; END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,a.id,r.cycle,'cartel029_leadership',jsonb_build_object('choice',p_choice));
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,'choice',p_choice);
END $leader$;
REVOKE ALL ON FUNCTION public.igr_v155_029_leadership_decision(text,uuid,text) FROM PUBLIC,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v155_029_leadership_decision(text,uuid,text) TO anon;
