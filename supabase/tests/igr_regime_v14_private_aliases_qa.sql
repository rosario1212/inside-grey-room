-- v14 strict aliases: only randomized per-room IDs leave a session.
-- This test must be executed inside BEGIN/ROLLBACK after v13 synthetic room
-- and all private candidate functions. Never writes live production data.
DO $aliasqa$
DECLARE
 enq uuid;director uuid;judge uuid;public_state jsonb;
 e1 jsonb;e2 jsonb;target_id text;hideout text;act_ref text;option_ref text;
 accepted jsonb;source_doc jsonb;id1 text;id2 text;news jsonb;
BEGIN
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO director FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=1;
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,'{strict_alias_only}','true'::jsonb,true)
 WHERE room_code='QA13SAFE';
 public_state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF public_state::text ~ '032A|032B|032C'
 THEN RAISE EXCEPTION 'variant-coded ID leaked to investigator';END IF;
 IF jsonb_array_length(public_state->'public_networks')<>5 THEN
   RAISE EXCEPTION 'five network choices absent';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public_state->'public_networks') net
   WHERE net->>'id' NOT LIKE 'ref-%') THEN
   RAISE EXCEPTION 'raw network ID leaked';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public_state->'court_acts') act
   WHERE act->>'id' NOT LIKE 'ref-%') THEN
   RAISE EXCEPTION 'raw judicial act ID leaked';END IF;
 public_state:=public.igr_regime_v13_state('QA13SAFE',director);
 IF public_state::text ~ '032A|032B|032C' THEN
 RAISE EXCEPTION 'secret variant ID leaked to suspect';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public_state->'my_fugitive_options') act
   WHERE act->>'id' NOT LIKE 'ref-%') THEN
   RAISE EXCEPTION 'fugitive option ID not opaque';END IF;
 SELECT opt->>'id' INTO option_ref FROM jsonb_array_elements(
   public_state->'my_fugitive_options') opt
   WHERE opt->>'cycle'='1' LIMIT 1;
 IF option_ref IS NULL THEN
   -- Synthetic QA has already used director's C1 move. Test C2 instead.
   UPDATE public.igr_v4_rooms SET cycle=2,phase='role_reading' WHERE code='QA13SAFE';
   public_state:=public.igr_regime_v13_state('QA13SAFE',director);
   SELECT opt->>'id' INTO option_ref FROM jsonb_array_elements(
     public_state->'my_fugitive_options') opt LIMIT 1;
 END IF;
 IF option_ref IS NULL THEN RAISE EXCEPTION 'no private aliased move';END IF;
 accepted:=public.igr_regime_v13_action('QA13SAFE',director,'fugitive_choice',
   'qa-opaque-move-0001',jsonb_build_object('option_id',option_ref));
 IF accepted->>'accepted'<>'true' THEN
   RAISE EXCEPTION 'aliased fugitive move failed';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_action('QA13SAFE',director,'fugitive_choice',
   'qa-opaque-raw-0002','{"option_id":"032A-vahran_director-C3-1"}'::jsonb);
 RAISE EXCEPTION 'raw coded move unexpectedly accepted';
 EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%unexpectedly accepted%' THEN RAISE;END IF;
 END;
 -- A separate C1 room instance, copied only inside this throwaway transaction,
 -- supplies two independent capture clues in strict mode.
 INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
 VALUES('QA14ALIAS','032','playing',1,'role_reading');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
 VALUES('QA14ALIAS','Enquêteur alias',0,'enqueteur',NULL),
       ('QA14ALIAS','Juge alias',1,'juge',NULL),
       ('QA14ALIAS','Dir alias',2,'suspect',1),
       ('QA14ALIAS','Int alias',3,'suspect',2),
       ('QA14ALIAS','Tiers alias',4,'suspect',3);
 INSERT INTO igr_private.igr_regime_v13_rooms(room_code,scenario_id,variant_id,private_pack,play_state)
 SELECT 'QA14ALIAS','032','A',manuscript->'regime_vnext',
 jsonb_build_object('strict_alias_only',true,'alliance',
 '{"vahran_director":"apart","interior_minister":"apart"}'::jsonb,
 'disclosed','["032A-H12"]'::jsonb,'arrests','{}'::jsonb,'mandates','[]'::jsonb,
 'investigations','[]'::jsonb,'decisions','[]'::jsonb,'court','{}'::jsonb,
 'third','{}'::jsonb,'events','[]'::jsonb,'reconstructions','{}'::jsonb)
 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='032' AND variant_id='A';
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA14ALIAS' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA14ALIAS' AND public_role='juge';
 public_state:=public.igr_regime_v13_state('QA14ALIAS',enq);
 IF public_state::text ~ '032A|032B|032C' THEN RAISE EXCEPTION 'capture state leaked variants';END IF;
 SELECT x.value INTO e1 FROM jsonb_array_elements(public_state->'public_evidence') x
 WHERE x.value->>'source'='sealed_official_document' AND x.value->>'target_id'='vahran_director'
 LIMIT 1;
 SELECT x.value INTO e2 FROM jsonb_array_elements(public_state->'public_evidence') x
 WHERE x.value->>'source'='independent_transition_testimony' AND x.value->>'target_id'='vahran_director'
 LIMIT 1;
 IF e1 IS NULL OR e2 IS NULL THEN RAISE EXCEPTION 'independent C1 clues missing';END IF;
 hideout:=e1->>'network_id';
 IF hideout<>e2->>'network_id' OR hideout NOT LIKE 'ref-%'
 THEN RAISE EXCEPTION 'independent proofs not on one aliased refuge';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_warrant('QA14ALIAS',enq,
 'qa-raw-warrant-0001','vahran_director','032A-vahran',
 '["032A-H11","032A-H12"]'::jsonb);
 RAISE EXCEPTION 'unguarded variant-coded warrant accepted';
 EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%unguarded%' THEN RAISE;END IF;
 END;
 accepted:=public.igr_regime_v13_warrant('QA14ALIAS',enq,
   'qa-opaque-warrant-0001','vahran_director',hideout,
   jsonb_build_array(e1->>'id',e2->>'id'));
 IF accepted->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'opaque warrant failed';END IF;
 accepted:=public.igr_regime_v13_judge_review('QA14ALIAS',judge,
   'qa-opaque-judge-0001','qa-opaque-warrant-0001','allow');
 IF accepted->>'status'<>'captured' THEN RAISE EXCEPTION 'opaque warrant was not a real capture';END IF;
 -- Different rooms with the same storyline never expose the same alias.
 IF igr_private.igr_regime_v14_public_id('QA14ALIAS','032A-H11')=
    igr_private.igr_regime_v14_public_id('QA13SAFE','032A-H11')
 THEN RAISE EXCEPTION 'room salts produce deterministic identical IDs';END IF;
 RAISE NOTICE 'Per-room hidden variant, opaque roles/refuges/clues, auth RPC, raw-ID rejection: PASS';
END $aliasqa$;