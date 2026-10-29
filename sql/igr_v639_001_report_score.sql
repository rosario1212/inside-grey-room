-- Dossier 001: additional report score, applied exclusively during final reveal.
-- Existing games without the new intent field keep 3 reconstruction axes.
-- Canonical truth comes from the room-pinned private manuscript, never a client answer.
CREATE OR REPLACE FUNCTION igr_private.igr_v639_001_report_score(p_room text, p_reveal jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $igr_v639$
DECLARE
  canonical jsonb;
  submitted jsonb;
  camp jsonb;
  score_exact integer;
  score_total integer;
  rec_exact integer:=0;
  rec_total integer:=3;
  level_exact integer;
  level_total integer;
  adjust_points integer;
  result_pct integer;
  canonical_intent text;
  stated_intent text;
BEGIN
  SELECT (igr_private.igr_v181_001_pinned_game_pack(r.code)->'truth'->'reconstruction_001')
    INTO canonical
    FROM public.igr_v4_rooms r
    WHERE r.code=upper(trim(p_room)) AND r.scenario_id='001';
  IF canonical IS NULL OR coalesce(canonical->>'gesture','') NOT IN
    ('s1_intentional','s2_intentional','s3_accident') THEN
    RETURN p_reveal; -- Preserve historical/non-pinned rooms.
  END IF;

  SELECT a.payload->'reconstruction_001' INTO submitted
    FROM public.igr_v4_actions a
    JOIN public.igr_v4_players p ON p.id=a.player_id
    WHERE a.room_code=upper(trim(p_room))
      AND a.action_type='final_lock'
      AND p.public_role IN ('enqueteur','analyste')
    ORDER BY CASE WHEN p.public_role='enqueteur' THEN 0 ELSE 1 END,a.id DESC
    LIMIT 1;
  IF submitted IS NULL OR jsonb_typeof(submitted)<>'object'
     OR coalesce(submitted->>'intent','') NOT IN ('voluntary_act','involuntary_act','undetermined') THEN
    RETURN p_reveal; -- Old/ongoing rooms: do not change an existing final score.
  END IF;

  camp:=coalesce(p_reveal->'camp_investigation','{}'::jsonb);
  level_exact:=coalesce((camp->>'exact')::integer,0);
  level_total:=coalesce((camp->>'total')::integer,0);
  IF level_total=0 THEN RETURN p_reveal; END IF;

  rec_exact:=(CASE WHEN submitted->>'moment'=canonical->>'moment' THEN 1 ELSE 0 END)
            +(CASE WHEN submitted->>'gesture'=canonical->>'gesture' THEN 1 ELSE 0 END)
            +(CASE WHEN submitted->>'reframe'=canonical->>'reframe' THEN 1 ELSE 0 END);
  canonical_intent:=CASE WHEN canonical->>'gesture'='s3_accident'
    THEN 'involuntary_act' ELSE 'voluntary_act' END;
  stated_intent:=submitted->>'intent';
  rec_total:=4;
  rec_exact:=rec_exact+CASE WHEN stated_intent=canonical_intent THEN 1 ELSE 0 END;

  score_exact:=level_exact+rec_exact;
  score_total:=level_total+rec_total;
  result_pct:=round(100.0*score_exact/score_total)::integer;
  adjust_points:=coalesce((camp->>'score_adjustment')::integer,0);
  camp:=camp||jsonb_build_object(
    'responsibility_score_percent',coalesce((camp->>'base_score_percent')::integer,0),
    'reconstruction_score_exact',rec_exact,
    'reconstruction_score_total',rec_total,
    'reconstruction_intent_correct',CASE WHEN rec_total=4 THEN (stated_intent=canonical_intent) ELSE NULL END,
    'report_score_exact',score_exact,
    'report_score_total',score_total,
    'report_score_percent',result_pct,
    'base_score_percent',result_pct,
    'score_percent',greatest(0,least(100,result_pct+adjust_points))
  );
  RETURN jsonb_set(p_reveal,'{camp_investigation}',camp,true);
END
$igr_v639$;
REVOKE ALL ON FUNCTION igr_private.igr_v639_001_report_score(text,jsonb) FROM PUBLIC;

-- Insert the score overlay only after the existing verdict/reveal pipeline.
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
 -- Santoro has its own authenticated, act-scoped verdict; the generic
 -- final-reassessment path must never compute a Verri or V52 answer for it.
 IF coalesce((r.state->>'omerta_standalone')::boolean,false) THEN
  RETURN jsonb_build_object('finished',false,
   'reason','omerta_signed_verdict_required');
 END IF;
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
    IF r.scenario_id='001' THEN
      reveal:=igr_private.igr_v639_001_report_score(p_room,reveal);
    END IF;
 END IF;
 UPDATE public.igr_v4_rooms SET status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() WHERE code=p_room;
 PERFORM public.igr_v4_init_continuation(p_room,reveal);
 PERFORM public.igr_v44_fix_continuation(p_room,reveal);
 INSERT INTO public.igr_v4_events(room_code,event_type,payload) VALUES(p_room,'reveal',reveal);
 RETURN jsonb_build_object('finished',true,'locked',got,'required',req);
END $function$
;
