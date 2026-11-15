-- Regime preflight read-only v9
WITH cases(sid) AS (VALUES ('032'),('033'),('034')),
v(variant_id) AS (VALUES ('A'),('B'),('C')),
draft AS (
SELECT cases.sid, v.variant_id, m.editorial_status,
 coalesce((m.manuscript->>'human_review_approved')::boolean,false) human_ok,
 m.manuscript
FROM cases CROSS JOIN v
LEFT JOIN igr_private.igr_v99_variant_manuscripts m
 ON m.scenario_id=cases.sid AND m.variant_id=v.variant_id
), ch AS (
SELECT sid, variant_id, 'manuscript present' gate, (manuscript is not null) ok FROM draft
UNION ALL SELECT sid,variant_id,'editorial approval',
 coalesce(editorial_status='approved' AND human_ok,false) FROM draft
UNION ALL SELECT sid,NULL::text,'Judge mandatory at minimum',
 public.igr_v4_role_capacity(sid,public.igr_v4_min_players(sid),'juge')=1 FROM cases
UNION ALL SELECT sid,NULL::text,'Six-player minimum',
 public.igr_v4_min_players(sid)=6 FROM cases
UNION ALL SELECT sid,NULL::text,'Authoritative Regime runtime present',
 EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'igr_%regime_%') FROM cases
UNION ALL SELECT sid,NULL::text,'Private manuscripts protected',
 NOT has_table_privilege('anon','igr_private.igr_v99_variant_manuscripts','SELECT')
 AND NOT has_table_privilege('authenticated','igr_private.igr_v99_variant_manuscripts','SELECT') FROM cases
)
SELECT sid,coalesce(variant_id,'GLOBAL') variant_id,gate,coalesce(ok,false) ok
FROM ch ORDER BY sid,variant_id,gate;
