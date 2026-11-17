-- IGR v769 — Reuse the already-authored (and room-pinned) private dossiers.
-- Private only. Never read the other suspects' cards; never amend public facts,
-- canonical truth, investigation sources or role/victory conditions.
-- Old room snapshots are pinned by scenario/variant. If this match cannot be
-- proven, return the original private card with no supplement.

CREATE OR REPLACE FUNCTION igr_private.igr_v769_authored_supplement(
  p_room text,p_player uuid,p_scenario text,p_private jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_room text := pg_catalog.upper(pg_catalog.btrim(p_room));
  v_slot integer;
  v_variant text;
  v_source jsonb;
  v_card jsonb;
  v_older jsonb;
  v_table text;
  v_matches integer:=0;
  v_story text;
  v_questions jsonb:='[]'::jsonb;
BEGIN
  IF p_player IS NULL OR p_scenario IS NULL
     OR pg_catalog.jsonb_typeof(p_private) IS DISTINCT FROM 'object'
     OR p_scenario IN ('005','006','021','022','023','024','025','030','031','032','033','034')
  THEN RETURN p_private;END IF;

  -- Both the room AND the authorized player must agree with the calling sync.
  SELECT p.internal_slot INTO v_slot
  FROM public.igr_v4_players p
  WHERE p.id=p_player AND p.room_code=v_room
    AND p.public_role='suspect' AND p.internal_slot>=1;
  IF v_slot IS NULL THEN RETURN p_private;END IF;

  SELECT c.manuscript,c.variant_id INTO v_source,v_variant
  FROM igr_private.igr_v99_room_canons c
  WHERE c.room_code=v_room AND c.scenario_id=p_scenario
    AND pg_catalog.md5(c.manuscript::text)=c.manuscript_md5;

  IF v_source IS NULL AND p_scenario BETWEEN '008' AND '020' THEN
    v_table:=CASE p_scenario
      WHEN '008' THEN 'igr_v301_008_room_snapshots'
      WHEN '009' THEN 'igr_v331_009_room_snapshots'
      WHEN '010' THEN 'igr_v351_010_room_snapshots'
      WHEN '011' THEN 'igr_v371_011_room_snapshots'
      WHEN '012' THEN 'igr_v391_012_room_snapshots'
      WHEN '013' THEN 'igr_v411_013_room_snapshots'
      WHEN '014' THEN 'igr_v431_014_room_snapshots'
      WHEN '015' THEN 'igr_v451_015_room_snapshots'
      WHEN '016' THEN 'igr_v481_016_room_snapshots'
      WHEN '017' THEN 'igr_v521_017_room_snapshots'
      WHEN '018' THEN 'igr_v541_018_room_snapshots'
      WHEN '019' THEN 'igr_v571_019_room_snapshots'
      WHEN '020' THEN 'igr_v601_020_room_snapshots'
      ELSE NULL END;
    IF v_table IS NULL THEN RETURN p_private;END IF;
    EXECUTE pg_catalog.format(
      'SELECT variant_id FROM igr_private.%I WHERE room_code=$1',v_table)
      INTO v_variant USING v_room;
    IF v_variant NOT IN ('A','B','C') THEN RETURN p_private;END IF;
    SELECT m.manuscript INTO v_source
    FROM igr_private.igr_v99_variant_manuscripts m
    WHERE m.scenario_id=p_scenario AND m.variant_id=v_variant;
  END IF;
  IF v_source IS NULL OR v_variant NOT IN ('A','B','C') OR
    pg_catalog.jsonb_typeof(v_source->'private_cards') IS DISTINCT FROM 'array'
  THEN RETURN p_private;END IF;

  SELECT e.value INTO v_card
  FROM pg_catalog.jsonb_array_elements(v_source->'private_cards') e(value)
  WHERE e.value->>'slot'=v_slot::text LIMIT 1;
  IF v_card IS NULL THEN RETURN p_private;END IF;

  -- The pinned pack may have an editorial revision after the manuscript was
  -- written. Never transplant text into a card unless two of its own facts
  -- match exactly. Different/older truth versions are intentionally skipped.
  IF p_private->>'place'=v_card->>'identity' THEN v_matches:=v_matches+1;END IF;
  IF p_private->>'anchors'=v_card->>'what_you_know' THEN v_matches:=v_matches+1;END IF;
  IF p_private->>'hide'=v_card->>'what_you_hide' THEN v_matches:=v_matches+1;END IF;
  IF p_private->>'chronology'=v_card->>'your_chronology' THEN v_matches:=v_matches+1;END IF;
  IF v_matches<2 THEN RETURN p_private;END IF;

  v_story:=pg_catalog.btrim(coalesce(v_card->>'story',''));
  IF pg_catalog.length(v_story)>65
    AND pg_catalog.length(v_story)<=2500
    AND coalesce(p_private->>'story','')=''
  THEN
    p_private:=pg_catalog.jsonb_set(p_private,'{v769_story}',
      pg_catalog.to_jsonb(v_story),true);
  END IF;

  -- Questions belong to THIS player's authored private card, not to the
  -- answer key or anyone else's story. They are framed as questions, never
  -- presented as proven observations.
  IF pg_catalog.jsonb_typeof(v_card->'conversation_hooks')='array' THEN
    SELECT coalesce(pg_catalog.jsonb_agg(q.value ORDER BY q.ord),'[]'::jsonb)
      INTO v_questions
    FROM (
      SELECT a.value,a.ord
      FROM pg_catalog.jsonb_array_elements_text(v_card->'conversation_hooks')
        WITH ORDINALITY AS a(value,ord)
      WHERE pg_catalog.length(pg_catalog.btrim(a.value)) BETWEEN 12 AND 190
        AND a.value ~ '\?$'
      ORDER BY a.ord LIMIT 2
    ) q;
  END IF;
  IF pg_catalog.jsonb_array_length(v_questions)>0 THEN
    p_private:=pg_catalog.jsonb_set(p_private,'{v769_questions}',v_questions,true);
  END IF;
  RETURN p_private;
END
$fn$;

REVOKE ALL ON FUNCTION igr_private.igr_v769_authored_supplement(text,uuid,text,jsonb) FROM PUBLIC;

-- Keep existing authenticated sync and its overlays exactly as-is.
-- Only enrich the requesting suspect's already-authorized private_state.
DO $migration$
DECLARE
  definition text;
  anchor text:=' raw:=public.igr_omerta_standalone_safe_sync(p_code,p_player_token);';
  addition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO definition
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='igr_v4_sync';
  IF definition IS NULL THEN RAISE EXCEPTION 'Missing authorized sync';END IF;
  IF pg_catalog.strpos(definition,'igr_v769_authored_supplement')>0 THEN RETURN;END IF;
  IF pg_catalog.strpos(definition,anchor)=0
     OR pg_catalog.strpos(definition,'igr_v765_alias_document')=0
     OR pg_catalog.strpos(definition,'igr_v764_visible_suspect_card')=0
  THEN RAISE EXCEPTION 'Unexpected sync revision: refuse unsafe replacement';END IF;
  addition:=anchor||E'\n'
   ||E' if raw->''player''->>''public_role''=''suspect''\n'
   ||E'    and raw->''room''->>''status'' in (''playing'',''finished'')\n'
   ||E'    and pg_catalog.jsonb_typeof(raw#>''{player,private_state}'')=''object'' then\n'
   ||E'  raw:=pg_catalog.jsonb_set(raw,''{player,private_state}'',\n'
   ||E'    igr_private.igr_v769_authored_supplement(p_code,\n'
   ||E'      (raw#>>''{player,id}'')::uuid,\n'
   ||E'      raw->''room''->>''scenario_id'',\n'
   ||E'      raw#>''{player,private_state}''),true);\n'
   ||E' end if;';
  EXECUTE pg_catalog.replace(definition,anchor,addition);
END
$migration$;
