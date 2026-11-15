-- LE RÉGIME v13: captures at C2 and C3 through distinct, authored
-- optional investigations. Run inside BEGIN/ROLLBACK after synthetic QA.
DO $later$
DECLARE
 enq uuid;judge uuid;res jsonb;state jsonb;
BEGIN
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 UPDATE public.igr_v4_rooms SET cycle=2,phase='role_reading'
 WHERE code='QA13SAFE';
 res:=public.igr_regime_v13_action('QA13SAFE',enq,'investigate',
  'qa-later-invest-2','{"option_id":"investigate_032A_c2_2"}'::jsonb);
 IF res->>'ok'<>'true' THEN RAISE EXCEPTION 'C2 investigation failed';END IF;
 state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(state->'public_evidence') e
   WHERE e->>'id'='032A-H13') THEN
    RAISE EXCEPTION 'C2 director capture evidence not published'; END IF;
 res:=public.igr_regime_v13_warrant('QA13SAFE',enq,
   'qa-later-warrant-2','vahran_director','032A-vahran',
   '["032A-H11","032A-H13"]'::jsonb);
 res:=public.igr_regime_v13_judge_review('QA13SAFE',judge,
   'qa-later-review-2','qa-later-warrant-2','allow');
 IF res->>'status'<>'captured' THEN RAISE EXCEPTION 'C2 lawful capture did not resolve';END IF;
 UPDATE public.igr_v4_rooms SET cycle=3,phase='role_reading'
 WHERE code='QA13SAFE';
 res:=public.igr_regime_v13_action('QA13SAFE',enq,'investigate',
  'qa-later-invest-3','{"option_id":"investigate_032A_c3_4"}'::jsonb);
 IF res->>'ok'<>'true' THEN RAISE EXCEPTION 'C3 investigation failed';END IF;
 state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(state->'public_evidence') e
   WHERE e->>'id'='032A-H24') THEN
    RAISE EXCEPTION 'C3 minister capture evidence not published'; END IF;
 res:=public.igr_regime_v13_warrant('QA13SAFE',enq,
   'qa-later-warrant-3','interior_minister','032A-interior',
   '["032A-H21","032A-H24"]'::jsonb);
 res:=public.igr_regime_v13_judge_review('QA13SAFE',judge,
   'qa-later-review-3','qa-later-warrant-3','allow');
 IF res->>'status'<>'captured' THEN RAISE EXCEPTION 'C3 lawful capture did not resolve';END IF;
 SELECT play_state INTO state FROM igr_private.igr_regime_v13_rooms
 WHERE room_code='QA13SAFE';
 IF NOT state->'arrests' ?& ARRAY['vahran_director','interior_minister']
 THEN RAISE EXCEPTION 'both fugitives not recorded';END IF;
 RAISE NOTICE 'C2 and C3 evidence-based warrants, separate investigations and captures all PASS';
END $later$;