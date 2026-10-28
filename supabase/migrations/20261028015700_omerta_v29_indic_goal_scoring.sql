-- Signed Santoro Indic condition integrated with exact V29 personal verdict.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_my_verdict(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;
 own public.igr_v4_players%rowtype;
 s igr_private.igr_omerta_room_variant_snapshots%rowtype;
 g igr_private.igr_omerta_v29_precise_act_review%rowtype;
 m jsonb; card jsonb; mid int; events jsonb; result jsonb;
 pact igr_private.igr_omerta_v29_indic_pacts%rowtype;
 intel_verified boolean; survived boolean; intel_events jsonb; investigator_reviews jsonb;
BEGIN
 SELECT * INTO own FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=own.room_code;
 IF NOT FOUND OR r.scenario_id NOT IN ('021','022','023','024','025')
  OR coalesce((r.state->>'omerta_standalone')::boolean,false) IS NOT TRUE
 THEN RAISE EXCEPTION 'not_santoro_standalone';END IF;
 mid:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 IF r.status<>'finished' OR NOT EXISTS(
  SELECT 1 FROM igr_private.igr_omerta_verdict_locks
  WHERE room_code=r.code AND match_no=mid)
 THEN RETURN jsonb_build_object('available',false,'reason','verdict_not_locked');END IF;
 IF own.public_role<>'suspect' THEN
  RETURN jsonb_build_object('available',false,'reason','investigator_no_private_goal');END IF;
 SELECT * INTO s FROM igr_private.igr_omerta_room_variant_snapshots
 WHERE room_code=r.code AND match_no=mid AND scenario_id=r.scenario_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'snapshot_missing';END IF;
 SELECT value INTO card FROM pg_catalog.jsonb_array_elements(s.manuscript->'private_cards') value
 WHERE (value->>'slot')::integer=own.internal_slot LIMIT 1;
 IF card IS NULL THEN RAISE EXCEPTION 'own_role_missing';END IF;
 SELECT * INTO g FROM igr_private.igr_omerta_v29_precise_act_review
 WHERE scenario_id=r.scenario_id AND variant_id=s.variant_id
   AND slot=own.internal_slot AND goal_id=card->'verdict_goal'->>'goal_id'
   AND review_status='verified' AND source_manuscript_md5=s.source_md5;
 IF NOT FOUND THEN
  RETURN jsonb_build_object('available',false,'reason','editorial_goal_axis_pending');END IF;
 -- Never let an accusation alone determine a player's defeat. A separate
 -- private, source-checked actor map must certify actual responsibility
 -- for this act. Pending editorial review means no win/loss is issued.
 IF (cardinality(g.actual_actor_slots)>0 AND jsonb_array_length(g.evidence_ids)<>2)
    OR (cardinality(g.actual_actor_slots)=0 AND jsonb_array_length(g.evidence_ids)<>0)
 THEN
  RETURN jsonb_build_object('available',false,'reason','editorial_actor_truth_pending');
 END IF;
 -- Santoro's Indic has a signed and match-specific goal, independent of
 -- the accusation that would normally affect this character.
 SELECT * INTO pact FROM igr_private.igr_omerta_v29_indic_pacts
 WHERE room_code=r.code AND match_no=mid AND source_id=own.id AND accepted=true;
 IF FOUND THEN
  SELECT EXISTS(
   SELECT 1 FROM igr_private.igr_omerta_v29_indic_reports log
   JOIN igr_private.igr_omerta_v29_indic_topics topic
     ON topic.topic_id=log.topic_id
     AND topic.scenario_id=r.scenario_id AND topic.variant_id=s.variant_id
   WHERE log.room_code=r.code AND log.match_no=mid
    AND log.source_id=own.id AND log.told_to_investigator=true
    AND topic.role_slot=own.internal_slot
    AND topic.review_status='verified'
    AND topic.source_manuscript_md5=s.source_md5
  ) INTO intel_verified;
  survived:=NOT coalesce((r.state->'omerta'->'dead') ? own.id::text,false);
  intel_events:=CASE WHEN intel_verified THEN
    jsonb_build_array(jsonb_build_object(
      'playerId',own.id,'matchNo',mid,
      'scenarioVariantId',r.scenario_id||'-'||s.variant_id,
      'truthVerified',true,'transmittedToInvestigation',true,
      'nonpublicWhenSent',true))
    ELSE '[]'::jsonb END;
  investigator_reviews:=CASE WHEN pact.submitted_at IS NOT NULL
    AND pact.usefulness_final IS TRUE
    AND EXISTS(SELECT 1 FROM public.igr_v4_players investigator
      WHERE investigator.id=pact.investigator_id
        AND investigator.room_code=r.code
        AND investigator.public_role='enqueteur')
    THEN jsonb_build_array(jsonb_build_object(
      'playerId',own.id,'matchNo',mid,
      'scenarioVariantId',r.scenario_id||'-'||s.variant_id,
      'investigatorAuthorized',true,'confirmed',true,'useful',true))
    ELSE '[]'::jsonb END;
  result:=igr_private.igr_omerta_score_standalone_goal(
    own.id,mid,jsonb_build_object('mode','avoid_formal_designation',
       'scenario_variant_id',r.scenario_id||'-'||s.variant_id,
       'goal_id',g.goal_id),true,'[]'::jsonb,
    jsonb_build_object('accepted',true,'survived',survived,
      'protectedByOfficialPact',pact.protected,
      'formalReductionYears',pact.reduction_years,
      'intelEvents',intel_events,'investigatorAssessments',investigator_reviews));
  RETURN jsonb_build_object('available',true,'result',result,
    'is_informant',true,'personal_condition',
      'Survivre et obtenir une protection ou une remise de peine d’au moins trois ans',
    'information_condition','Avoir donné une information vérifiée ou été jugé utile par l’Enquêteur');
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'playerId',d.suspect_player_id,'matchNo',mid,
  'scenarioVariantId',r.scenario_id||'-'||s.variant_id,
  'goalId',g.goal_id,'confirmed',true,'investigatorAuthorized',true
 )),'[]'::jsonb) INTO events
 FROM igr_private.igr_omerta_verdict_designations d
 WHERE d.room_code=r.code AND d.match_no=mid
 AND d.suspect_player_id=own.id AND d.act_axis=g.act_code
 AND own.internal_slot=ANY(g.actual_actor_slots);
 result:=igr_private.igr_omerta_score_standalone_goal(
  own.id,mid,jsonb_build_object('mode','avoid_formal_designation',
  'scenario_variant_id',r.scenario_id||'-'||s.variant_id,
  'goal_id',g.goal_id),true,events,'{}'::jsonb);
 RETURN jsonb_build_object('available',true,'result',result,
  'act_axis',g.act_code,'act_label',g.public_act_label,'canonical_goal',card->'verdict_goal'->>'description');
END $function$
;
REVOKE ALL ON FUNCTION public.igr_omerta_standalone_my_verdict(text,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_standalone_my_verdict(text,uuid) TO anon,authenticated;