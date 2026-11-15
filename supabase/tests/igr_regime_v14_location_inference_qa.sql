-- LE RÉGIME v14 — a refuge is not a binary alliance guess:
-- immutable C1 leads, concrete C2 relocation, independent movement footprint,
-- mismatch rejection and valid later judicial capture. ROLLBACK ONLY.
DO $loc$
DECLARE
 dir uuid;enq uuid;judge uuid;result jsonb;stat jsonb;
BEGIN
 SELECT player_token INTO dir FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=1;
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 UPDATE public.igr_v4_rooms SET cycle=2,phase='investigation_assembly'
 WHERE code='QA13SAFE';
 result:=public.igr_regime_v13_action('QA13SAFE',dir,'fugitive_choice',
   'qa-shift-0001','{"option_id":"032A-vahran_director-C2-1"}'::jsonb);
 IF result->>'accepted'<>'true' THEN RAISE EXCEPTION 'refuge shift rejected';END IF;
 stat:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF jsonb_array_length(stat->'public_networks')<>5 THEN
   RAISE EXCEPTION 'five refuges not shown publicly';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(stat->'public_evidence') clue
  WHERE clue->>'id'='movement:qa-shift-0001'
    AND clue->>'network_id'='032A-relocation-first') THEN
   RAISE EXCEPTION 'new relay has no genuine public lead';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(stat->'public_evidence') clue
  WHERE clue->>'id'='032A-H11'
    AND clue->>'network_id'='032A-vahran') THEN
   RAISE EXCEPTION 'old C1 proof rewritten after fugitive relocation';END IF;
 result:=public.igr_regime_v13_action('QA13SAFE',enq,'investigate',
   'qa-shift-invest-1','{"option_id":"investigate_032A_c2_2"}'::jsonb);
 stat:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(stat->'public_evidence') clue
  WHERE clue->>'id'='032A-H13'
    AND clue->>'network_id'='032A-relocation-first') THEN
   RAISE EXCEPTION 'new official independent clue not tied to current refuge';END IF;
 BEGIN
  PERFORM public.igr_regime_v13_warrant('QA13SAFE',enq,
    'qa-mismatch-0001','vahran_director','032A-relocation-first',
    '["032A-H11","032A-H13"]'::jsonb);
  RAISE EXCEPTION 'stale prior hideout mistakenly supports the new warrant';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%mistakenly supports%' THEN RAISE;END IF;END;
 result:=public.igr_regime_v13_warrant('QA13SAFE',enq,
   'qa-warrant-relocate','vahran_director','032A-relocation-first',
   '["movement:qa-shift-0001","032A-H13"]'::jsonb);
 IF result->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'valid relocated warrant missing';END IF;
 result:=public.igr_regime_v13_judge_review('QA13SAFE',judge,
   'qa-judge-relocate','qa-warrant-relocate','allow');
 IF result->>'status'<>'captured' THEN
   RAISE EXCEPTION 'relocated suspect not caught with proper two-source location';END IF;
 RAISE NOTICE 'Immutable old C1 lead, five public refuges, real C2 move, independent fresh proof, correct capture: PASS';
END $loc$;