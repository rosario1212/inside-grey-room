-- Private semantic bridge: one editorially reviewed allegation axis per
-- scenario/variant/player objective. No private plots or goal text in GitHub.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_verdict_goal_axes (
 scenario_id text NOT NULL, variant_id text NOT NULL, goal_id text NOT NULL,
 slot integer NOT NULL CHECK (slot BETWEEN 1 AND 9),
 act_axis text NOT NULL, manuscript_md5 text NOT NULL,
 review_status text NOT NULL DEFAULT 'review'
  CHECK(review_status IN('review','verified','rejected')),
 reviewed_by text, reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(scenario_id,variant_id,goal_id),
 UNIQUE(scenario_id,variant_id,slot),
 CONSTRAINT omerta_goal_review_consistency CHECK (
  (review_status='verified')=(reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
 )
);
ALTER TABLE igr_private.igr_omerta_verdict_goal_axes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_omerta_verdict_goal_axes FROM public,anon,authenticated;
CREATE OR REPLACE FUNCTION igr_private.igr_omerta_verdict_goal_mapping_ready(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $check$
SELECT coalesce(count(*)=3 AND bool_and(
 (select count(*) from pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c)=
 (select count(*) from igr_private.igr_omerta_verdict_goal_axes g
   where g.scenario_id=m.scenario_id and g.variant_id=m.variant_id
     and g.review_status='verified' and g.manuscript_md5=m.content_md5
     and exists(select 1 from pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c
       where (c->>'slot')::integer=g.slot and c->'verdict_goal'->>'goal_id'=g.goal_id)
     and m.manuscript->'canonical_truth'->'responsibility_by_act' ? g.act_axis)
),false)
FROM igr_private.igr_omerta_santoro_v25_drafts m
WHERE m.scenario_id=p_scenario AND m.variant_id IN ('A','B','C')
$check$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_verdict_goal_mapping_ready(text)
 FROM public,anon,authenticated;

-- An accidentally enabled release switch can never bypass the new mapping
-- review. All 3 variants must be complete, reviewed, and pinned to checksums.
CREATE OR REPLACE FUNCTION igr_private.igr_omerta_standalone_can_start(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $can$
 SELECT coalesce(
  (select c.enabled FROM igr_private.igr_omerta_standalone_release_control c WHERE c.id=1),false)
 AND coalesce(igr_private.igr_omerta_editorial_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_structural_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_verdict_goal_mapping_ready(p_scenario),false)
$can$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_standalone_can_start(text)
 FROM public,anon,authenticated;
