-- Santoro fairness fix: false or unsupported charges cannot decide a player's loss.
-- This overrides only the own-result RPC. No manuscript content stored.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_my_verdict(
 p_code text,p_player_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $mine$
DECLARE r public.igr_v4_rooms%rowtype;
 own public.igr_v4_players%rowtype;
 s igr_private.igr_omerta_room_variant_snapshots%rowtype;
 g igr_private.igr_omerta_verdict_goal_axes%rowtype;
 m jsonb; card jsonb; mid int; events jsonb; result jsonb;
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
 SELECT * INTO g FROM igr_private.igr_omerta_verdict_goal_axes
 WHERE scenario_id=r.scenario_id AND variant_id=s.variant_id
   AND slot=own.internal_slot AND goal_id=card->'verdict_goal'->>'goal_id'
   AND review_status='verified' AND manuscript_md5=s.source_md5;
 IF NOT FOUND THEN
  RETURN jsonb_build_object('available',false,'reason','editorial_goal_axis_pending');END IF;
 -- Never let an accusation alone determine a player's defeat. A separate
 -- private, source-checked actor map must certify actual responsibility
 -- for this act. Pending editorial review means no win/loss is issued.
 IF NOT EXISTS(
  SELECT 1 FROM igr_private.igr_omerta_verdict_truth_actors truth
  WHERE truth.scenario_id=r.scenario_id AND truth.variant_id=s.variant_id
   AND truth.act_axis=g.act_axis AND truth.review_status='verified'
   AND truth.manuscript_md5=s.source_md5
 ) THEN
  RETURN jsonb_build_object('available',false,'reason','editorial_actor_truth_pending');
 END IF;
 -- Never pretend that an Informant's separate two-part goal was resolved
 -- by a formal accusation. That mode requires its own signed data path.
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a
   WHERE a.room_code=r.code AND a.player_id=own.id
     AND a.action_type='omerta_indic_response' AND a.payload->>'accepted'='true'
     AND coalesce((a.payload->>'match_no')::integer,1)=mid)
 THEN RETURN jsonb_build_object('available',false,'reason','informant_separate_goal_pending');END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'playerId',d.suspect_player_id,'matchNo',mid,
  'scenarioVariantId',r.scenario_id||'-'||s.variant_id,
  'goalId',g.goal_id,'confirmed',true,'investigatorAuthorized',true
 )),'[]'::jsonb) INTO events
 FROM igr_private.igr_omerta_verdict_designations d
 WHERE d.room_code=r.code AND d.match_no=mid
 AND d.suspect_player_id=own.id AND d.act_axis=g.act_axis
 AND EXISTS(
  SELECT 1 FROM igr_private.igr_omerta_verdict_truth_actors truth
  WHERE truth.scenario_id=r.scenario_id AND truth.variant_id=s.variant_id
    AND truth.act_axis=g.act_axis AND truth.review_status='verified'
    AND truth.manuscript_md5=s.source_md5
    AND own.internal_slot=ANY(truth.actual_slots)
 );
 result:=igr_private.igr_omerta_score_standalone_goal(
  own.id,mid,jsonb_build_object('mode','avoid_formal_designation',
  'scenario_variant_id',r.scenario_id||'-'||s.variant_id,
  'goal_id',g.goal_id),true,events,'{}'::jsonb);
 RETURN jsonb_build_object('available',true,'result',result,
  'act_axis',g.act_axis,'canonical_goal',card->'verdict_goal'->>'description');
END $mine$;

REVOKE ALL ON FUNCTION public.igr_omerta_standalone_my_verdict(text,uuid)
 FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_standalone_my_verdict(text,uuid)
 TO anon,authenticated;