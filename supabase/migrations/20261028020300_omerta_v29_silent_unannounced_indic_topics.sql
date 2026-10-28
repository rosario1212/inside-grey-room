-- Santoro: do not leak an unannounced topic title to the investigator.
CREATE OR REPLACE FUNCTION public.igr_omerta_santoro_indic_status(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
 pact igr_private.igr_omerta_v29_indic_pacts%rowtype;
 s igr_private.igr_omerta_room_variant_snapshots%rowtype;
 topics jsonb:='[]'::jsonb; mid int;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(btrim(p_code))
 AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF NOT FOUND OR r.scenario_id NOT IN('021','022','023','024','025')
 OR coalesce((r.state->>'omerta_standalone')::boolean,false) IS NOT TRUE
 THEN RETURN jsonb_build_object('available',false);END IF;
 mid:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 SELECT * INTO s FROM igr_private.igr_omerta_room_variant_snapshots
 WHERE room_code=r.code AND match_no=mid AND scenario_id=r.scenario_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'standalone_snapshot_missing';END IF;
 SELECT * INTO pact FROM igr_private.igr_omerta_v29_indic_pacts
 WHERE room_code=r.code AND match_no=mid;
 IF NOT FOUND THEN
  RETURN jsonb_build_object('available',true,'offered',false,
   'can_offer',p.public_role='enqueteur' AND r.status='playing' AND r.cycle BETWEEN 1 AND 2);
 END IF;
 IF p.id<>pact.source_id AND p.id<>pact.investigator_id THEN
  RETURN jsonb_build_object('available',true,'offered',false);
 END IF;
 IF p.id=pact.source_id AND pact.accepted IS TRUE THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id',i.topic_id,'title',i.topic_title,'detail',i.topic_text,
    'signaled',coalesce(report.intent_only,false),
    'logged',coalesce(report.told_to_investigator,false)
  ) ORDER BY i.topic_slot),'[]'::jsonb) INTO topics
  FROM igr_private.igr_omerta_v29_indic_topics i
  LEFT JOIN igr_private.igr_omerta_v29_indic_reports report
    ON report.room_code=r.code AND report.match_no=mid AND report.topic_id=i.topic_id
  WHERE i.scenario_id=r.scenario_id AND i.variant_id=s.variant_id
   AND i.role_slot=p.internal_slot AND i.review_status='verified'
   AND i.source_manuscript_md5=s.source_md5;
 ELSIF p.id=pact.investigator_id AND pact.accepted IS TRUE THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'title',i.topic_title,'signaled',coalesce(report.intent_only,false),
    'logged',coalesce(report.told_to_investigator,false)
  ) ORDER BY i.topic_slot),'[]'::jsonb) INTO topics
  FROM igr_private.igr_omerta_v29_indic_topics i
  LEFT JOIN igr_private.igr_omerta_v29_indic_reports report
    ON report.room_code=r.code AND report.match_no=mid AND report.topic_id=i.topic_id
  JOIN public.igr_v4_players source
    ON source.id=pact.source_id AND source.room_code=r.code AND source.internal_slot=i.role_slot
  WHERE i.scenario_id=r.scenario_id AND i.variant_id=s.variant_id
    AND i.review_status='verified' AND i.source_manuscript_md5=s.source_md5
    AND (coalesce(report.intent_only,false) OR coalesce(report.told_to_investigator,false));
 END IF;
 RETURN jsonb_build_object('available',true,'offered',true,
  'is_source',p.id=pact.source_id,'is_investigator',p.id=pact.investigator_id,
  'source_id',pact.source_id,'accepted',pact.accepted,
  'protected',pact.protected,'final_review_recorded',pact.submitted_at IS NOT NULL,
  'topics',topics);
END $function$
;
REVOKE ALL ON FUNCTION public.igr_omerta_santoro_indic_status(text,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_santoro_indic_status(text,uuid) TO anon,authenticated;