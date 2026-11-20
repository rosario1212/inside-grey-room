-- v800 QA maintenance: the 001 report added a mandatory intent axis after
-- the older rollback-only smoke function was written. Align synthetic test
-- payloads with the live final-lock validation; do not modify game verdicts.
DO $patch$
DECLARE
  definition text;
  old_fragment text := $old$jsonb_build_object('moment',data->>'moment','gesture',data->>'gesture','reframe',data->>'reframe')$old$;
  new_fragment text := $new$jsonb_build_object('moment',data->>'moment','gesture',data->>'gesture','reframe',data->>'reframe',
     'intent',CASE WHEN data->>'gesture'='s3_accident' THEN 'involuntary_act' ELSE 'voluntary_act' END)$new$;
BEGIN
  SELECT pg_get_functiondef('igr_private.igr_v191_001_verdict_smoke()'::regprocedure) INTO definition;
  IF position(new_fragment IN definition)>0 THEN
    RETURN;
  END IF;
  IF (length(definition)-length(replace(definition,old_fragment,'')))/length(old_fragment)<>2 THEN
    RAISE EXCEPTION '001 smoke test changed; review manually before patching';
  END IF;
  EXECUTE replace(definition,old_fragment,new_fragment);
END $patch$;

-- Manual read-only verification after migration:
-- select igr_private.igr_v191_001_verdict_smoke();
-- Expected ok=true, scored=3, invalid_answers_rejected=true,
-- synthetic_room_persisted=false.
