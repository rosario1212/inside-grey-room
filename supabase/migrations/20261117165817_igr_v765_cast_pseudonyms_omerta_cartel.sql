-- v765 — Player pseudonyms for playable named characters across the remaining
-- standalone roleplay dossiers. Do not touch private truth, role hierarchy,
-- stored snapshots, objective scoring or public investigative context.
-- 021–025: Omerta current-match cast (the Don is not a player in 021–024).
-- 030: Damián, but not his family, the NPCs or the functional codenames.

CREATE OR REPLACE FUNCTION igr_private.igr_v765_cast_aliases(
  p_room text,p_scenario text)
RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path TO ''
AS $fn$
DECLARE
  aliases jsonb:='[]'::jsonb;
BEGIN
  IF p_scenario IN ('021','022','023','024','025') THEN
    SELECT coalesce(pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('canonical',nm.name,'pseudo',p.pseudo)
      ORDER BY pg_catalog.length(nm.name) DESC,c.internal_slot,nm.name),
      '[]'::jsonb)
    INTO aliases
    FROM public.igr_v4_rooms r
    JOIN igr_private.igr_omerta_room_variant_snapshots snap
      ON snap.room_code=r.code
     AND snap.scenario_id=r.scenario_id
     AND snap.match_no=greatest(1,coalesce((r.state->>'match_no')::integer,1))
    JOIN igr_private.igr_omerta_room_cast_slots c
      ON c.room_code=r.code AND c.match_no=snap.match_no
    JOIN public.igr_v4_players p
      ON p.id=c.player_id AND p.room_code=r.code
     AND p.public_role='suspect' AND p.internal_slot=c.internal_slot
    JOIN LATERAL pg_catalog.jsonb_array_elements(
      coalesce(snap.manuscript->'private_cards','[]'::jsonb)) as actor(card)
      ON (actor.card->>'slot')::integer=c.internal_slot
    CROSS JOIN LATERAL (
      VALUES
        (pg_catalog.split_part(actor.card->>'identity',' — ',1)),
        (pg_catalog.split_part(
          pg_catalog.split_part(actor.card->>'identity',' — ',1),' ',1))
    ) as nm(name)
    WHERE r.code=upper(pg_catalog.btrim(p_room))
      AND r.scenario_id=p_scenario
      AND r.state->>'omerta_standalone'='true'
      AND pg_catalog.length(nm.name)>1;

  ELSIF p_scenario='030' THEN
    SELECT coalesce(pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('canonical',nm.name,'pseudo',p.pseudo)
      ORDER BY pg_catalog.length(nm.name) DESC),'[]'::jsonb)
    INTO aliases
    FROM public.igr_v4_players p
    CROSS JOIN (VALUES
      ('Damián « Dami » Salcedo'),('Damián'),('Dami')
    ) as nm(name)
    WHERE p.room_code=upper(pg_catalog.btrim(p_room))
      AND p.public_role='suspect' AND p.internal_slot=1;
  END IF;
  RETURN aliases;
END
$fn$;

CREATE OR REPLACE FUNCTION igr_private.igr_v765_alias_document(
  p_document jsonb,p_aliases jsonb)
RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE
SET search_path TO ''
AS $fn$
DECLARE
  result_doc jsonb:=p_document;
  field_name text;
  value_doc jsonb;
  updated_array jsonb;
BEGIN
  IF p_document IS NULL OR p_aliases IS NULL
     OR p_aliases='[]'::jsonb THEN RETURN p_document;END IF;
  IF pg_catalog.jsonb_typeof(p_document)='array' THEN
    SELECT coalesce(pg_catalog.jsonb_agg(
      CASE
        WHEN pg_catalog.jsonb_typeof(a.value)='string'
        THEN pg_catalog.to_jsonb(
          igr_private.igr_v764_alias_text(a.value#>>'{}',p_aliases))
        WHEN pg_catalog.jsonb_typeof(a.value) IN ('array','object')
        THEN igr_private.igr_v765_alias_document(a.value,p_aliases)
        ELSE a.value
      END ORDER BY a.ordinality),'[]'::jsonb)
    INTO updated_array
    FROM pg_catalog.jsonb_array_elements(p_document)
      WITH ORDINALITY AS a(value,ordinality);
    RETURN updated_array;
  END IF;
  IF pg_catalog.jsonb_typeof(p_document) IS DISTINCT FROM 'object'
  THEN RETURN p_document; END IF;

  FOR field_name IN SELECT k
    FROM pg_catalog.jsonb_object_keys(p_document) AS k
  LOOP
    value_doc:=p_document->field_name;
    -- Never alter player identifiers, pseudonyms, slots, ranks or server keys.
    IF field_name=ANY(ARRAY[
      'place','identity','story','chronology','anchors','hide','position',
      'objective_main','objective_secondary','objective','goal','known',
      'secret','title','context','briefing','what_you_know',
      'what_you_hide','your_chronology','variant_secret','text',
      'known_fact','conversation_tension','relation'
    ]) AND pg_catalog.jsonb_typeof(value_doc)='string' THEN
      result_doc:=pg_catalog.jsonb_set(result_doc,ARRAY[field_name],
        pg_catalog.to_jsonb(
          igr_private.igr_v764_alias_text(value_doc#>>'{}',p_aliases)),true);
    ELSIF field_name=ANY(ARRAY[
      'relations','conversation_hooks','variant_card'
    ]) AND pg_catalog.jsonb_typeof(value_doc) IN ('array','object') THEN
      result_doc:=pg_catalog.jsonb_set(result_doc,ARRAY[field_name],
        igr_private.igr_v765_alias_document(value_doc,p_aliases),true);
    END IF;
  END LOOP;
  RETURN result_doc;
END
$fn$;

REVOKE ALL ON FUNCTION igr_private.igr_v765_cast_aliases(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION igr_private.igr_v765_alias_document(jsonb,jsonb) FROM PUBLIC;

-- Preserve the exact existing synchronized-state function and all legacy
-- per-case overlays; inject a scoped projector immediately after the
-- authenticated source sync, never into the public scenario payload.
DO $migration$
DECLARE
  fn text;
  needle text:=' raw:=public.igr_omerta_standalone_safe_sync(p_code,p_player_token);';
  overlay text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO fn
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='igr_v4_sync';
  IF fn IS NULL THEN RAISE EXCEPTION 'Missing igr_v4_sync'; END IF;
  IF pg_catalog.strpos(fn,'igr_v765_alias_document')>0 THEN RETURN;END IF;
  IF pg_catalog.strpos(fn,needle)=0
     OR pg_catalog.strpos(fn,'igr_v764_visible_suspect_card')=0
  THEN RAISE EXCEPTION 'Unrecognized sync version; do not change authority';END IF;

  overlay:=needle||E'\n'
   ||E' if raw->''room''->>''scenario_id'' in (''021'',''022'',''023'',''024'',''025'',''030'')\n'
   ||E'    and raw->''player''->>''public_role''=''suspect''\n'
   ||E'    and raw->''room''->>''status'' in (''playing'',''finished'') then\n'
   ||E'  raw:=pg_catalog.jsonb_set(raw,''{player,private_state}'',\n'
   ||E'    igr_private.igr_v765_alias_document(\n'
   ||E'      coalesce(raw#>''{player,private_state}'',''{}''::jsonb),\n'
   ||E'      igr_private.igr_v765_cast_aliases(p_code,\n'
   ||E'        raw->''room''->>''scenario_id'')),true);\n'
   ||E' end if;';
  EXECUTE pg_catalog.replace(fn,needle,overlay);
END
$migration$;
