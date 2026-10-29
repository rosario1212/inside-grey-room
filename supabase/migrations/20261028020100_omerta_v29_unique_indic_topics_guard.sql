-- Omerta V29: 'three topics' means THREE DIFFERENT, authored facts,
-- not three copies of the same tip or auto-generated placeholders.
CREATE OR REPLACE FUNCTION igr_private.igr_omerta_v29_indic_topics_ready(p_scenario text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $topics$
 SELECT coalesce(count(*)=3 AND bool_and(
   NOT EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(m.manuscript->'private_cards') card
    WHERE NOT EXISTS(
      SELECT 1
      FROM igr_private.igr_omerta_v29_indic_topics i
      WHERE i.scenario_id=m.scenario_id AND i.variant_id=m.variant_id
        AND i.role_slot=(card->>'slot')::int
        AND i.source_manuscript_md5=m.content_md5
      GROUP BY i.scenario_id,i.variant_id,i.role_slot
      HAVING count(*)=3
        AND count(*) FILTER(WHERE i.review_status='verified')=3
        AND count(DISTINCT lower(btrim(i.topic_text)))=3
        AND count(DISTINCT btrim(i.topic_title))=3
        AND count(DISTINCT i.source_event_id)>=2
    )
   )
 ),false)
 FROM igr_private.igr_omerta_santoro_v25_drafts m
 WHERE m.scenario_id=p_scenario AND m.variant_id IN('A','B','C')
$topics$;
REVOKE ALL ON FUNCTION igr_private.igr_omerta_v29_indic_topics_ready(text)
 FROM public,anon,authenticated;
