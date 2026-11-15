-- LE RÉGIME v14 — mobile network retries after courtroom timeout / match end.
-- All previously accepted requests must replay their original response,
-- while fresh requests must remain rejected. Run inside BEGIN/ROLLBACK
-- after the six-role synthetic+judicial QA.
DO $replay$
DECLARE
 enq uuid;dir uuid;judge uuid;answer jsonb;
BEGIN
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO dir FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=1;
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 UPDATE public.igr_v4_rooms SET status='finished',phase='reveal'
 WHERE code='QA13SAFE';
 answer:=public.igr_regime_v13_action('QA13SAFE',dir,
  'alliance','qa-request-0001','{"choice":"together"}'::jsonb);
 IF answer->>'locked'<>'true' THEN RAISE EXCEPTION 'retry of old alliance failed';END IF;
 answer:=public.igr_regime_v13_warrant('QA13SAFE',enq,
  'qa-warrant-0001','vahran_director','032A-vahran',
  '["032A-H11","032A-H12"]'::jsonb);
 IF answer->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'warrant replay missing';END IF;
 answer:=public.igr_regime_v13_judge_review('QA13SAFE',judge,
  'qa-judge-0001','qa-warrant-0001','allow');
 IF answer->>'status'<>'captured' THEN RAISE EXCEPTION 'judge verdict retry missing';END IF;
 answer:=public.igr_regime_v13_court_call('QA13SAFE',judge,
  'qa-court-call-0001','vahran_director');
 IF answer->>'seconds'<>'120' THEN RAISE EXCEPTION 'court call replay missing';END IF;
 answer:=public.igr_regime_v13_reconstruct('QA13SAFE',enq,
  'qa-judicial-0001','[]'::jsonb);
 IF answer->>'received'<>'true' THEN RAISE EXCEPTION 'reconstruction replay missing';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_action('QA13SAFE',dir,
  'fugitive_choice','qa-fresh-forbidden','{"option_id":"032A-vahran_director-C3-1"}'::jsonb);
 RAISE EXCEPTION 'new move accepted after match end';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%accepted after%' THEN RAISE;END IF;END;
 RAISE NOTICE 'Cached network-request replay after match end and no unauthorized fresh action: PASS';
END $replay$;