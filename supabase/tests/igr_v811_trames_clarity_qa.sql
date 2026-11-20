-- Read-only editorial regression for v811, live Supabase.
-- This is a content check, not a substitute for a live phone playtest.
WITH base AS (
 SELECT p.scenario_id,a.ord::int ord,a.item->>'title' title,a.item->>'text' body
 FROM public.igr_v4_scenario_packs p CROSS JOIN LATERAL jsonb_array_elements(p.pack->'trames') WITH ORDINALITY a(item,ord)
), variant AS (
 SELECT m.scenario_id,m.variant_id,k.key field,a.ord::int ord,a.item->>'title' title,a.item->>'text' body
 FROM igr_private.igr_v99_variant_manuscripts m CROSS JOIN LATERAL jsonb_each(m.manuscript) k(key,payload)
 CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN k.key~'_runtime_trames$' AND jsonb_typeof(k.payload)='array' THEN k.payload ELSE '[]'::jsonb END
 ) WITH ORDINALITY a(item,ord)
), checks AS (
 SELECT
 (SELECT count(*)=316 FROM base) base_count_ok,
 (SELECT count(distinct scenario_id)=44 FROM base) base_scenarios_ok,
 (SELECT count(*)=204 FROM variant) variant_count_ok,
 (SELECT count(distinct scenario_id)=20 FROM variant) variant_scenarios_ok,
 (SELECT count(*)=count(distinct scenario_id||'|'||ord) FROM base) base_unique_ok,
 (SELECT count(*)=count(distinct scenario_id||'|'||variant_id||'|'||field||'|'||ord) FROM variant) variant_unique_ok,
 (SELECT bool_and(length(body)<=150 AND length(trim(body))>0 AND length(trim(title))>0) FROM base) base_short_ok,
 (SELECT bool_and(length(body)<=160 AND length(trim(body))>0 AND length(trim(title))>0) FROM variant) variant_short_ok,
 (SELECT count(*)=0 FROM base WHERE scenario_id='010' AND (title~*'morte après' OR body~*'Nora est morte')) nora_base_ok,
 (SELECT count(*)=0 FROM variant WHERE scenario_id='010' AND (title~*'n.a pas sauv|morte après' OR body~*'Nora est morte')) nora_variants_ok,
 (SELECT count(*)=0 FROM variant WHERE title~'^C[123][[:space:]]*[·—-]' OR title~'H\+[0-9]+' OR body~'H\+[0-9]+') internal_label_free,
 (SELECT count(distinct body)=3 FROM variant WHERE scenario_id='006' AND ord=3 AND field='v260_runtime_trames') cendres_endings_distinct,
 (SELECT count(*)=1 FROM variant WHERE scenario_id='004' AND variant_id='C' AND ord=3 AND body ILIKE '%demande de secours%') sofia_c3_concrete
)
SELECT *, (base_count_ok AND base_scenarios_ok AND variant_count_ok AND variant_scenarios_ok
 AND base_unique_ok AND variant_unique_ok AND base_short_ok AND variant_short_ok
 AND nora_base_ok AND nora_variants_ok AND internal_label_free
 AND cendres_endings_distinct AND sofia_c3_concrete) AS overall_pass
FROM checks;
