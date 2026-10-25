CREATE OR REPLACE FUNCTION igr_private.igr_v600_020_safe_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v600_020_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='020' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v600_verdict')<>'object'
  OR NOT (m->'v600_verdict') ?& ARRAY['ignition','exits','maintenance','evacuation']
  OR (SELECT count(*) FROM jsonb_object_keys(m->'v600_verdict'))<>4

 THEN RAISE EXCEPTION '017 incomplete narrative or expert evidence';END IF;
 p:=jsonb_set(p,'{truth,reconstruction_020}',m->'v600_verdict',true);
 RETURN p || jsonb_build_object(
 'expert_actions',m->'v600_expert_actions',
 'news',jsonb_build_array(
  jsonb_build_object('id','017-news-1','title','LE BAL DES FONDATEURS','text','327 personnes sont mortes. La Grey Room doit expliquer la chaîne des événements.'),
  jsonb_build_object('id','017-news-2','title','LES SORTIES ET LES ALARMES','text','Les restrictions d’accès et le fonctionnement de l’alarme sont à distinguer du départ de feu.'),
  jsonb_build_object('id','017-news-3','title','UNE CATASTROPHE COLLECTIVE','text','Aucun acteur ne peut être jugé sur un simple soupçon : chaque décision nécessite une preuve et une chronologie.')
 ),
 'journalist_leads',m->'v600_journalist_leads');
END $function$
