-- Enforce the editorial angle only for 029, preserving other dossiers.
CREATE OR REPLACE FUNCTION public.igr_v4_lock_final(p_code text, p_player_token uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 levels jsonb;note_text text;st jsonb;is_029 boolean;
BEGIN
 PERFORM igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR NOT (public.igr_v52_investigation_role(p.public_role) OR p.public_role='journaliste')
 THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF r.phase<>'locking' OR NOT coalesce((r.state->>'v52_final_reassessment')::boolean,false)
 THEN RAISE EXCEPTION 'wrong phase'; END IF;
 is_029:=r.scenario_id='029' AND coalesce((r.state->>'cartel029_ready')::boolean,false)
       AND igr_private.igr_v108_029_is_enabled();
 IF exists(SELECT 1 FROM public.igr_v4_actions WHERE room_code=r.code AND player_id=p.id AND action_type='final_lock')
 THEN RAISE EXCEPTION 'already locked'; END IF;
 IF coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text
 THEN RAISE EXCEPTION 'player marked absent'; END IF;
 IF is_029 THEN
   -- No fabricated responsibility levels for four witnesses; the report decides.
   -- Unsubmitted reports count as incomplete, never a permanent lockout.
   levels:='{}'::jsonb;
 ELSIF p.public_role<>'journaliste' THEN
   levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');
 ELSE levels:='{}'::jsonb; END IF;
 note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 IF p.public_role='journaliste' AND length(note_text)<(CASE WHEN is_029 THEN 24 ELSE 8 END) THEN RAISE EXCEPTION 'journalist final angle too short';END IF;
 IF note_text<>'' THEN PERFORM igr_private.assert_ugc(note_text,300,false);END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version',case when is_029 then '029-v148' else 'v52' end));
 st:=public.igr_v52_maybe_finish(r.code);
 RETURN jsonb_build_object('ok',true)||st;
END $function$;
