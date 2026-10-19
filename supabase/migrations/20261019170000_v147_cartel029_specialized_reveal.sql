-- Mirrors the verified, scoped 029 outcome migration already applied to Supabase.
CREATE OR REPLACE FUNCTION public.igr_v52_maybe_finish(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;
 req int;got int;vr int:=0;vg int:=0;terror_ok boolean:=true;reveal jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p_room FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('finished',false); END IF;
 IF r.phase<>'locking' OR NOT coalesce((r.state->>'v52_final_reassessment')::boolean,false)
 THEN RETURN jsonb_build_object('finished',false); END IF;
 IF r.status='finished' THEN RETURN jsonb_build_object('finished',true); END IF;
 SELECT count(*) INTO req FROM public.igr_v4_players
 WHERE room_code=p_room AND (public.igr_v52_investigation_role(public_role) OR public_role='journaliste')
 AND NOT (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text);
 SELECT count(DISTINCT a.player_id) INTO got FROM public.igr_v4_actions a
 JOIN public.igr_v4_players p ON p.id=a.player_id
 WHERE a.room_code=p_room AND a.action_type='final_lock'
 AND (public.igr_v52_investigation_role(p.public_role) OR p.public_role='journaliste')
 AND NOT (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text);
 IF r.scenario_id<>'029' AND public.igr_v44_judge_present(p_room) THEN
  SELECT count(*) INTO vr FROM public.igr_v4_players WHERE room_code=p_room
  AND public_role IN ('enqueteur','analyste','procureur')
  AND NOT(coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text);
  SELECT count(DISTINCT a.player_id) INTO vg FROM public.igr_v4_actions a
  JOIN public.igr_v4_players p ON p.id=a.player_id
  WHERE a.room_code=p_room AND a.action_type='judge_integrity_vote'
  AND p.public_role IN ('enqueteur','analyste','procureur')
  AND NOT(coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text);
 END IF;
 IF r.scenario_id='027' THEN
  terror_ok:=nullif(r.state #>> '{terror_runtime,decision}','') IS NOT NULL
   OR NOT exists(SELECT 1 FROM public.igr_v4_players p WHERE p.room_code=p_room
     AND p.public_role='inspecteur' AND NOT(coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text));
 END IF;
 UPDATE public.igr_v4_rooms SET state=jsonb_set(jsonb_set(jsonb_set(state,
  '{v52_locks_received}',to_jsonb(got),true),
  '{v52_integrity_received}',to_jsonb(vg),true),
  '{v52_locks_required}',to_jsonb(req),true),updated_at=now() WHERE code=p_room;
 UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{v59_pending}',
  coalesce((SELECT jsonb_agg(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role)
    ORDER BY p.seat_index) FROM public.igr_v4_players p WHERE p.room_code=p_room
    AND NOT(coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text)
    AND (((public.igr_v52_investigation_role(p.public_role) OR p.public_role='journaliste')
      AND NOT exists(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=p_room AND a.player_id=p.id AND a.action_type='final_lock'))
     OR (r.scenario_id<>'029' AND public.igr_v44_judge_present(p_room)
       AND p.public_role IN ('enqueteur','analyste','procureur')
       AND NOT exists(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=p_room AND a.player_id=p.id AND a.action_type='judge_integrity_vote'))
     OR (r.scenario_id='027' AND p.public_role='inspecteur'
         AND nullif(r.state#>>'{terror_runtime,decision}','') IS NULL))),
   '[]'::jsonb),true) WHERE code=p_room;
 IF got<req OR vg<vr OR NOT terror_ok THEN
  RETURN jsonb_build_object('finished',false,'locked',got,'required',req,'votes',vg,'votes_required',vr,'terror_ok',terror_ok);
 END IF;
 IF r.scenario_id='029' AND coalesce((r.state->>'cartel029_ready')::boolean,false)
   AND igr_private.igr_v108_029_is_enabled() THEN
    reveal:=igr_private.igr_v120_029_make_reveal(p_room);
 ELSE
    reveal:=public.igr_v52_make_reveal(p_room);
 END IF;
 UPDATE public.igr_v4_rooms SET status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() WHERE code=p_room;
 PERFORM public.igr_v4_init_continuation(p_room,reveal);
 PERFORM public.igr_v44_fix_continuation(p_room,reveal);
 INSERT INTO public.igr_v4_events(room_code,event_type,payload) VALUES(p_room,'reveal',reveal);
 RETURN jsonb_build_object('finished',true,'locked',got,'required',req);
END $function$
;
