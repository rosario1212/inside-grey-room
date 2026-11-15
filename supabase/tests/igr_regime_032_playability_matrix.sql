-- LE RÉGIME 032 : énumération exhaustive de 4^3 choix d'investigation.
-- Pure lecture sur trois drafts privés : n'active aucun pack et ne révèle
-- ni les responsables ni les preuves. Le camp enquête ne choisit qu'une
-- investigation facultative par cycle ; les 3 trames garanties s'ajoutent.
WITH drafts AS (
 SELECT variant_id AS v,manuscript->'regime_vnext' AS d
 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='032' AND variant_id IN ('A','B','C')
   AND manuscript->'regime_vnext'->>'status'='draft'
),
combos AS (
 SELECT d.v,d.d,i AS c1,j AS c2,k AS c3
 FROM drafts d
 CROSS JOIN generate_series(0,3) i
 CROSS JOIN generate_series(0,3) j
 CROSS JOIN generate_series(0,3) k
),
available AS (
 SELECT c.v,c.c1,c.c2,c.c3,e.value AS evidence
 FROM combos c
 CROSS JOIN LATERAL jsonb_array_elements(c.d->'revelations') e
 WHERE e.value->>'kind'='guaranteed'
    OR e.value->>'id'=c.d->'investigation_choices'->0->'choices'->c.c1->>'deliverable_id'
    OR e.value->>'id'=c.d->'investigation_choices'->1->'choices'->c.c2->>'deliverable_id'
    OR e.value->>'id'=c.d->'investigation_choices'->2->'choices'->c.c3->>'deliverable_id'
),
act_scores AS (
 SELECT c.v,c.c1,c.c2,c.c3,a.value->>'id' AS act_id,
   count(DISTINCT ev.evidence->>'origin')
     FILTER (WHERE ev.evidence->'act_ids' ? (a.value->>'id'))>=2 AS supported
 FROM combos c
 CROSS JOIN LATERAL jsonb_array_elements(c.d->'acts') a
 LEFT JOIN available ev ON ev.v=c.v AND ev.c1=c.c1 AND ev.c2=c.c2 AND ev.c3=c.c3
 GROUP BY c.v,c.c1,c.c2,c.c3,a.value->>'id'
),
scores AS (
 SELECT v,c1,c2,c3,count(*) FILTER (WHERE supported)::int AS supported_acts
 FROM act_scores
 GROUP BY v,c1,c2,c3
)
SELECT v AS variant,
 count(*)::int AS tested_choices,
 min(supported_acts) AS minimum_supported_acts,
 max(supported_acts) AS maximum_supported_acts,
 count(*) FILTER (WHERE supported_acts>=3)::int AS potentially_winnable,
 count(*) FILTER (WHERE supported_acts=4)::int AS full_reconstruction_possible,
 (count(*)=64 AND min(supported_acts)<=2 AND max(supported_acts)=4
  AND count(*) FILTER(WHERE supported_acts>=3)>0
  AND count(*) FILTER(WHERE supported_acts>=3)<64)::boolean AS balanced
FROM scores
GROUP BY v
ORDER BY v;