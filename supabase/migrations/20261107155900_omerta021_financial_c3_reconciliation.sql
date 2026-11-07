-- Align financial C3 evidence with the current 021 Santoro canon (not Verri/V99).
-- Kept unapproved until human editorial review and multiplayer verification.
WITH source_patch AS (SELECT x FROM jsonb_array_elements('[{"variant":"A","s":[{"event_id":"A-C3-01","fact":"Le créancier civil a enregistré 16 000 dollars reçus en paiement d’une dette du crew.","origin":"Registre de quittances du créancier civil","independent_of":"Relevé de présence du service de livraison"},{"event_id":"A-C3-02","fact":"Un service civil de livraison atteste qu’une seconde remise a bien eu lieu.","origin":"Registre de présence du service civil de livraison","independent_of":"Registre de quittances du créancier"}]},{"variant":"B","s":[{"event_id":"B-C3-01","fact":"Les 46 000 dollars de la collecte ont été intégralement reçus au dépôt de substitution.","origin":"Reçu du dépôt civil de substitution","independent_of":"Carnet de prise en charge du transporteur tiers"},{"event_id":"B-C3-02","fact":"Le messager est arrivé au dépôt de substitution à l’heure indiquée.","origin":"Carnet de prise en charge d’un transporteur tiers","independent_of":"Comptabilité et personnel du dépôt de substitution"}]},{"variant":"C","s":[{"event_id":"C-C3-01","fact":"Un comptage externe atteste le dépôt de 36 000 dollars réellement reçus.","origin":"Comptage indépendant du dépôt","independent_of":"Comptabilité des deux commerçants"},{"event_id":"C-C3-02","fact":"Deux commerçants attestent que 10 000 dollars restaient promis et non payés ce vendredi.","origin":"Pièces comptables indépendantes des commerçants","independent_of":"Comptage du dépôt et registre du crew"}]}]'::jsonb) x)
UPDATE igr_private.igr_omerta_v29_c3_review r SET
 sources=source_patch.x->'s',
 manuscript_md5=m.content_md5,
 review_status='review',
 review_notes='Deux sources financières indépendantes cohérentes avec le manuscrit Santoro V25. Ne prouvent pas les coups ni leur commandite. Validation éditoriale encore requise.',
 reviewed_by=NULL,reviewed_at=NULL
FROM source_patch,igr_private.igr_omerta_santoro_v25_drafts m
WHERE r.scenario_id='021' AND m.scenario_id=r.scenario_id
AND r.variant_id=m.variant_id AND source_patch.x->>'variant'=r.variant_id;
DO $check$ DECLARE n integer; BEGIN
SELECT count(*) INTO n FROM igr_private.igr_omerta_v29_c3_review r
JOIN igr_private.igr_omerta_santoro_v25_drafts m USING(scenario_id,variant_id)
WHERE r.scenario_id='021'
AND r.review_status='review'
AND r.manuscript_md5=m.content_md5
AND jsonb_array_length(r.sources)=2
AND (SELECT count(*) FROM jsonb_array_elements(r.sources) s
 WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(m.manuscript->'canonical_truth'->'timeline') t
 WHERE t->>'id'=s->>'event_id'))=2;
IF n<>3 THEN RAISE EXCEPTION '021 C3 evidence does not match canonical IDs';END IF;
END $check$;