-- Omerta Santoro: a formal allegation cannot, on its own, condemn a player.
-- Private, editorially certified canonical actor slots are necessary for
-- the per-act designation to count as a valid penalty to a player's goal.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_verdict_truth_actors (
 scenario_id text NOT NULL,
 variant_id text NOT NULL,
 act_axis text NOT NULL,
 actual_slots integer[] NOT NULL DEFAULT ARRAY[]::integer[],
 manuscript_md5 text NOT NULL,
 review_status text NOT NULL DEFAULT 'review'
   CHECK (review_status IN ('review','verified','rejected')),
 reviewed_by text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(scenario_id,variant_id,act_axis),
 CONSTRAINT omerta_verdict_truth_review_consistency CHECK (
  (review_status='verified')=(reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
 )
);
ALTER TABLE igr_private.igr_omerta_verdict_truth_actors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_omerta_verdict_truth_actors FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_omerta_verdict_truth_mapping_ready(
 p_scenario text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $truth_check$
 SELECT coalesce(count(*)=3 AND bool_and(
  (select count(*) from pg_catalog.jsonb_object_keys(
    m.manuscript->'canonical_truth'->'responsibility_by_act') k)=
  (select count(*) from igr_private.igr_omerta_verdict_truth_actors a
    where a.scenario_id=m.scenario_id and a.variant_id=m.variant_id
      and a.review_status='verified' and a.manuscript_md5=m.content_md5
      and m.manuscript->'canonical_truth'->'responsibility_by_act' ? a.act_axis
      and not exists(
        select 1 from pg_catalog.unnest(a.actual_slots) slot
        where not exists(select 1 from pg_catalog.jsonb_array_elements(
          m.manuscript->'private_cards') c where (c->>'slot')::integer=slot)
      ))
 ),false)
 FROM igr_private.igr_omerta_santoro_v25_drafts m
 WHERE m.scenario_id=p_scenario AND m.variant_id IN ('A','B','C')
$truth_check$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_verdict_truth_mapping_ready(text)
 FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_omerta_standalone_can_start(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $can$
 SELECT coalesce(
  (select c.enabled FROM igr_private.igr_omerta_standalone_release_control c WHERE c.id=1),false)
 AND coalesce(igr_private.igr_omerta_editorial_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_structural_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_verdict_goal_mapping_ready(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_verdict_truth_mapping_ready(p_scenario),false)
$can$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_standalone_can_start(text)
 FROM public,anon,authenticated;
