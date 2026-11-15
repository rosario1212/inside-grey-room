-- LE RÉGIME v12: non-destructive QA over 9 PRIVATE unpublished candidate drafts
-- No hidden identities, source text, private answers or canonical facts are returned.
WITH ids(sid,variant_id) AS (
 SELECT sid,v FROM (VALUES ('032'),('033'),('034')) s(sid)
 CROSS JOIN (VALUES('A'),('B'),('C')) q(v)
), drafts AS (
 SELECT i.sid,i.variant_id,x.editorial_status,x.approved_at,x.manuscript,
        x.manuscript->'regime_vnext' AS d
 FROM ids i LEFT JOIN igr_private.igr_v99_variant_manuscripts x
 ON x.scenario_id=i.sid AND x.variant_id=i.variant_id
), checks AS (
 SELECT sid,variant_id,'draft exists in private schema' check_name,d IS NOT NULL ok FROM drafts
 UNION ALL SELECT sid,variant_id,'release approval remains closed',
 editorial_status='review' AND approved_at IS NULL AND
 manuscript->>'human_review_approved'='false' AND d->>'status'='draft' FROM drafts
 UNION ALL SELECT sid,variant_id,'candidate follows correct scenario and A/B/C',
 d->>'scenarioId'=sid AND d->>'id'=variant_id FROM drafts
 UNION ALL SELECT sid,variant_id,'three playable suspects with precise role IDs',
 jsonb_array_length(d->'private_cards')=3 AND
 d->'private_cards'->0->>'actor_id'=CASE sid WHEN '032' THEN 'vahran_director'
 WHEN '033' THEN 'presidential_heir' ELSE 'fallen_president' END AND
 d->'private_cards'->1->>'actor_id'=CASE sid WHEN '032' THEN 'interior_minister'
 WHEN '033' THEN 'defense_minister' ELSE 'presidential_security' END AND
 d->'private_cards'->2->>'actor_id'=CASE sid WHEN '032' THEN 'palace_secretary'
 WHEN '033' THEN 'clan_financier' ELSE 'transmission_officer' END FROM drafts
 UNION ALL SELECT sid,variant_id,'six-role design and required Judge',
 d->'participants'->>'minimum'='6'
 AND d->'participants'->'core' @> '["enqueteur","analyste","juge"]'::jsonb
 AND jsonb_array_length(d->'participants'->'core')=6 FROM drafts
 UNION ALL SELECT sid,variant_id,'four unique, fully attributed judicial acts',
 jsonb_array_length(d->'acts')=4
 AND (SELECT count(distinct a->>'id') FROM jsonb_array_elements(d->'acts') a)=4
 AND (SELECT count(*) FROM jsonb_array_elements(d->'acts') a
      WHERE a ?& ARRAY['orderedBy','transmittedBy','executedBy','knewAndControlledBy'])=4
 AND d->'canonical_truth'->'acts'=d->'acts' FROM drafts
 UNION ALL SELECT sid,variant_id,'one guaranteed document per cycle',
 (SELECT count(*) FROM jsonb_array_elements(d->'revelations') r
  WHERE r->>'kind'='guaranteed')=3
 AND (SELECT count(distinct r->>'min_cycle') FROM jsonb_array_elements(d->'revelations') r
  WHERE r->>'kind'='guaranteed')=3 FROM drafts
 UNION ALL SELECT sid,variant_id,'12 optional choices; exactly 4 per cycle',
 (SELECT count(*) FROM jsonb_array_elements(d->'revelations') r
 WHERE r->>'kind'='optional')=12 AND
 jsonb_array_length(d->'investigation_choices')=3 AND
 (SELECT count(distinct r->>'trigger_action') FROM jsonb_array_elements(d->'revelations') r
 WHERE r->>'kind'='optional')=12 AND
 (SELECT count(*) FROM jsonb_array_elements(d->'investigation_choices') v
 WHERE jsonb_array_length(v->'choices')=4)=3 FROM drafts
 UNION ALL SELECT sid,variant_id,'fugitive C1-C3 choices have legitimate costs',
 (SELECT count(*) FROM jsonb_array_elements(d->'fugitive_actions') a)=12
 AND (SELECT count(distinct (a->>'actorId')||':'||(a->>'cycle')) FROM jsonb_array_elements(d->'fugitive_actions') a)=6
 AND (SELECT count(*) FROM jsonb_array_elements(d->'fugitive_actions') a
      WHERE a->'effect'->>'kind' IN ('delay_lead','shift_network','shield_contact','publish_declaration')
      AND a->'cost'->>'kind' IN ('expose_trace','lose_protection','create_contradiction')
      AND a->'availableCycles'=jsonb_build_array((a->>'cycle')::integer))=12 FROM drafts
 UNION ALL SELECT sid,variant_id,'two fugitives each have an independent early lead',
 jsonb_array_length(d->'capture_evidence')=8 AND
 (SELECT count(*) FROM jsonb_array_elements(d->'capture_evidence') e
 WHERE e->>'cycle'='1' AND e->>'revealed_at'='fugitive_risky_action_or_confirmed_investigation'
 AND e->>'trigger_action_id' IS NOT NULL AND e->>'alternative_investigation_id' IS NOT NULL)=2
 AND (SELECT count(distinct e->>'origin') FROM jsonb_array_elements(d->'capture_evidence') e
 WHERE e->>'cycle'='1')>=2 FROM drafts
 UNION ALL SELECT sid,variant_id,'alliance both possibilities, no auto C1 capture',
 d->'first_cycle'->'available_tracks_by_alliance' ?& ARRAY['together','apart']
 AND d->'first_cycle'->>'capture_possible_on_cycle_one'='true'
 AND d->'first_cycle'->>'no_guaranteed_capture'='true' FROM drafts
 UNION ALL SELECT sid,variant_id,'third-suspect mission is verifiable before end C2',
 d->'third_suspect_mission'->>'assigned_path' IN ('cooperate','protect')
 AND d->'third_suspect_mission'->>'action_deadline_cycle'='2'
 AND d->'third_suspect_mission'->>'target_act_id' IN
 (SELECT a->>'id' FROM jsonb_array_elements(d->'acts') a) FROM drafts
 UNION ALL SELECT sid,variant_id,'tribunal long 14 minutes with 5-minute cross-examination',
 d->'courtroom'->>'long_if_second_capture_c3_minutes'='14'
 AND d->'courtroom'->>'long_confrontation_minutes'='5'
 AND d->'courtroom'->>'required_judge'='true' FROM drafts
 UNION ALL SELECT sid,variant_id,'C3 reveals one guaranteed unapproved source',
 (SELECT count(*) FROM jsonb_array_elements(d->'revelations') r
 WHERE r->>'kind'='guaranteed' AND r->>'min_cycle'='3' AND
 r->'editorial_provenance'->>'human_source_review'='pending')=1 FROM drafts
 UNION ALL SELECT sid,variant_id,'case-specific narrative title and no legacy codes',
 d->>'title'=CASE sid WHEN '032' THEN 'LES ARCHIVES DU PALAIS'
 WHEN '033' THEN 'LA DYNASTIE' ELSE 'LES NOMS QU’ILS PORTAIENT' END
 AND (sid<>'034' OR
  (d->'setting'->'codes'='["LA TÊTE","LE SCEAU","LA TOUR"]'::jsonb
  AND d::text !~* '(notaire|rempart|portrait)')) FROM drafts
 UNION ALL SELECT sid,variant_id,'secret truth remains confined to private schema',
 NOT has_table_privilege('anon','igr_private.igr_v99_variant_manuscripts','SELECT')
 AND NOT has_table_privilege('authenticated','igr_private.igr_v99_variant_manuscripts','SELECT') FROM drafts
)
SELECT sid scenario_id,variant_id,check_name,coalesce(ok,false) pass FROM checks
ORDER BY sid,variant_id,check_name;