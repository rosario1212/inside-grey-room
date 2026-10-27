-- Omertà Santoro 021–025: a sealed, signed verdict per act.
-- No narrative/private cards are stored in this public migration.
-- Goal-to-act editorial mapping is private in Supabase and remains in review.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_verdict_locks (
 room_code text not null,
 match_no integer not null check (match_no>0),
 investigator_player_id uuid not null,
 variant_id text not null check (variant_id in ('A','B','C')),
 submitted_at timestamptz not null default now(),
 PRIMARY KEY(room_code,match_no)
);
ALTER TABLE igr_private.igr_omerta_verdict_locks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_omerta_verdict_locks FROM public,anon,authenticated;

CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_verdict_designations (
 room_code text not null,
 match_no integer not null,
 suspect_player_id uuid not null,
 act_axis text not null,
 evidence_ids jsonb not null check (jsonb_typeof(evidence_ids)='array'),
 PRIMARY KEY(room_code,match_no,suspect_player_id),
 FOREIGN KEY(room_code,match_no)
 REFERENCES igr_private.igr_omerta_verdict_locks(room_code,match_no)
 ON DELETE CASCADE
);
ALTER TABLE igr_private.igr_omerta_verdict_designations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_omerta_verdict_designations FROM public,anon,authenticated;

-- No hidden goal wording, character names, truth-by-axis values or
-- answer key are given to the investigator before a verdict.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_verdict_options(
 p_code text,p_player_token uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $options$
DECLARE r public.igr_v4_rooms%rowtype;
 inv public.igr_v4_players%rowtype;
 m jsonb; mid integer; acts jsonb; suspects jsonb; proof jsonb;
BEGIN
 SELECT * INTO inv FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role='enqueteur';
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=inv.room_code;
 IF NOT FOUND OR r.scenario_id not in ('021','022','023','024','025')
 OR r.status<>'playing' OR r.cycle<>3 OR r.phase<>'locking'
 OR coalesce((r.state->>'omerta_standalone')::boolean,false) IS NOT TRUE
 THEN RAISE EXCEPTION 'omerta_verdict_not_open';END IF;
 mid:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 SELECT manuscript INTO m FROM igr_private.igr_omerta_room_variant_snapshots
 WHERE room_code=r.code AND match_no=mid AND scenario_id=r.scenario_id;
 IF m IS NULL THEN RAISE EXCEPTION 'omerta_snapshot_missing';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('code',axis.key) ORDER BY axis.key),'[]'::jsonb)
 INTO acts FROM pg_catalog.jsonb_object_keys(m->'canonical_truth'->'responsibility_by_act') axis(key);
 SELECT coalesce(jsonb_agg(jsonb_build_object('player_id',id,'pseudo',pseudo) ORDER BY seat_index),'[]'::jsonb)
 INTO suspects FROM public.igr_v4_players WHERE room_code=r.code AND public_role='suspect';
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',event->>'id',
 'description',event->>'what','origin',event->>'origin') ORDER BY event->>'id'),'[]'::jsonb)
 INTO proof FROM pg_catalog.jsonb_array_elements(
  coalesce(m->'canonical_truth'->'timeline','[]'::jsonb)) event;
 RETURN jsonb_build_object('available',true,'suspects',suspects,'acts',acts,
  'evidence',proof,'single_submission',true,'max_designations',jsonb_array_length(suspects));
END $options$;
REVOKE ALL ON FUNCTION public.igr_omerta_standalone_verdict_options(text,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_standalone_verdict_options(text,uuid) TO anon,authenticated;

-- This is a formal allegation, not an automatic declaration of guilt.
-- Two independent, canonical C3 records are required for each named target.
-- A goal's success/failure cannot be certified while its private mapping
-- remains in the editorial review state.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_lock_verdict(
 p_code text,p_player_token uuid,p_designations jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $verdict$
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
 SELECT count(*) INTO suspects FROM public.igr_v4_players
 WHERE room_code=r.code AND public_role='suspect';
 IF jsonb_array_length(p_designations)>suspects
 THEN RAISE EXCEPTION 'too_many_designations';END IF;
 IF EXISTS(SELECT 1 FROM igr_private.igr_omerta_verdict_locks
  WHERE room_code=r.code AND match_no=mid)
 THEN RAISE EXCEPTION 'verdict_already_locked'; END IF;
 SELECT e->'editorial_provenance'->'existing_events' INTO proofids
 FROM pg_catalog.jsonb_array_elements(
 coalesce(manuscript->'revelations','[]'::jsonb)) e
 WHERE e->>'kind'='guaranteed' AND e->>'min_cycle'='3'
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
  IF NOT FOUND OR NOT(manuscript->'canonical_truth'->'responsibility_by_act' ? (e->>'act_axis'))
  OR EXISTS(
    SELECT 1 FROM pg_catalog.jsonb_array_elements_text(e->'evidence_ids') cited
    WHERE NOT (proofids ? cited.value))
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
END $verdict$;
REVOKE ALL ON FUNCTION public.igr_omerta_standalone_lock_verdict(text,uuid,jsonb)
 FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_standalone_lock_verdict(text,uuid,jsonb)
 TO anon,authenticated;

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
 AND d.suspect_player_id=own.id AND d.act_axis=g.act_axis;
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
