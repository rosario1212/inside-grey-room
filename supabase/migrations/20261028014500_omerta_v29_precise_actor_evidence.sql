-- V29: a formal allegation needs a precise act and actor-specific independent evidence.
-- Until reviewed, no author-only fiction becomes a server-verified conviction.
ALTER TABLE igr_private.igr_omerta_v29_precise_act_review
 ADD COLUMN IF NOT EXISTS actual_actor_slots integer[] NOT NULL DEFAULT ARRAY[]::integer[],
 ADD COLUMN IF NOT EXISTS evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS review_notes text;
DO $safe_constraint$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname='omerta_v29_evidence_is_array'
     AND conrelid='igr_private.igr_omerta_v29_precise_act_review'::regclass)
 THEN
  ALTER TABLE igr_private.igr_omerta_v29_precise_act_review
   ADD CONSTRAINT omerta_v29_evidence_is_array CHECK(jsonb_typeof(evidence_ids)='array');
 END IF;
END $safe_constraint$;
CREATE OR REPLACE FUNCTION igr_private.igr_omerta_v29_precise_goals_ready(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $precise$
 SELECT coalesce(count(*)=3 AND bool_and(
    (SELECT count(*) FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c) =
    (SELECT count(*) FROM igr_private.igr_omerta_v29_precise_act_review g
     WHERE g.scenario_id=m.scenario_id AND g.variant_id=m.variant_id
       AND g.review_status='verified' AND g.source_manuscript_md5=m.content_md5
       AND g.act_code ~ '^02[1-5]-ACT-0[1-7]$'
       AND (
        (cardinality(g.actual_actor_slots)=0 AND jsonb_array_length(g.evidence_ids)=0)
        OR
        (cardinality(g.actual_actor_slots)>0 AND jsonb_array_length(g.evidence_ids)=2
         AND (SELECT count(DISTINCT j.value) FROM pg_catalog.jsonb_array_elements_text(g.evidence_ids) j)=2
         AND NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(g.actual_actor_slots) actor
           WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c
             WHERE (c->>'slot')::int=actor))
         AND NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements_text(g.evidence_ids) ref
           WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'canonical_truth'->'timeline') t
             WHERE t->>'id'=ref.value))))
       AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c
        WHERE (c->>'slot')::integer=g.slot AND c->'verdict_goal'->>'goal_id'=g.goal_id))
 ),false)
 FROM igr_private.igr_omerta_santoro_v25_drafts m
 WHERE m.scenario_id=p_scenario AND m.variant_id IN('A','B','C')
$precise$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_v29_precise_goals_ready(text)
 FROM public,anon,authenticated;
