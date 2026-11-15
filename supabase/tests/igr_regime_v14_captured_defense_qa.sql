-- LE RÉGIME: captivated fugitive remains active, may publish an authentic
-- exhibit, cannot falsify the sealed author, and can win only a limited
-- personal non-authorship defense. Rollback only.
DO $captured$
DECLARE
 director uuid;enq uuid;act jsonb;private_pack jsonb;
 response jsonb;state jsonb;all_ids jsonb;proofs jsonb;answers jsonb='[]'::jsonb;
 verdict jsonb;results jsonb;dir_id uuid;
BEGIN
 SELECT player_token,id INTO director,dir_id FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=1;
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 UPDATE public.igr_v4_rooms SET cycle=2,phase='role_reading' WHERE code='QA13SAFE';
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,ARRAY['arrests','vahran_director'],
 '{"cycle":1,"mandate":"qa-defendant-arrest"}'::jsonb,true)
 WHERE room_code='QA13SAFE';
 state:=public.igr_regime_v13_state('QA13SAFE',director);
 IF state->'my_captured_objective'->>'act_id'<>'032A-ACT2'
   OR state->'my_captured_objective' ? 'expected_ordered_by'
   THEN RAISE EXCEPTION 'captured objective missing or private answer leaked';END IF;
 IF state->'scene'->>'id'<>'032A-SCENE2' THEN
   RAISE EXCEPTION 'C2 dark scene not visible';END IF;
 IF state->'scene'->>'text' IS NULL THEN
   RAISE EXCEPTION 'C2 scene has no narrative';END IF;
 response:=public.igr_regime_v13_action('QA13SAFE',director,'captured_response',
   'qa-captured-act-1',jsonb_build_object(
   'mode','authentic_exhibit','claimed_orderer','interior_minister',
   'statement','Cet ordre de prolongation émane du cabinet du ministre, pas de la direction de Vahran. Je reconnais avoir géré les transferts.'));
 IF response->>'accepted'<>'true'
   OR response->>'document_published' IS NULL THEN
   RAISE EXCEPTION 'captured exhibit not recorded';END IF;
 state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(state->'public_evidence') e
   WHERE e->>'id'=response->>'document_published') THEN
   RAISE EXCEPTION 'captured authentic excerpt not disclosed publicly';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_action('QA13SAFE',director,'captured_response',
   'qa-captured-act-2',jsonb_build_object(
   'mode','contested_declaration','claimed_orderer','interior_minister',
   'statement','Je dépose une deuxième déclaration interdite dans le même cycle.'));
 RAISE EXCEPTION 'second defense was wrongly permitted';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%wrongly permitted%' THEN RAISE;END IF;END;
 SELECT x.private_pack INTO private_pack FROM igr_private.igr_regime_v13_rooms x
 WHERE x.room_code='QA13SAFE';
 SELECT jsonb_agg(x.value->>'id') INTO all_ids FROM
 jsonb_array_elements(private_pack->'revelations') x
 WHERE x.value->>'kind'='optional';
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,'{disclosed}',all_ids,true)
 WHERE room_code='QA13SAFE';
 UPDATE public.igr_v4_rooms SET cycle=3,phase='regime_court' WHERE code='QA13SAFE';
 FOR act IN SELECT value FROM jsonb_array_elements(private_pack->'acts') LOOP
 SELECT jsonb_agg(id) INTO proofs FROM (
  SELECT id FROM (
    SELECT DISTINCT ON (x.value->>'origin') x.value->>'id' id,x.value->>'origin' origin
    FROM jsonb_array_elements(private_pack->'revelations') x
    WHERE x.value->'act_ids' ? (act->>'id')
    ORDER BY x.value->>'origin',x.value->>'id') s ORDER BY id LIMIT 2) sources;
 IF jsonb_array_length(proofs)<>2 THEN RAISE EXCEPTION 'private evidence missing';END IF;
 answers:=answers||jsonb_build_array(jsonb_build_object('actId',act->>'id',
   'orderedBy',act->>'orderedBy','transmittedBy',act->>'transmittedBy',
   'executedBy',act->>'executedBy','knewAndControlledBy',act->>'knewAndControlledBy',
   'evidenceIds',proofs));
 END LOOP;
 response:=public.igr_regime_v13_reconstruct('QA13SAFE',enq,
   'qa-captured-recon-1',answers);
 IF response->>'received'<>'true' THEN RAISE EXCEPTION 'reconstruction failed';END IF;
 UPDATE public.igr_v4_rooms SET phase='locking' WHERE code='QA13SAFE';
 verdict:=igr_private.igr_regime_v13_make_reveal('QA13SAFE');
 SELECT value INTO results FROM jsonb_array_elements(verdict->'results') value
 WHERE value->>'player_id'=dir_id::text;
 IF results->>'success'<>'true' OR
 verdict->'regime_verdict'->>'total_victory'<>'false'
 THEN RAISE EXCEPTION 'partial captured victory not scored independently';END IF;
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,ARRAY['captured_responses','0','claimed_orderer'],
   to_jsonb('palace_secretary'::text),true)
 WHERE room_code='QA13SAFE';
 verdict:=igr_private.igr_regime_v13_make_reveal('QA13SAFE');
 SELECT value INTO results FROM jsonb_array_elements(verdict->'results') value
 WHERE value->>'player_id'=dir_id::text;
 IF results->>'success'<>'false'
 THEN RAISE EXCEPTION 'untruthful captured defense incorrectly won';END IF;
 RAISE NOTICE 'C2 public scenes, authentic source, active captured role, limited factual victory and negative test: PASS';
END $captured$;