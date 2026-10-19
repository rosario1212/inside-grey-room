CREATE OR REPLACE FUNCTION public.igr_v119_029_position(p_code text, p_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;profile_id text;match_id integer;
BEGIN
 PERFORM igr_private.rate_limit('029_choice',p_token::text,8,60);
 SELECT * INTO a FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_token;
 IF NOT FOUND OR a.public_role<>'suspect' OR a.internal_slot<>4 THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=a.room_code FOR UPDATE;
 IF r.scenario_id<>'029' OR r.status<>'playing' OR r.cycle NOT IN(2,3)
 OR NOT igr_private.igr_v108_029_is_enabled() THEN RAISE EXCEPTION 'unavailable';END IF;
 IF r.phase NOT IN ('investigation_assembly','interrogation_select','interrogation','cycle_debrief','trame')
 AND r.phase NOT LIKE 'event_%' AND r.phase NOT LIKE 'annex_%'
 THEN RAISE EXCEPTION 'decision outside investigation';END IF;
 IF p_choice NOT IN ('cooperate','loyal') THEN RAISE EXCEPTION 'invalid choice';END IF;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 SELECT profile INTO profile_id FROM igr_private.igr_v108_029_room_variants
 WHERE room_code=r.code AND match_no=match_id;
 IF profile_id NOT IN ('V3','V4','V5') THEN RAISE EXCEPTION 'unavailable';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions x WHERE x.room_code=r.code
 AND x.player_id=a.id AND x.cycle=r.cycle AND x.action_type='cartel029_position')
 THEN RAISE EXCEPTION 'already chosen this cycle';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,a.id,r.cycle,'cartel029_position',jsonb_build_object('choice',p_choice));
 RETURN jsonb_build_object('ok',true,'choice',p_choice);
END $function$
;
