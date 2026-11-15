-- Regime v12: enumerate all 4^3=64 investigation selections across 9 PRIVATE drafts.
-- Read only; reports only source-coverage statistics, never hidden assignments.
WITH draft AS (
 SELECT scenario_id sid,variant_id v,manuscript->'regime_vnext' d
 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id IN ('032','033','034') AND
       manuscript->'regime_vnext'->>'status'='draft'
), choice AS (
 SELECT d.sid,d.v,d.d,c1,c2,c3 FROM draft d
 CROSS JOIN generate_series(0,3) c1
 CROSS JOIN generate_series(0,3) c2
 CROSS JOIN generate_series(0,3) c3
), evidence AS (
 SELECT c.sid,c.v,c.c1,c.c2,c.c3,e.value evidence
 FROM choice c
 CROSS JOIN LATERAL jsonb_array_elements(c.d->'revelations') e
 WHERE e.value->>'kind'='guaranteed'
    OR e.value->>'id'=c.d->'investigation_choices'->0->'choices'->c.c1->>'deliverable_id'
    OR e.value->>'id'=c.d->'investigation_choices'->1->'choices'->c.c2->>'deliverable_id'
    OR e.value->>'id'=c.d->'investigation_choices'->2->'choices'->c.c3->>'deliverable_id'
), a AS (
 SELECT c.sid,c.v,c.c1,c.c2,c.c3,act.value->>'id' act,
 count(distinct e.evidence->>'origin') FILTER (WHERE e.evidence->'act_ids' ? (act.value->>'id'))>=2 supported
 FROM choice c CROSS JOIN LATERAL jsonb_array_elements(c.d->'acts') act
 LEFT JOIN evidence e ON e.sid=c.sid AND e.v=c.v AND e.c1=c.c1 AND e.c2=c.c2 AND e.c3=c.c3
 GROUP BY c.sid,c.v,c.c1,c.c2,c.c3,act.value->>'id'
), score AS (
 SELECT sid,v,c1,c2,c3,count(*) FILTER (WHERE supported)::int supported_acts
 FROM a GROUP BY sid,v,c1,c2,c3
)
SELECT sid scenario_id,v variant,
 count(*)::int selections,
 min(supported_acts) minimum_supported,
 max(supported_acts) maximum_supported,
 count(*) FILTER (WHERE supported_acts>=3)::int source_paths_for_three,
 count(*) FILTER (WHERE supported_acts=4)::int source_paths_for_four,
 count(*) FILTER (WHERE supported_acts<3)::int source_paths_insufficient,
 count(*)=64 AND min(supported_acts)>=3 AND max(supported_acts)=4 AS fair_access
FROM score GROUP BY sid,v ORDER BY sid,v;