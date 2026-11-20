-- v811 QA finishing patch: keep every authored trame concise and remove internal C1/C2/C3 prefixes.
WITH base_change AS (
 UPDATE public.igr_v4_scenario_packs p SET pack=jsonb_set(p.pack,'{trames,1,text}',to_jsonb('Un ami doit de l’argent à Maël. Après 02 h 55, une voix inconnue ordonne d’effacer quelque chose. Des bruits de lutte suivent.'::text)),updated_at=now()
 WHERE scenario_id='001' AND pack->'trames'->1->>'title'='DETTE ET ENREGISTREMENT' AND pack->'trames'->1->>'text'='Des messages confirment qu’un ami doit de l’argent à Maël. Après 02 h 55, un enregistrement capte un ordre d’effacer quelque chose et une lutte. Les voix ne sont pas identifiées.' RETURNING scenario_id
), edits(scenario_id,variant_id,field,ord,old_title,old_text,new_title,new_text) AS (VALUES
('001','A','v3_runtime_trames',2,'DETTE ET ENREGISTREMENT','Des messages confirment qu’un ami doit de l’argent à Maël. Après 02 h 55, une voix demande d’effacer quelque chose, puis une lutte éclate. La voix n’est pas identifiée.','DETTE ET ENREGISTREMENT','Un ami doit de l’argent à Maël. Après 02 h 55, une voix inconnue ordonne d’effacer quelque chose. Des bruits de lutte suivent.'),
('016','B','v470_runtime_trames',1,'C1 · Une séquence interrompue','La vidéo montre les violences, mais pas le meurtre. On ignore qui a frappé après la coupure.','UNE SÉQUENCE INTERROMPUE','La vidéo montre les violences, mais pas le meurtre. On ignore qui a frappé après la coupure.'),
('016','B','v470_runtime_trames',2,'C2 · Un retour dissimulé','L’organisateur quitte les lieux, puis revient après l’arrêt de la caméra.','UN RETOUR APRÈS LA COUPURE','L’organisateur quitte les lieux, puis revient après l’arrêt de la caméra.'),
('016','B','v470_runtime_trames',3,'C3 · L''alibi contredit par un témoin','Un témoin contredit l’alibi de l’organisateur. Les relevés confirment son retour.','ALIBI CONTREDIT','Un témoin contredit l’alibi de l’organisateur. Les relevés confirment son retour.')
), fields AS (
 SELECT m.scenario_id,m.variant_id,k.key,jsonb_agg(CASE WHEN e.scenario_id IS NOT NULL THEN jsonb_set(jsonb_set(t.item,'{title}',to_jsonb(e.new_title),true),'{text}',to_jsonb(e.new_text),true) ELSE t.item END ORDER BY t.ord) arr,count(e.scenario_id) changed
 FROM igr_private.igr_v99_variant_manuscripts m CROSS JOIN LATERAL jsonb_each(m.manuscript) k(key,payload)
 CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN k.key~'_runtime_trames$' AND jsonb_typeof(k.payload)='array' THEN k.payload ELSE '[]'::jsonb END) WITH ORDINALITY t(item,ord)
 LEFT JOIN edits e ON e.scenario_id=m.scenario_id AND e.variant_id=m.variant_id AND e.field=k.key AND e.ord=t.ord AND e.old_title=t.item->>'title' AND e.old_text=t.item->>'text'
 WHERE m.scenario_id IN ('001','016') AND k.key~'_runtime_trames$' GROUP BY m.scenario_id,m.variant_id,k.key
), by_m AS (SELECT scenario_id,variant_id,jsonb_object_agg(key,arr) patches,sum(changed) n FROM fields GROUP BY scenario_id,variant_id), saved AS (
 UPDATE igr_private.igr_v99_variant_manuscripts m SET manuscript=m.manuscript||b.patches,updated_at=now() FROM by_m b WHERE m.scenario_id=b.scenario_id AND m.variant_id=b.variant_id AND b.n>0 RETURNING b.n
) SELECT (SELECT count(*) FROM base_change) base_fixed,coalesce((SELECT sum(n) FROM saved),0) variant_fixed;
