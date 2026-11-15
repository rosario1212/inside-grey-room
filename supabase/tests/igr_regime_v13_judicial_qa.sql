-- Run after the v13 candidate schema and six-role test, inside one ROLLBACK transaction.
DO $court_test$
DECLARE
 investigator uuid; judge uuid; dir uuid; interior uuid; third uuid;
 result jsonb;state jsonb;draft jsonb;answer_pack jsonb='[]'::jsonb;
 act jsonb; evidence_ids jsonb; all_ids jsonb; e jsonb;
BEGIN
 SELECT player_token INTO investigator FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='juge';
 SELECT player_token INTO dir FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=1;
 SELECT player_token INTO interior FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=2;
 SELECT player_token INTO third FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=3;
 result:=public.igr_regime_v13_warrant('QA13SAFE',investigator,'qa-warrant-0001',
   'vahran_director','032A-vahran','["032A-H11","032A-H12"]'::jsonb);
 IF result->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'first warrant missing';END IF;
 result:=public.igr_regime_v13_judge_review('QA13SAFE',judge,'qa-judge-0001','qa-warrant-0001','allow');
 IF result->>'status'<>'captured' THEN RAISE EXCEPTION 'first valid fugitive not captured';END IF;
 -- Other fugitive has own separate independent lead, requiring a separate decision + warrant.
 result:=public.igr_regime_v13_action('QA13SAFE',interior,'fugitive_choice',
   'qa-fugitive-0002','{"option_id":"032A-interior_minister-C1-1"}'::jsonb);
 result:=public.igr_regime_v13_warrant('QA13SAFE',investigator,'qa-warrant-0002',
   'interior_minister','032A-interior','["032A-H21","032A-H22"]'::jsonb);
 result:=public.igr_regime_v13_judge_review('QA13SAFE',judge,'qa-judge-0002','qa-warrant-0002','allow');
 IF result->>'status'<>'captured' THEN RAISE EXCEPTION 'second fugitive not captured';END IF;
 SELECT play_state INTO state FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13SAFE';
 IF NOT (state->'arrests' ?& ARRAY['vahran_director','interior_minister']) THEN RAISE EXCEPTION 'double capture state missing';END IF;
 -- Emulate a late second capture (C3), without changing C1/C2 production flow.
 UPDATE public.igr_v4_rooms SET cycle=3,phase='closed',phase_ends_at=now()-interval '1 second'
   WHERE code='QA13SAFE';
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=jsonb_set(
     play_state,ARRAY['arrests','interior_minister','cycle'],'3'::jsonb,true)
   WHERE room_code='QA13SAFE';
 IF NOT igr_private.igr_regime_v13_begin_court('QA13SAFE') THEN RAISE EXCEPTION 'court failed to start';END IF;
 SELECT play_state,private_pack INTO state,draft
 FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13SAFE';
 IF state->'court'->>'duration_minutes'<>'14' THEN RAISE EXCEPTION 'long hearing must be 14 min';END IF;
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,ARRAY['court','started_at'],
    to_jsonb((now()-interval '61 seconds')::text),true)
 WHERE room_code='QA13SAFE';
 result:=public.igr_regime_v13_court_call('QA13SAFE',judge,'qa-court-call-0001','palace_secretary');
 IF result->>'seconds'<>'120' THEN RAISE EXCEPTION '2-minute speaking right missing';END IF;
 -- Reveal all optional evidence for a deterministic reconstitution; the server
 -- must still evaluate the four accurate attributions using independent documents.
 SELECT jsonb_agg(item->>'id') INTO all_ids
 FROM jsonb_array_elements(draft->'revelations') item WHERE item->>'kind'='optional';
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,'{disclosed}',all_ids,true)
 WHERE room_code='QA13SAFE';
 FOR act IN SELECT value FROM jsonb_array_elements(draft->'acts') LOOP
   SELECT jsonb_agg(id) INTO evidence_ids FROM (
     SELECT id FROM (
       SELECT DISTINCT ON (item->>'origin') item->>'id' id,item->>'origin' origin
       FROM jsonb_array_elements(draft->'revelations') item
       WHERE item->'act_ids' ? (act->>'id') ORDER BY item->>'origin',item->>'id'
     ) sources ORDER BY id LIMIT 2
   ) two_sources;
   IF jsonb_array_length(evidence_ids)<>2 THEN RAISE EXCEPTION 'insufficient authored proofs';END IF;
   answer_pack:=answer_pack||jsonb_build_array(
     jsonb_build_object('actId',act->>'id','orderedBy',act->>'orderedBy',
      'transmittedBy',act->>'transmittedBy','executedBy',act->>'executedBy',
      'knewAndControlledBy',act->>'knewAndControlledBy','evidenceIds',evidence_ids));
 END LOOP;
 result:=public.igr_regime_v13_reconstruct('QA13SAFE',investigator,'qa-judicial-0001',answer_pack);
 IF result->>'final_score_sealed'<>'true' OR result ? 'accurate' THEN RAISE EXCEPTION 'judicial result should remain sealed';END IF;
 SELECT play_state INTO state FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13SAFE';
 IF coalesce((SELECT (v->>'accurate')::int FROM jsonb_each(state->'reconstructions') x(k,v) LIMIT 1),-1)<>4
 THEN RAISE EXCEPTION 'accurate judicial score missing';END IF;
 -- Expire the common court clock. The final step must go DIRECTLY to v52 locking.
 UPDATE public.igr_v4_rooms SET phase_ends_at=now()-interval '1 second'
 WHERE code='QA13SAFE';
 PERFORM igr_private.igr_regime_v13_finish_court('QA13SAFE');
 IF (SELECT phase FROM public.igr_v4_rooms WHERE code='QA13SAFE')<>'locking'
 THEN RAISE EXCEPTION 'court closure must skip duplicate final speeches';END IF;
 RAISE NOTICE 'Regime warrants 2/2, Judge, 14-minute court, 4/4 judicial reconstruction and direct final vote: PASS';
END $court_test$;