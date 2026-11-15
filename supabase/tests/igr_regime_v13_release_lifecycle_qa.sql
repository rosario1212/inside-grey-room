-- LE RÉGIME v13: real legacy-start lifecycle test, to be executed in BEGIN/ROLLBACK
-- AFTER the 3 v13 private candidates + lifecycle patch. Never run unwrapped.
UPDATE igr_private.igr_v99_variant_manuscripts
SET editorial_status='ready',approved_by='QA_TRANSACTION_ROLLBACK_ONLY',
 approved_at=now(),
 manuscript=jsonb_set(jsonb_set(manuscript,'{regime_vnext,status}',
  to_jsonb('ready'::text),true),'{regime_vnext,human_review_approved}','true'::jsonb,true)
WHERE scenario_id IN ('032','033','034') AND variant_id IN ('A','B','C')
AND editorial_status='review';
UPDATE igr_private.igr_regime_v13_release SET
 enabled=true,approved_by='QA_TRANSACTION_ROLLBACK_ONLY',approved_at=now()
WHERE release_key='regime';
DO $lifecycle$
DECLARE
 host uuid;investigator uuid;judge uuid;third uuid;enq_id uuid;
 result jsonb; rstate jsonb; card jsonb;mission jsonb;
 pack jsonb;clue_ids jsonb;answers jsonb='[]'::jsonb;act jsonb;
 eids jsonb;published_count integer;v boolean;reveal jsonb;
 votes jsonb='{}'::jsonb;p public.igr_v4_players%rowtype;
BEGIN
 IF NOT igr_private.igr_regime_v13_release_eligible() THEN
   RAISE EXCEPTION 'QA temporary release flag inactive';END IF;
 IF public.igr_v4_min_players('034')<>6 OR public.igr_v4_role_for_seat('034',2,6)<>'juge'
   OR public.igr_v4_role_for_seat('032',2,6)<>'juge' THEN
   RAISE EXCEPTION 'old lobby roster still active'; END IF;
 INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
 VALUES('QA13LIFE','034','lobby',0,'lobby') RETURNING host_token INTO host;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,preferred_role,is_host)
 VALUES
 ('QA13LIFE','Enquêteur QA',0,'en_attente','enqueteur',true),
 ('QA13LIFE','Analyste QA',1,'en_attente','analyste',false),
 ('QA13LIFE','Juge QA',2,'en_attente','juge',false),
 ('QA13LIFE','Suspect 1 QA',3,'en_attente','suspect',false),
 ('QA13LIFE','Suspect 2 QA',4,'en_attente','suspect',false),
 ('QA13LIFE','Suspect 3 QA',5,'en_attente','suspect',false);
 -- Pin exactly variant A for this deterministic rollback-only lifecycle test.
 INSERT INTO igr_private.igr_regime_v13_rooms(
   room_code,scenario_id,variant_id,private_pack,play_state)
 SELECT 'QA13LIFE','034','A',manuscript->'regime_vnext',
 jsonb_build_object('alliance','{}'::jsonb,'decisions','[]'::jsonb,
 'investigations','[]'::jsonb,'disclosed','[]'::jsonb,'arrests','{}'::jsonb,
 'mandates','[]'::jsonb,'reconstructions','{}'::jsonb,
 'third','{}'::jsonb,'court','{}'::jsonb,'events','[]'::jsonb)
 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='034' AND variant_id='A';
 result:=public.igr_v4_start_game('QA13LIFE',host);
 IF result->>'ok'<>'true' THEN RAISE EXCEPTION 'legacy game failed to start';END IF;
 SELECT state INTO rstate FROM public.igr_v4_rooms WHERE code='QA13LIFE';
 IF coalesce((rstate->>'regime_v13_active')::boolean,false)<>true THEN
   RAISE EXCEPTION 'v13 activation marker not present';END IF;
 SELECT private_pack INTO pack FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13LIFE';
 IF pack->>'scenarioId'<>'034' THEN RAISE EXCEPTION 'private variant not pinned';END IF;
 SELECT private_state INTO card FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='suspect' AND internal_slot=1;
 IF card->>'actor_id'<>'fallen_president' THEN RAISE EXCEPTION 'old president card accidentally used';END IF;
 SELECT player_token,id INTO investigator,enq_id FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='juge';
 SELECT player_token INTO third FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='suspect' AND internal_slot=3;
 SELECT jsonb_build_object('levels','{}'::jsonb) INTO result;
 UPDATE public.igr_v4_rooms SET cycle=1,phase='role_reading'
 WHERE code='QA13LIFE';
 PERFORM public.igr_v4_emit_trame('QA13LIFE');
 PERFORM public.igr_v4_emit_trame('QA13LIFE');
 SELECT count(*) INTO published_count FROM public.igr_v4_events
 WHERE room_code='QA13LIFE' AND event_type='trame';
 IF published_count<>1 THEN RAISE EXCEPTION 'C1 canonical news not idempotent: %',published_count;END IF;
 result:=public.igr_regime_v13_action('QA13LIFE',third,'third_submission',
 'qa-life-third-0001','{}'::jsonb);
 IF result->>'accepted'<>'true' THEN RAISE EXCEPTION 'third-original missing';END IF;
 result:=public.igr_regime_v13_state('QA13LIFE',investigator);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'public_evidence') d
    WHERE d->>'kind'='third_suspect_document') THEN
   RAISE EXCEPTION 'third authentic document not public after submission';END IF;
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(jsonb_set(play_state,
  ARRAY['arrests','fallen_president'],
  '{"cycle":1,"mandate":"test-1"}'::jsonb,true),
  ARRAY['arrests','presidential_security'],
  '{"cycle":3,"mandate":"test-2"}'::jsonb,true)
 WHERE room_code='QA13LIFE';
 UPDATE public.igr_v4_rooms SET cycle=3,phase='closed',
 phase_ends_at=now()-interval '1 second' WHERE code='QA13LIFE';
 PERFORM public.igr_v4_tick('QA13LIFE');
 SELECT state INTO rstate FROM public.igr_v4_rooms WHERE code='QA13LIFE';
 IF (SELECT phase FROM public.igr_v4_rooms WHERE code='QA13LIFE')<>'regime_court'
   THEN RAISE EXCEPTION 'v4 tick did not enter special tribunal';END IF;
 IF (SELECT play_state->'court'->>'duration_minutes'
 FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13LIFE')<>'14'
 THEN RAISE EXCEPTION 'late capture not 14-minute tribunal';END IF;
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,ARRAY['court','started_at'],
    to_jsonb((now()-interval '61 seconds')::text),true)
 WHERE room_code='QA13LIFE';
 result:=public.igr_regime_v13_court_call('QA13LIFE',judge,'qa-life-call-0001','fallen_president');
 IF result->>'seconds'<>'120' THEN RAISE EXCEPTION 'court witness time wrong';END IF;
 mission:=pack->'third_suspect_mission';
 SELECT e.value INTO act FROM jsonb_array_elements(pack->'acts') e
 WHERE e.value->>'id'=mission->>'target_act_id';
 result:=public.igr_regime_v13_third_final('QA13LIFE',third,'qa-life-final-0001',
 act->>'orderedBy','transmission');
 IF result->>'submitted'<>'true' THEN RAISE EXCEPTION 'third cooperation final failed';END IF;
 SELECT jsonb_agg(x->>'id') INTO clue_ids FROM jsonb_array_elements(pack->'revelations') x
 WHERE x->>'kind'='optional';
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,'{disclosed}',
 coalesce(play_state->'disclosed','[]'::jsonb)||clue_ids,true)
 WHERE room_code='QA13LIFE';
 FOR act IN SELECT value FROM jsonb_array_elements(pack->'acts') LOOP
 SELECT jsonb_agg(id) INTO eids FROM (
 SELECT id FROM (
 SELECT DISTINCT ON (x->>'origin') x->>'id' id,x->>'origin' origin
 FROM jsonb_array_elements(pack->'revelations') x
 WHERE x->'act_ids' ? (act->>'id') ORDER BY x->>'origin',x->>'id') s
 ORDER BY id LIMIT 2) z;
 IF jsonb_array_length(eids)<>2 THEN RAISE EXCEPTION 'missing two sources';END IF;
 answers:=answers||jsonb_build_array(jsonb_build_object(
 'actId',act->>'id','orderedBy',act->>'orderedBy',
 'transmittedBy',act->>'transmittedBy','executedBy',act->>'executedBy',
 'knewAndControlledBy',act->>'knewAndControlledBy','evidenceIds',eids));
 END LOOP;
 result:=public.igr_regime_v13_reconstruct('QA13LIFE',investigator,
 'qa-life-recon-0001',answers);
 IF result->>'final_score_sealed'<>'true' THEN RAISE EXCEPTION 'judicial result prematurely leaked';END IF;
 UPDATE public.igr_v4_rooms SET phase_ends_at=now()-interval '1 second' WHERE code='QA13LIFE';
 PERFORM public.igr_v4_tick('QA13LIFE');
 IF (SELECT phase FROM public.igr_v4_rooms WHERE code='QA13LIFE')<>'locking'
 THEN RAISE EXCEPTION 'v4 did not skip duplicate speeches';END IF;
 FOR p IN SELECT * FROM public.igr_v4_players WHERE room_code='QA13LIFE'
 AND public_role='suspect' LOOP
 votes:=votes||jsonb_build_object(p.id::text,pack->'canonical_truth'->
 'responsibility_by_slot'->(p.internal_slot::text));
 END LOOP;
 result:=public.igr_v4_lock_final('QA13LIFE',investigator,
   jsonb_build_object('levels',votes,'note','Procès de Karsane · conclusion judiciaire'));
 IF result->>'ok'<>'true' THEN RAISE EXCEPTION 'v52 final vote not accepted';END IF;
 reveal:=public.igr_v4_make_reveal('QA13LIFE');
 IF coalesce((reveal->'regime_verdict'->>'total_victory')::boolean,false)<>true THEN
 RAISE EXCEPTION 'new Regime finale mis-scored victory';END IF;
 IF coalesce((reveal->'regime_verdict'->>'third_suspect_win')::boolean,false)<>true THEN
 RAISE EXCEPTION 'third cooperation accurate but lost';END IF;
 IF (reveal->'regime_verdict'->>'accurate_acts')::integer<>4 THEN
 RAISE EXCEPTION 'four correct acts not counted';END IF;
 RAISE NOTICE 'Regime 034: real legacy start, judge seat, private card, C1 trame, private proof, 14min tribunal, third mission and new reveal all PASS';
END $lifecycle$;