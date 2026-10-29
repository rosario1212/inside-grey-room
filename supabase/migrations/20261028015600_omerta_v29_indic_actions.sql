-- Santoro informant protocol: signed, same-match, never a self-certified fact.
-- Operations: offer, answer, signal, spoken, protect, review.
CREATE OR REPLACE FUNCTION public.igr_omerta_santoro_indic_action(
 p_code text,p_player_token uuid,p_kind text,
 p_target uuid DEFAULT NULL,p_topic_id text DEFAULT NULL,
 p_value boolean DEFAULT NULL,p_reduction_years integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $action$
DECLARE
 r public.igr_v4_rooms%rowtype;
 actor public.igr_v4_players%rowtype;
 target public.igr_v4_players%rowtype;
 pact igr_private.igr_omerta_v29_indic_pacts%rowtype;
 snap igr_private.igr_omerta_room_variant_snapshots%rowtype;
 topic igr_private.igr_omerta_v29_indic_topics%rowtype;
 mid integer; exists_count int;
BEGIN
 SELECT * INTO actor FROM public.igr_v4_players
 WHERE room_code=upper(btrim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=actor.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN('021','022','023','024','025')
 OR coalesce((r.state->>'omerta_standalone')::boolean,false) IS NOT TRUE
 OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'omerta_santoro_indic_closed';END IF;
 mid:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 SELECT * INTO snap FROM igr_private.igr_omerta_room_variant_snapshots
 WHERE room_code=r.code AND match_no=mid AND scenario_id=r.scenario_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'omerta_snapshot_missing';END IF;
 PERFORM igr_private.rate_limit('omerta_santoro_indic_action',actor.id::text,15,60);
 SELECT * INTO pact FROM igr_private.igr_omerta_v29_indic_pacts
 WHERE room_code=r.code AND match_no=mid FOR UPDATE;

 IF p_kind='offer' THEN
  IF actor.public_role<>'enqueteur' OR r.cycle>2 OR r.phase IN ('locking','reveal')
    OR p_target IS NULL THEN RAISE EXCEPTION 'omerta_indic_offer_closed';END IF;
  IF pact.accepted IS TRUE OR pact.accepted IS NULL AND pact.room_code IS NOT NULL
    THEN RAISE EXCEPTION 'omerta_indic_offer_already_open'; END IF;
  SELECT * INTO target FROM public.igr_v4_players
  WHERE room_code=r.code AND id=p_target AND public_role='suspect';
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_indic_source';END IF;
  SELECT count(*) INTO exists_count FROM igr_private.igr_omerta_v29_indic_topics i
  WHERE i.scenario_id=r.scenario_id AND i.variant_id=snap.variant_id
    AND i.role_slot=target.internal_slot AND i.review_status='verified'
    AND i.source_manuscript_md5=snap.source_md5;
  IF exists_count<>3 THEN RAISE EXCEPTION 'indic_three_canonical_topics_not_approved';END IF;
  INSERT INTO igr_private.igr_omerta_v29_indic_pacts
   (room_code,match_no,investigator_id,source_id)
  VALUES(r.code,mid,actor.id,target.id)
  ON CONFLICT(room_code,match_no) DO UPDATE SET
    investigator_id=excluded.investigator_id,source_id=excluded.source_id,
    accepted=NULL,protected=false,usefulness_final=NULL,reduction_years=0,submitted_at=NULL;
  RETURN jsonb_build_object('ok',true,'status','offered');
 END IF;

 IF pact.room_code IS NULL THEN RAISE EXCEPTION 'indic_not_offered';END IF;

 IF p_kind='answer' THEN
  IF actor.id<>pact.source_id OR pact.accepted IS NOT NULL OR p_value IS NULL
    OR r.phase IN('locking','reveal') THEN RAISE EXCEPTION 'indic_cannot_answer';END IF;
  UPDATE igr_private.igr_omerta_v29_indic_pacts SET accepted=p_value
  WHERE room_code=r.code AND match_no=mid;
  RETURN jsonb_build_object('ok',true,'accepted',p_value);
 END IF;

 IF pact.accepted IS DISTINCT FROM true THEN RAISE EXCEPTION 'indic_not_accepted'; END IF;
 IF p_kind IN('signal','spoken') THEN
  IF actor.id<>pact.source_id OR p_topic_id IS NULL OR r.phase IN('locking','reveal')
    THEN RAISE EXCEPTION 'indic_topic_closed';END IF;
  SELECT * INTO topic FROM igr_private.igr_omerta_v29_indic_topics
  WHERE scenario_id=r.scenario_id AND variant_id=snap.variant_id
    AND role_slot=actor.internal_slot AND topic_id=p_topic_id
    AND review_status='verified' AND source_manuscript_md5=snap.source_md5;
  IF NOT FOUND THEN RAISE EXCEPTION 'indic_topic_not_owned_or_unreviewed';END IF;
  IF p_kind='spoken' THEN
   IF EXISTS(SELECT 1 FROM igr_private.igr_omerta_v29_indic_reports logs
     WHERE logs.room_code=r.code AND logs.match_no=mid
       AND logs.source_id=actor.id AND logs.cycle=r.cycle
       AND logs.told_to_investigator=true AND logs.topic_id<>p_topic_id)
    THEN RAISE EXCEPTION 'indic_one_official_report_per_cycle';END IF;
   INSERT INTO igr_private.igr_omerta_v29_indic_reports
    (room_code,match_no,source_id,topic_id,cycle,intent_only,told_to_investigator)
   VALUES(r.code,mid,actor.id,topic.topic_id,r.cycle,false,true)
   ON CONFLICT(room_code,match_no,topic_id) DO UPDATE
   SET told_to_investigator=true,intent_only=false,cycle=excluded.cycle,reported_at=now();
   RETURN jsonb_build_object('ok',true,'status','reported','canonical_source',true);
  ELSE
   INSERT INTO igr_private.igr_omerta_v29_indic_reports
    (room_code,match_no,source_id,topic_id,cycle,intent_only,told_to_investigator)
   VALUES(r.code,mid,actor.id,topic.topic_id,r.cycle,true,false)
   ON CONFLICT(room_code,match_no,topic_id) DO NOTHING;
   RETURN jsonb_build_object('ok',true,'status','intent_only','counts_for_cooperation',false);
  END IF;
 END IF;

 IF p_kind='protect' THEN
  IF actor.id<>pact.investigator_id OR r.phase IN('locking','reveal')
  THEN RAISE EXCEPTION 'indic_protection_not_authorized';END IF;
  UPDATE igr_private.igr_omerta_v29_indic_pacts SET protected=true
  WHERE room_code=r.code AND match_no=mid;
  RETURN jsonb_build_object('ok',true,'protected',true);
 END IF;

 IF p_kind='review' THEN
  IF actor.id<>pact.investigator_id OR r.cycle<>3
    OR r.phase NOT IN ('cycle_debrief','locking')
    OR p_value IS NULL OR p_reduction_years NOT IN(0,3)
    OR pact.submitted_at IS NOT NULL
  THEN RAISE EXCEPTION 'indic_final_review_closed';END IF;
  UPDATE igr_private.igr_omerta_v29_indic_pacts
  SET usefulness_final=p_value,reduction_years=p_reduction_years,submitted_at=now()
  WHERE room_code=r.code AND match_no=mid;
  RETURN jsonb_build_object('ok',true,'final_review_recorded',true);
 END IF;
 RAISE EXCEPTION 'invalid_indic_action';
END $action$;
REVOKE ALL ON FUNCTION public.igr_omerta_santoro_indic_action(text,uuid,text,uuid,text,boolean,integer)
 FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_santoro_indic_action(text,uuid,text,uuid,text,boolean,integer)
 TO anon,authenticated;
