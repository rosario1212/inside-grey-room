-- LE RÉGIME v15 — majority and independent Analyst provenance QA.
-- Run inside BEGIN/ROLLBACK AFTER migration and
-- supabase/tests/igr_regime_v13_release_lifecycle_qa.sql creates QA13LIFE.
-- Must not run directly in production outside a transaction.
DO $v15qa$
DECLARE
 enq uuid; analyst uuid; judge uuid; aid uuid; eid uuid;
 wrong jsonb; result jsonb; reveal jsonb;
BEGIN
 SELECT player_token,id INTO enq,eid FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='enqueteur';
 SELECT player_token,id INTO analyst,aid FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='analyste';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13LIFE' AND public_role='juge';
 IF enq IS NULL OR analyst IS NULL OR judge IS NULL THEN
  RAISE EXCEPTION 'six-seat fixture missing'; END IF;
 -- Enqueteur's correct acts vanish; Analyst's independent correct
 -- submissions must still make all four acts evaluable.
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(play_state,ARRAY['reconstructions'],
   ((play_state->'reconstructions') - (eid::text)) ||
   jsonb_build_object(aid::text,(play_state->'reconstructions')->(eid::text)),true)
 WHERE room_code='QA13LIFE';
 reveal:=igr_private.igr_regime_v13_make_reveal('QA13LIFE');
 IF (reveal->'regime_verdict'->>'accurate_acts')::int<>4 OR
    (reveal->'regime_verdict'->>'total_victory')::boolean<>true THEN
  RAISE EXCEPTION 'Analyst independent reconstruction wrongly ignored'; END IF;
 -- The other two authorized final ballots are identically wrong.
 -- A single correct Enqueteur cannot override majority, even with 4/4 acts.
 SELECT jsonb_object_agg(s.id::text,
   to_jsonb((coalesce((m.private_pack->'canonical_truth'->'responsibility_by_slot'->>
     (s.internal_slot::text))::int,0)+1)%3))
 INTO wrong
 FROM public.igr_v4_players s
 JOIN igr_private.igr_regime_v13_rooms m ON m.room_code=s.room_code
 WHERE s.room_code='QA13LIFE' AND s.public_role='suspect';
 result:=public.igr_v4_lock_final('QA13LIFE',analyst,jsonb_build_object('levels',wrong));
 IF result->>'ok'<>'true' THEN RAISE EXCEPTION 'Analyst vote rejected';END IF;
 result:=public.igr_v4_lock_final('QA13LIFE',judge,jsonb_build_object('levels',wrong));
 IF result->>'ok'<>'true' THEN RAISE EXCEPTION 'Judge vote rejected';END IF;
 reveal:=igr_private.igr_regime_v13_make_reveal('QA13LIFE');
 IF (reveal->'regime_verdict'->>'collective_accurate')::int<>0 OR
    (reveal->'regime_verdict'->>'total_victory')::boolean IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'Enqueteur solitary vote bypassed majority';END IF;
 RAISE NOTICE 'Regime v15: Analyst 4/4 sourced acts, majority 2:1 over Enqueteur, Judge no veto PASS';
END $v15qa$;
