-- Regime preflight read-only v9
WITH cases(sid) AS (VALUES ('032'),('033'),('034')),
v(variant_id) AS (VALUES ('A'),('B'),('C')),
draft AS (
SELECT cases.sid, v.variant_id, m.editorial_status, m.approved_at,
 coalesce((m.manuscript->>'human_review_approved')::boolean,false) human_ok,
 m.manuscript
FROM cases CROSS JOIN v
LEFT JOIN igr_private.igr_v99_variant_manuscripts m
 ON m.scenario_id=cases.sid AND m.variant_id=v.variant_id
), ch AS (
SELECT sid, variant_id, 'manuscript present' gate, (manuscript is not null) ok FROM draft
UNION ALL SELECT sid,variant_id,'editorial approval',
 coalesce(editorial_status='ready' AND human_ok AND manuscript->>'status'='ready',false) FROM draft
UNION ALL SELECT sid,variant_id,'new Regime candidate staged privately',
       coalesce(manuscript->'regime_vnext'->>'status'='draft',false) FROM draft
UNION ALL SELECT sid,variant_id,'candidate promoted and editorially approved',
       coalesce(editorial_status='ready' AND approved_at IS NOT NULL
         AND manuscript->>'human_review_approved'='true'
         AND manuscript->>'status'='ready',false) FROM draft
UNION ALL SELECT sid,variant_id,'Fugitive role identities use new canon',
CASE sid
WHEN '032' THEN lower(coalesce(manuscript->'private_cards'->0->>'identity','')) LIKE '%directeur%'
 AND lower(coalesce(manuscript->'private_cards'->1->>'identity','')) LIKE '%ministre%'
WHEN '033' THEN lower(coalesce(manuscript->'private_cards'->0->>'identity','')) LIKE '%fils%'
 AND lower(coalesce(manuscript->'private_cards'->1->>'identity','')) LIKE '%défense%'
WHEN '034' THEN lower(coalesce(manuscript->'private_cards'->0->>'identity','')) LIKE '%président%'
 AND lower(coalesce(manuscript->'private_cards'->1->>'identity','')) LIKE '%gendre%'
ELSE false END FROM draft
UNION ALL SELECT sid,variant_id,'034 legacy Notaire/Heritier code names removed',
CASE WHEN sid<>'034' THEN true ELSE
 coalesce(manuscript::text !~* '(notaire|l[’'']héritier)',false) END FROM draft
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
