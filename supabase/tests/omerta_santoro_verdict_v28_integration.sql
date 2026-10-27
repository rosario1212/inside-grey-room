-- Production-shape end-to-end verification. ALL fixture edits roll back.
BEGIN;
SET LOCAL statement_timeout='25000ms';
SET LOCAL lock_timeout='4000ms';
DO $qa$
DECLARE
 room_ref text:='QAVERD28'; host uuid; inv uuid; src uuid; other uuid;
 src_id uuid; other_id uuid; out jsonb; current_manuscript jsonb;
 variant text; proof jsonb; axis text; other_axis text; ballot jsonb; denied boolean;
BEGIN
 IF EXISTS(select 1 from public.igr_v4_rooms where public.igr_v4_rooms.code=room_ref)
  OR (select enabled from igr_private.igr_omerta_standalone_release_control where id=1)
    IS DISTINCT FROM false THEN RAISE EXCEPTION 'test_not_isolated'; END IF;
 UPDATE igr_private.igr_omerta_santoro_v25_drafts
 SET editorial_status='ready',approved_by='TEST_ROLLBACK',approved_at=now(),
  manuscript=jsonb_set(manuscript,'{revelations,0,editorial_provenance,human_source_review}','"verified"'::jsonb,true)
  || '{"status":"ready","human_review_approved":true,"verdict_scoring_review":"approved"}'::jsonb
 WHERE scenario_id='021';
 UPDATE igr_private.igr_omerta_verdict_goal_axes SET
  review_status='verified',reviewed_by='TEST_ROLLBACK',reviewed_at=now()
 WHERE scenario_id='021';
 UPDATE igr_private.igr_omerta_verdict_truth_actors SET
  review_status='verified',reviewed_by='TEST_ROLLBACK',reviewed_at=now()
 WHERE scenario_id='021';
 UPDATE igr_private.igr_omerta_standalone_release_control SET enabled=true WHERE id=1;
 IF igr_private.igr_omerta_standalone_can_start('021') IS NOT TRUE
 THEN RAISE EXCEPTION 'review_gate_synthetic_failed';END IF;
 INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
 VALUES(room_ref,'021','lobby',0,'briefing','{"match_no":1}'::jsonb)
 RETURNING host_token INTO host;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
 VALUES(room_ref,'Inv',1,'enqueteur','enqueteur','enqueteur') RETURNING player_token INTO inv;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
 VALUES(room_ref,'Accused',2,'suspect','associato','associato') RETURNING id,player_token INTO src_id,src;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
 VALUES(room_ref,'Other',3,'suspect','uomo_onore','uomo_onore') RETURNING id,player_token INTO other_id,other;
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,preferred_role)
 VALUES(room_ref,'Third',4,'suspect','contabile','contabile');
 out:=public.igr_omerta_start_standalone(room_ref,host);
 IF out->>'ok'<>'true' THEN RAISE EXCEPTION 'start_not_working';END IF;
 denied:=false;
 BEGIN PERFORM public.igr_omerta_standalone_verdict_options(room_ref,inv);
 EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'premature_options';END IF;
 UPDATE public.igr_v4_rooms SET cycle=3,phase='locking',
  state=state||'{"v52_final_reassessment":true}'::jsonb WHERE public.igr_v4_rooms.code=room_ref;
 SELECT s.manuscript,s.variant_id INTO current_manuscript,variant
 FROM igr_private.igr_omerta_room_variant_snapshots s WHERE s.room_code=room_ref;
 SELECT rev.value->'editorial_provenance'->'existing_events'
 INTO proof FROM pg_catalog.jsonb_array_elements(current_manuscript->'revelations') rev(value)
 LIMIT 1;
 SELECT g.act_axis INTO axis FROM igr_private.igr_omerta_verdict_goal_axes g
 JOIN public.igr_v4_players p ON p.id=src_id AND p.internal_slot=g.slot
 WHERE g.scenario_id='021' AND g.variant_id=variant;
 SELECT g.act_axis INTO other_axis FROM igr_private.igr_omerta_verdict_goal_axes g
 JOIN public.igr_v4_players p ON p.id=other_id AND p.internal_slot=g.slot
 WHERE g.scenario_id='021' AND g.variant_id=variant;
 UPDATE igr_private.igr_omerta_verdict_truth_actors SET
   actual_slots=ARRAY[(SELECT internal_slot FROM public.igr_v4_players WHERE id=src_id)]
 WHERE scenario_id='021' AND variant_id=variant AND act_axis=axis;
 out:=public.igr_omerta_standalone_verdict_options(room_ref,inv);
 IF out->>'available'<>'true' OR jsonb_array_length(out->'suspects')<>3
 OR jsonb_array_length(out->'acts')<>4
 OR out::text LIKE '%private_cards%' THEN RAISE EXCEPTION 'options_bad_or_leaky';END IF;
 ballot:=jsonb_build_array(
   jsonb_build_object('player_id',src_id,'act_axis',axis,'evidence_ids',proof),
   jsonb_build_object('player_id',other_id,'act_axis',other_axis,'evidence_ids',proof)
 );
 denied:=false;
 BEGIN PERFORM public.igr_omerta_standalone_lock_verdict(room_ref,src,ballot);
 EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'unauthorized_suspect_can_lock';END IF;
 denied:=false;
 BEGIN PERFORM public.igr_omerta_standalone_lock_verdict(room_ref,inv,
  jsonb_build_array(jsonb_build_object('player_id',src_id,
   'act_axis','invalid_axis','evidence_ids',proof)));
 EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied OR EXISTS(SELECT 1 FROM igr_private.igr_omerta_verdict_locks l
 WHERE l.room_code=room_ref) THEN RAISE EXCEPTION 'invalid_axis_accepted_or_partial_lock';END IF;
 out:=public.igr_omerta_standalone_lock_verdict(room_ref,inv,ballot);
 IF out->>'finished'<>'true' OR out->>'designations_recorded'<>'2'
 THEN RAISE EXCEPTION 'final_not_recorded';END IF;
 -- A genuinely uncertified actor link never triggers a fabricated loss.
 UPDATE igr_private.igr_omerta_verdict_truth_actors
 SET review_status='review',reviewed_by=NULL,reviewed_at=NULL
 WHERE scenario_id='021' AND variant_id=variant AND act_axis=axis;
 out:=public.igr_omerta_standalone_my_verdict(room_ref,src);
 IF out->>'reason'<>'editorial_actor_truth_pending'
 THEN RAISE EXCEPTION 'unreviewed_actor_truth_scored';END IF;
 UPDATE igr_private.igr_omerta_verdict_truth_actors
 SET review_status='verified',reviewed_by='TEST_ROLLBACK',reviewed_at=now()
 WHERE scenario_id='021' AND variant_id=variant AND act_axis=axis;
 out:=public.igr_omerta_standalone_my_verdict(room_ref,src);
 IF out->>'available'<>'true' OR out->'result'->>'status'<>'lost'
 THEN RAISE EXCEPTION 'wrongly_designated_goal_not_lost';END IF;
 out:=public.igr_omerta_standalone_my_verdict(room_ref,other);
 IF out->'result'->>'status'<>'won' THEN RAISE EXCEPTION 'unrelated_goal_not_won';END IF;
 out:=public.igr_omerta_standalone_my_verdict(room_ref,inv);
 IF out->>'available'<>'false' THEN RAISE EXCEPTION 'inv_read_private_goal';END IF;
 denied:=false;
 BEGIN PERFORM public.igr_omerta_standalone_lock_verdict(room_ref,inv,ballot);
 EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'second_final_lock';END IF;
END $qa$;
ROLLBACK;
SELECT 'OMERTA_V28_VERDICT_ROLLBACK_PASS' AS outcome;
