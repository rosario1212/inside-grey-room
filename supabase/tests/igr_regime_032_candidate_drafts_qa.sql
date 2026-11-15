-- LE RÉGIME 032 : lecture seule des variantes privées en staging.
-- Ne révèle ni les trames, ni les vérités, ni les noms de cachettes.
-- NE marque aucune variante comme prête et n'active aucun scénario.
WITH variants(v) AS (VALUES('A'),('B'),('C')),
m AS (
 SELECT v.v,
        x.editorial_status,x.approved_at,x.manuscript,
        x.manuscript->'regime_vnext' AS d
 FROM variants v
 LEFT JOIN igr_private.igr_v99_variant_manuscripts x
  ON x.scenario_id='032' AND x.variant_id=v.v
),
checkpoints AS (
 SELECT v, 'draft exists in private manuscript' AS check_name, d IS NOT NULL AS pass FROM m
 UNION ALL SELECT v,'legacy manuscript is still closed',
       editorial_status='review' AND approved_at IS NULL
       AND manuscript->>'human_review_approved'='false' FROM m
 UNION ALL SELECT v,'vNext is draft-only',d->>'status'='draft' AND d->>'human_review_approved'='false' FROM m
 UNION ALL SELECT v,'six roles with mandatory Judge',
       d->'participants'->>'minimum'='6'
       AND d->'participants'->'core' @> '["juge","enqueteur","analyste"]'::jsonb
       AND jsonb_array_length(d->'participants'->'core')=6 FROM m
 UNION ALL SELECT v,'two fugitives and one reachable third suspect',
       d->'private_cards'->0->>'actor_id'='vahran_director'
       AND d->'private_cards'->1->>'actor_id'='interior_minister'
       AND d->'private_cards'->2->>'actor_id'='palace_secretary'
       AND jsonb_array_length(d->'private_cards')=3 FROM m
 UNION ALL SELECT v,'four unique judicial acts',
       jsonb_array_length(d->'acts')=4
       AND (SELECT count(DISTINCT a->>'id') FROM jsonb_array_elements(d->'acts') a)=4
       AND (SELECT count(*) FROM jsonb_array_elements(d->'acts') a
             WHERE a ?& ARRAY['orderedBy','transmittedBy','executedBy','knewAndControlledBy'])=4 FROM m
 UNION ALL SELECT v,'truth references same four acts',
       d->'canonical_truth'->'acts'=d->'acts' FROM m
 UNION ALL SELECT v,'three guaranteed revelations C1 C2 C3',
       (SELECT count(*) FROM jsonb_array_elements(d->'revelations') a
        WHERE a->>'kind'='guaranteed')=3
       AND (SELECT count(distinct a->>'min_cycle') FROM jsonb_array_elements(d->'revelations') a
        WHERE a->>'kind'='guaranteed')=3 FROM m
 UNION ALL SELECT v,'exactly four optional investigations per cycle',
       (SELECT count(*) FROM jsonb_array_elements(d->'revelations') a
        WHERE a->>'kind'='optional')=12
       AND (SELECT count(DISTINCT a->>'trigger_action') FROM jsonb_array_elements(d->'revelations') a
        WHERE a->>'kind'='optional')=12
       AND jsonb_array_length(d->'investigation_choices')=3 FROM m
 UNION ALL SELECT v,'two options per fugitive in each cycle',
       (SELECT count(*) FROM jsonb_array_elements(d->'fugitive_actions') a)=12
       AND (SELECT count(distinct (a->>'actorId')||':'||(a->>'cycle'))
            FROM jsonb_array_elements(d->'fugitive_actions') a)=6 FROM m
 UNION ALL SELECT v,'all fugitive options have a bounded benefit, cost and valid cycle',
       (SELECT count(*) FROM jsonb_array_elements(d->'fugitive_actions') a
        WHERE a->'effect'->>'kind' IN ('delay_lead','shift_network','shield_contact','publish_declaration')
          AND a->'cost'->>'kind' IN ('expose_trace','lose_protection','create_contradiction')
          AND a->'availableCycles'=jsonb_build_array((a->>'cycle')::integer))=12 FROM m
 UNION ALL SELECT v,'C1 arrest possible but not automatic',
       d->'first_cycle'->>'capture_possible_on_cycle_one'='true'
       AND d->'first_cycle'->>'no_guaranteed_capture'='true'
       AND d->'first_cycle'->'available_tracks_by_alliance' ?& ARRAY['together','apart'] FROM m
 UNION ALL SELECT v,'eight capture clues with independent origins',
       jsonb_array_length(d->'capture_evidence')=8
       AND (SELECT count(DISTINCT a->>'origin') FROM jsonb_array_elements(d->'capture_evidence') a
            WHERE a->>'cycle'='1')>=2
       AND (SELECT count(*) FROM jsonb_array_elements(d->'capture_evidence') a
            WHERE a->>'cycle'='1' AND a->>'revealed_at'='fugitive_risky_action_or_confirmed_investigation')=2 FROM m
 UNION ALL SELECT v,'third suspect has a verifiable mission before C2',
       d->'third_suspect_mission'->>'assigned_path' IN ('cooperate','protect')
       AND d->'third_suspect_mission'->>'action_deadline_cycle'='2'
       AND d->'third_suspect_mission'->>'target_act_id' IN
          (SELECT a->>'id' FROM jsonb_array_elements(d->'acts') a) FROM m
 UNION ALL SELECT v,'judicial court has 14-minute long hearing',
       d->'courtroom'->>'long_if_second_capture_c3_minutes'='14'
       AND d->'courtroom'->>'long_confrontation_minutes'='5' FROM m
 UNION ALL SELECT v,'C1 risky statements explicitly unlock corroboration',
       (SELECT count(*) FROM jsonb_array_elements(d->'capture_evidence') e
         WHERE e->>'cycle'='1'
           AND e->>'trigger_action_id' IS NOT NULL
           AND e->>'alternative_investigation_id' IS NOT NULL
           AND e->>'revealed_at'='fugitive_risky_action_or_confirmed_investigation')=2 FROM m
 UNION ALL SELECT v,'both C1 fugitives retain a lower-exposure strategic choice',
       (SELECT count(*) FROM jsonb_array_elements(d->'fugitive_actions') a
         WHERE a->>'cycle'='1' AND a->'cost'->>'kind'='lose_protection'
           AND a->'reveals_capture_evidence_id' IS NULL)=2 FROM m
 UNION ALL SELECT v,'two capture histories can never share a single C1 source',
       (SELECT count(DISTINCT e->>'origin')
        FROM jsonb_array_elements(d->'capture_evidence') e
        WHERE e->>'cycle'='1')>=2 FROM m
 UNION ALL SELECT v,'cooperating third suspect owns an independently identifiable submission piece',
       CASE WHEN d->'third_suspect_mission'->>'assigned_path'='cooperate'
       THEN d->'third_suspect_mission'->'public_on_submission'->>'trigger_action'='submit_authentic_document'
        AND d->'third_suspect_mission'->'public_on_submission'->>'origin'='secretariat_original'
        AND d->'third_suspect_mission'->'public_on_submission'->>'initially_private'='true'
        AND d->'third_suspect_mission'->'public_on_submission'->'act_ids'
          @> jsonb_build_array(d->'third_suspect_mission'->>'target_act_id')
       ELSE d->'third_suspect_mission'->'defense_form'->>'kind'='defense_statement'
        AND d->'third_suspect_mission'->'defense_form'->>'required_before_cycle_end'='2'
       END FROM m
 UNION ALL SELECT v,'the legacy release preflight remains locked',
       coalesce((igr_private.igr_v100_preflight('032')->>'release_eligible')::boolean,false)=false FROM m
 UNION ALL SELECT v,'unverified C3 proof does not claim human approval',
       (SELECT count(*) FROM jsonb_array_elements(d->'revelations') a
        WHERE a->>'kind'='guaranteed' AND a->>'min_cycle'='3'
          AND a->'editorial_provenance'->>'human_source_review'='pending')=1 FROM m
)
SELECT v AS variant,check_name,coalesce(pass,false) pass
FROM checkpoints ORDER BY v,check_name;