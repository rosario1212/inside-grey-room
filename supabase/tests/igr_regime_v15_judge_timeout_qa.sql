-- Reproducible 90-second judicial fallback test; run in BEGIN/ROLLBACK after
-- supabase/tests/igr_regime_v13_synthetic_qa.sql.
DO $qa$
DECLARE enq uuid;analyst uuid;result jsonb;
BEGIN
 SELECT player_token INTO enq FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO analyst FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='analyste';
 result:=public.igr_regime_v13_warrant('QA13SAFE',enq,'qa-v15-audit-warrant','vahran_director',
 '032A-vahran','["032A-H11","032A-H12"]'::jsonb);
 IF result->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'warrant rejected'; END IF;
 BEGIN
  PERFORM public.igr_regime_v13_judge_review('QA13SAFE',analyst,'qa-v15-audit-early',
   'qa-v15-audit-warrant','allow');
  RAISE EXCEPTION 'unauthorized early analyst decision';
 EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%unauthorized early%' THEN RAISE; END IF;
 END;
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,'{mandates,0,requested_at}',
 to_jsonb((now()-interval '91 seconds')::text),true)
 WHERE room_code='QA13SAFE';
 result:=public.igr_regime_v13_judge_review('QA13SAFE',analyst,'qa-v15-audit-late',
  'qa-v15-audit-warrant','allow');
 IF result->>'status'<>'captured' OR result->>'judge_review'<>'automatic_fallback'
 THEN RAISE EXCEPTION 'automatic fallback did not decide neutral evidence';END IF;
 RAISE NOTICE 'Judge timeout recovery 90 seconds, role-gated neutral decision PASS';
END $qa$;
