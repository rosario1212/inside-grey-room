-- v770 — Preserve the original private author's dialogue prompts whether
-- phrased as a question or as an imperative ("Demande au...").
-- Does not change authored truth, variant gating, authorization or public API.
DO $migration$
DECLARE
  original_definition text;
  exact_old text := 'a.value ~ ''\?$''';
  exact_new text := '(a.value ~ ''\?$'' OR a.value ~* ''^(Demande|Questionne|Confronte|Interroge) '')';
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO original_definition
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='igr_private' AND p.proname='igr_v769_authored_supplement';
  IF original_definition IS NULL THEN
    RAISE EXCEPTION 'Missing v769 manuscript guard';
  END IF;
  IF pg_catalog.strpos(original_definition,'a.value ~*')>0 THEN RETURN; END IF;
  IF pg_catalog.strpos(original_definition,exact_old)=0 THEN
    RAISE EXCEPTION 'Unexpected v769 dialogue selection revision';
  END IF;
  EXECUTE pg_catalog.replace(original_definition,exact_old,exact_new);
END
$migration$;
