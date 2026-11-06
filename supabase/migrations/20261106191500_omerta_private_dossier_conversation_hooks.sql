-- Narrowly extend the existing authenticated, role-scoped dossier response.
-- No new public query and no access to other suspects' cards.
DO $migrate$
DECLARE
  definition text;
  existing text := '''relations'',coalesce(card->''relations'',''[]''::jsonb),';
  additional text := existing || E'\n   ''conversation_hooks'',coalesce(card->''conversation_hooks'',''[]''::jsonb),';
BEGIN
  definition:=pg_get_functiondef('public.igr_omerta_my_private_dossier(text,uuid)'::regprocedure);
  IF definition LIKE '%''conversation_hooks'',coalesce(card->''conversation_hooks''%' THEN RETURN; END IF;
  IF position(existing IN definition)=0 THEN RAISE EXCEPTION 'private dossier allowlist differs; stop'; END IF;
  IF position('p.public_role<>''suspect''' IN definition)=0 THEN RAISE EXCEPTION 'suspect-only access guard missing'; END IF;
  EXECUTE replace(definition,existing,additional);
END $migrate$;
