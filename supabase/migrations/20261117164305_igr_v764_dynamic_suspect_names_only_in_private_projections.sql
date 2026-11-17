-- v764: On-screen aliases for suspect characters in dossiers 005 and 006.
-- The canonical manuscripts, pinned truth, evidence, testimony and winning
-- conditions remain unchanged. Only the requesting suspect's private card
-- in the authorized sync response receives the real players' pseudonyms.
-- Canonical non-player characters (Mara, Sofia, Noé, Maya) stay untouched.

CREATE OR REPLACE FUNCTION igr_private.igr_v764_alias_text(p_text text,p_aliases jsonb)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path TO ''
AS $fn$
DECLARE
  answer text := p_text;
  item record;
  placeholder text;
BEGIN
  IF answer IS NULL OR jsonb_typeof(p_aliases) IS DISTINCT FROM 'array' THEN
    RETURN answer;
  END IF;
  -- Two phases prevent cascade problems (e.g. a real player nicknamed Hugo
  -- acting as Eliott, or another player nicknamed Mathis).
  FOR item IN
    SELECT x.value,x.ordinality AS n
    FROM pg_catalog.jsonb_array_elements(p_aliases) WITH ORDINALITY AS x(value,ordinality)
    ORDER BY x.ordinality
  LOOP
    placeholder:='⟦IGR_V764_SLOT_'||item.n||'⟧';
    answer:=pg_catalog.regexp_replace(
      answer,
      '\m'||(item.value->>'canonical')||'\M',
      placeholder,'g');
  END LOOP;
  FOR item IN
    SELECT x.value,x.ordinality AS n
    FROM pg_catalog.jsonb_array_elements(p_aliases) WITH ORDINALITY AS x(value,ordinality)
    ORDER BY x.ordinality
  LOOP
    answer:=pg_catalog.replace(answer,
      '⟦IGR_V764_SLOT_'||item.n||'⟧',
      item.value->>'pseudo');
  END LOOP;
  RETURN answer;
END
$fn$;

CREATE OR REPLACE FUNCTION igr_private.igr_v764_alias_card(p_card jsonb,p_aliases jsonb)
RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE
SET search_path TO ''
AS $fn$
DECLARE
  result_card jsonb:=p_card;
  field_name text;
  relation_cards jsonb;
BEGIN
  IF jsonb_typeof(result_card) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_aliases) IS DISTINCT FROM 'array'
     OR p_aliases='[]'::jsonb THEN
    RETURN result_card;
  END IF;
  -- Rewrite only authored private narration, never the dynamic "pseudo"
  -- keys, IDs, publicly known source data, or canonical manuscript.
  FOREACH field_name IN ARRAY ARRAY[
   'place','identity','story','chronology','anchors','hide','position',
   'objective_main','objective_secondary','objective','goal','known',
   'secret','title','context','briefing'
  ]
  LOOP
    IF jsonb_typeof(result_card->field_name)='string' THEN
      result_card:=pg_catalog.jsonb_set(
        result_card,ARRAY[field_name],
        pg_catalog.to_jsonb(igr_private.igr_v764_alias_text(
          result_card->>field_name,p_aliases)),true);
    END IF;
  END LOOP;
  IF jsonb_typeof(result_card->'relations')='array' THEN
    SELECT coalesce(pg_catalog.jsonb_agg(
      CASE WHEN jsonb_typeof(r.rel->'text')='string'
        THEN pg_catalog.jsonb_set(r.rel,'{text}',
          pg_catalog.to_jsonb(igr_private.igr_v764_alias_text(
            r.rel->>'text',p_aliases)),true)
        ELSE r.rel END
      ORDER BY r.ord),'[]'::jsonb)
      INTO relation_cards
    FROM pg_catalog.jsonb_array_elements(result_card->'relations')
      WITH ORDINALITY AS r(rel,ord);
    result_card:=pg_catalog.jsonb_set(
      result_card,'{relations}',relation_cards,true);
  END IF;
  RETURN result_card;
END
$fn$;

CREATE OR REPLACE FUNCTION igr_private.igr_v764_visible_suspect_card(
  p_room text,p_scenario text,p_card jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path TO ''
AS $fn$
DECLARE aliases jsonb;
BEGIN
  IF p_scenario NOT IN ('005','006') THEN RETURN p_card; END IF;
  WITH names(scenario,slot,canonical) AS (
    VALUES
     ('005',1,'Lucien Varenne'),('005',1,'Lucien'),
     ('005',2,'Nils Ferrand'), ('005',2,'Nils'),
     ('005',3,'Gabriel Sorel'),('005',3,'Gabriel'),
     ('006',1,'Hugo'),('006',2,'Eliott'),('006',3,'Mathis')
  )
  SELECT coalesce(pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'canonical',n.canonical,'pseudo',p.pseudo)
    ORDER BY pg_catalog.length(n.canonical) DESC,n.slot,n.canonical),
    '[]'::jsonb)
  INTO aliases
  FROM names n
  JOIN public.igr_v4_players p
    ON p.room_code=upper(pg_catalog.btrim(p_room))
   AND p.public_role='suspect'
   AND p.internal_slot=n.slot
  WHERE n.scenario=p_scenario;
  RETURN igr_private.igr_v764_alias_card(p_card,aliases);
END
$fn$;

REVOKE ALL ON FUNCTION igr_private.igr_v764_alias_text(text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION igr_private.igr_v764_alias_card(jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION igr_private.igr_v764_visible_suspect_card(text,text,jsonb) FROM PUBLIC;

-- The existing public sync function is SECURITY DEFINER. Modify exactly
-- one authorized return projection, without overriding its other overlays.
DO $migration$
DECLARE
  fn text;
  replacement text;
  needle text := ' raw:=public.igr_omerta_standalone_safe_sync(p_code,p_player_token);';
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO fn
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='igr_v4_sync';
  IF fn IS NULL THEN RAISE EXCEPTION 'igr_v4_sync missing'; END IF;
  IF pg_catalog.strpos(fn,'igr_v764_visible_suspect_card')>0 THEN RETURN; END IF;
  IF pg_catalog.strpos(fn,needle)=0 THEN
    RAISE EXCEPTION 'igr_v4_sync expected authority hook missing';
  END IF;
  replacement:=needle||E'\n'
    ||E' if raw->''room''->>''scenario_id'' in (''005'',''006'')\n'
    ||E'    and raw->''player''->>''public_role''=''suspect''\n'
    ||E'    and raw->''room''->>''status'' in (''playing'',''finished'') then\n'
    ||E'  raw:=jsonb_set(raw,''{player,private_state}'',\n'
    ||E'   igr_private.igr_v764_visible_suspect_card(p_code,\n'
    ||E'    raw->''room''->>''scenario_id'',\n'
    ||E'    coalesce(raw#>''{player,private_state}'',''{}''::jsonb)),true);\n'
    ||E' end if;';
  EXECUTE pg_catalog.replace(fn,needle,replacement);
END
$migration$;
