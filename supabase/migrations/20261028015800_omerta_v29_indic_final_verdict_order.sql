-- Santoro: a recruited Indic cannot be left with an unassessed final objective.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_lock_verdict(p_code text, p_player_token uuid, p_designations jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;
 inv public.igr_v4_players%rowtype;
 target public.igr_v4_players%rowtype;
 manuscript jsonb; mid integer; variant text;
 e jsonb; ids jsonb; proofids jsonb; n int:=0; suspects int;
BEGIN
 SELECT * INTO inv FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role='enqueteur';
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=inv.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('021','022','023','024','025')
  OR r.status<>'playing' OR r.cycle<>3 OR r.phase<>'locking'
  OR coalesce((r.state->>'omerta_standalone')::boolean,false) IS NOT TRUE
 THEN RAISE EXCEPTION 'omerta_verdict_not_open';END IF;
 IF jsonb_typeof(p_designations) IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'invalid_designation_list';END IF;
 mid:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 SELECT s.manuscript,s.variant_id INTO manuscript,variant
 FROM igr_private.igr_omerta_room_variant_snapshots s
 WHERE s.room_code=r.code AND s.match_no=mid AND s.scenario_id=r.scenario_id;
 IF manuscript IS NULL THEN RAISE EXCEPTION 'omerta_snapshot_missing'; END IF;
 -- The Investigator must record the source's final usefulness and possible
 -- official 3-year benefit before a Santoro verdict is sealed.
 IF EXISTS(SELECT 1 FROM igr_private.igr_omerta_v29_indic_pacts pact
   WHERE pact.room_code=r.code AND pact.match_no=mid AND pact.accepted=true
    AND pact.submitted_at IS NULL)
 THEN RAISE EXCEPTION 'indic_final_review_required';END IF;
 SELECT count(*) INTO suspects FROM public.igr_v4_players
 WHERE room_code=r.code AND public_role='suspect';
 IF jsonb_array_length(p_designations)>suspects
 THEN RAISE EXCEPTION 'too_many_designations';END IF;
 IF EXISTS(SELECT 1 FROM igr_private.igr_omerta_verdict_locks
  WHERE room_code=r.code AND match_no=mid)
 THEN RAISE EXCEPTION 'verdict_already_locked'; END IF;
 SELECT c3.value->'editorial_provenance'->'existing_events' INTO proofids
 FROM pg_catalog.jsonb_array_elements(
 coalesce(manuscript->'revelations','[]'::jsonb)) c3(value)
 WHERE c3.value->>'kind'='guaranteed' AND c3.value->>'min_cycle'='3'
 LIMIT 1;
 IF jsonb_typeof(proofids) IS DISTINCT FROM 'array'
  OR jsonb_array_length(proofids)<2
 THEN RAISE EXCEPTION 'omerta_c3_proof_unavailable';END IF;
 PERFORM igr_private.rate_limit('omerta_santoro_verdict',inv.id::text,3,60);
 INSERT INTO igr_private.igr_omerta_verdict_locks
 (room_code,match_no,investigator_player_id,variant_id)
 VALUES(r.code,mid,inv.id,variant);
 FOR e IN SELECT value FROM pg_catalog.jsonb_array_elements(p_designations) value
 LOOP
  IF jsonb_typeof(e)<>'object'
   OR jsonb_typeof(e->'evidence_ids') IS DISTINCT FROM 'array'
   OR jsonb_array_length(e->'evidence_ids')<>2
   OR (SELECT count(distinct value) FROM pg_catalog.jsonb_array_elements_text(e->'evidence_ids'))<>2
   OR (SELECT count(*) FROM pg_catalog.jsonb_object_keys(e) k)<>3
   OR NOT(e ?& array['player_id','act_axis','evidence_ids'])
  THEN RAISE EXCEPTION 'omerta_invalid_designation';END IF;
  SELECT * INTO target FROM public.igr_v4_players p
  WHERE p.room_code=r.code AND p.id=(e->>'player_id')::uuid
    AND p.public_role='suspect';
  IF NOT FOUND OR NOT EXISTS(
    SELECT 1 FROM igr_private.igr_omerta_v29_precise_act_review g
    WHERE g.scenario_id=r.scenario_id AND g.variant_id=variant
      AND g.act_code=e->>'act_axis' AND g.review_status='verified'
      AND g.source_manuscript_md5=(SELECT source_md5 FROM igr_private.igr_omerta_room_variant_snapshots
        WHERE room_code=r.code AND match_no=mid)
      AND jsonb_array_length(g.evidence_ids)=2
      AND g.evidence_ids @> (e->'evidence_ids')
      AND (e->'evidence_ids') @> g.evidence_ids
  )
  THEN RAISE EXCEPTION 'omerta_designation_unfounded_or_wrong_target';END IF;
  INSERT INTO igr_private.igr_omerta_verdict_designations
    (room_code,match_no,suspect_player_id,act_axis,evidence_ids)
  VALUES (r.code,mid,target.id,e->>'act_axis',e->'evidence_ids');
  n:=n+1;
 END LOOP;
 -- All validation above is transactional; a duplicate/wrong target rolls
 -- back the *whole* final verdict and cannot lock half the suspects.
 UPDATE public.igr_v4_rooms
 SET status='finished',phase='reveal',phase_started_at=now(),
     phase_ends_at=null,
     state=jsonb_set(coalesce(state,'{}'::jsonb),
       '{omerta_standalone_verdict_locked}',to_jsonb(mid),true),
     updated_at=now()
 WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,cycle,event_type,visibility,payload)
 VALUES(r.code,3,'omerta_standalone_verdict_sealed','public',
 jsonb_build_object('match_no',mid,'title','Verdict enregistré',
 'text','La conclusion du dossier peut être consultée. Les objectifs privés restent confidentiels.'));
 RETURN jsonb_build_object('ok',true,'finished',true,
 'designations_recorded',n,'match_no',mid);
END $function$
;
REVOKE ALL ON FUNCTION public.igr_omerta_standalone_lock_verdict(text,uuid,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_standalone_lock_verdict(text,uuid,jsonb) TO anon,authenticated;