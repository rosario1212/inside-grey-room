-- Omerta Santoro V29: precise act/objective review and independent knowledge.
-- PRIVATE metadata only; narrative manuscript records stay in igr_private.
-- Semantic approval MUST NOT be inferred from a simple SQL shape check.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_v29_precise_act_review(
 scenario_id text NOT NULL CHECK(scenario_id IN('021','022','023','024','025')),
 variant_id text NOT NULL CHECK(variant_id IN('A','B','C')),
 goal_id text NOT NULL, slot integer NOT NULL CHECK(slot BETWEEN 1 AND 7),
 act_code text NOT NULL, public_act_label text NOT NULL,
 source_manuscript_md5 text NOT NULL,
 review_status text NOT NULL DEFAULT 'review' CHECK(review_status IN('review','verified','rejected')),
 reviewed_by text, reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(scenario_id,variant_id,goal_id),
 UNIQUE(scenario_id,variant_id,act_code),
 UNIQUE(scenario_id,variant_id,slot),
 CHECK((review_status='verified')=(reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
ALTER TABLE igr_private.igr_omerta_v29_precise_act_review ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE igr_private.igr_omerta_v29_precise_act_review FROM public,anon,authenticated;

-- These are *editorial candidates*, not three automatically verified facts.
-- Missing authoring cannot be silently replaced by repeating the same clue.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_v29_indic_topics(
 scenario_id text NOT NULL CHECK(scenario_id IN('021','022','023','024','025')),
 variant_id text NOT NULL CHECK(variant_id IN('A','B','C')),
 role_slot integer NOT NULL CHECK(role_slot BETWEEN 1 AND 7),
 topic_slot integer NOT NULL CHECK(topic_slot BETWEEN 1 AND 3),
 topic_id text NOT NULL, topic_title text,
 topic_text text, source_event_id text,
 source_manuscript_md5 text NOT NULL,
 review_status text NOT NULL DEFAULT 'pending'
 CHECK(review_status IN('pending','verified','needs_authoring','rejected')),
 reviewed_by text, reviewed_at timestamptz,
 PRIMARY KEY(scenario_id,variant_id,role_slot,topic_slot),
 UNIQUE(scenario_id,variant_id,topic_id),
 CHECK((review_status='verified')=(reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK(review_status<>'verified' OR
   (nullif(btrim(topic_title),'') IS NOT NULL
    AND nullif(btrim(topic_text),'') IS NOT NULL
    AND nullif(btrim(source_event_id),'') IS NOT NULL))
);
ALTER TABLE igr_private.igr_omerta_v29_indic_topics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE igr_private.igr_omerta_v29_indic_topics FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_omerta_v29_precise_goals_ready(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $precise$
 SELECT coalesce(count(*)=3 AND bool_and(
    (SELECT count(*) FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c) =
    (SELECT count(*) FROM igr_private.igr_omerta_v29_precise_act_review g
     WHERE g.scenario_id=m.scenario_id AND g.variant_id=m.variant_id
       AND g.review_status='verified' AND g.source_manuscript_md5=m.content_md5
       AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c
        WHERE (c->>'slot')::integer=g.slot AND c->'verdict_goal'->>'goal_id'=g.goal_id))
 ),false)
 FROM igr_private.igr_omerta_santoro_v25_drafts m
 WHERE m.scenario_id=p_scenario AND m.variant_id IN('A','B','C')
$precise$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_v29_precise_goals_ready(text)
 FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_omerta_v29_indic_topics_ready(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $topics$
 SELECT coalesce(count(*)=3 AND bool_and(
   (SELECT count(*) FROM igr_private.igr_omerta_v29_indic_topics i
     WHERE i.scenario_id=m.scenario_id AND i.variant_id=m.variant_id
       AND i.review_status='verified'
       AND i.source_manuscript_md5=m.content_md5
       AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c
         WHERE (c->>'slot')::integer=i.role_slot
           AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(
             m.manuscript->'canonical_truth'->'timeline') t
             WHERE t->>'id'=i.source_event_id)))
      = 3*(SELECT count(*) FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') c)
 ),false)
 FROM igr_private.igr_omerta_santoro_v25_drafts m
 WHERE m.scenario_id=p_scenario AND m.variant_id IN('A','B','C')
$topics$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_v29_indic_topics_ready(text)
 FROM public,anon,authenticated;

-- Defense in depth: even switching enabled=true by mistake is insufficient.
CREATE OR REPLACE FUNCTION igr_private.igr_omerta_standalone_can_start(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $can$
 SELECT coalesce((SELECT c.enabled FROM igr_private.igr_omerta_standalone_release_control c
    WHERE c.id=1),false)
 AND coalesce(igr_private.igr_omerta_editorial_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_structural_preflight(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_verdict_goal_mapping_ready(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_verdict_truth_mapping_ready(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_v29_precise_goals_ready(p_scenario),false)
 AND coalesce(igr_private.igr_omerta_v29_indic_topics_ready(p_scenario),false)
$can$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_standalone_can_start(text)
 FROM public,anon,authenticated;
