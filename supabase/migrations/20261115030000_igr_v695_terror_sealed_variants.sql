BEGIN;

-- TERREUR V695: sealed replay variants; no private manuscript or key is exposed to the API.
CREATE TABLE IF NOT EXISTS igr_private.igr_v695_terror_room_packs(
 room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 scenario_id text NOT NULL,
 variant_id text NOT NULL CHECK (variant_id IN ('A','B','C')),
 pack jsonb NOT NULL,
 manuscript_md5 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v695_terror_room_packs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v695_terror_room_packs FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v695_release_eligible()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE valid_count int; distinct_patterns int;
BEGIN
 SELECT count(*),count(distinct (d.scenario_id||':'||(d.proposed_manuscript->'canonical_truth'->'responsibility_by_slot')::text))
 INTO valid_count,distinct_patterns
 FROM igr_private.igr_v680_terror_editorial_drafts d
 WHERE d.scenario_id IN ('026','027','028') AND d.variant_id IN ('A','B','C')
  AND d.editorial_status='review_ready'
  AND coalesce(jsonb_array_length(d.proposed_manuscript->'v680_private_cards'),0)=3
  AND coalesce(jsonb_array_length(d.proposed_manuscript->'v680_investigations'),0)=20
  AND coalesce(jsonb_array_length(d.proposed_manuscript->'v680_guaranteed_trames'),0)=9
  AND d.proposed_manuscript->'canonical_truth'->'responsibility_by_slot'
      =d.proposed_manuscript->'v680_verdict'->'levels'
  AND coalesce(length(d.proposed_manuscript->'canonical_truth'->>'summary'),0)>120
  AND (d.proposed_manuscript->'invariants_respected' IS NULL OR
     (jsonb_typeof(d.proposed_manuscript->'invariants_respected')='array'
      AND jsonb_array_length(d.proposed_manuscript->'invariants_respected')>=3));
 RETURN valid_count=9 AND distinct_patterns=9
   AND (SELECT count(DISTINCT d.scenario_id||d.variant_id)
        FROM igr_private.igr_v680_terror_editorial_drafts d
        WHERE d.scenario_id IN ('026','027','028'))=9;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v695_release_eligible() FROM PUBLIC,anon,authenticated;

-- Validated private editor draft -> one immutable, room-scoped scenario pack.
CREATE OR REPLACE FUNCTION igr_private.igr_v695_build_pack(p_sid text,p_v jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE original jsonb; cards jsonb:='[]'::jsonb;rels jsonb:='{}'::jsonb;
 trames jsonb:='[]'::jsonb; levels jsonb:='[]'::jsonb; steps jsonb:='[]'::jsonb;
 card jsonb; item jsonb; rec record; relation jsonb; kind_ text;
 truth_ jsonb; clean_text text;
BEGIN
 SELECT pack INTO original FROM public.igr_v4_scenario_packs WHERE scenario_id=p_sid;
 IF original IS NULL OR p_v IS NULL THEN RAISE EXCEPTION 'missing canonical pack';END IF;
 FOR card IN SELECT value FROM jsonb_array_elements(p_v->'v680_private_cards')
  ORDER BY (value->>'slot')::int LOOP
  cards:=cards||jsonb_build_array(jsonb_build_object(
   'place',card->>'identity','anchors',card->>'what_you_know',
   'hide',card->>'what_you_hide','chronology',card->>'your_chronology',
   'objective_main',card->>'objective','position',card->>'objective',
   'conversation_hooks',coalesce(card->'conversation_hooks','[]'::jsonb)));
 END LOOP;
 IF jsonb_array_length(cards)<>3 THEN RAISE EXCEPTION 'invalid private cards';END IF;
 FOR rec IN SELECT key,value FROM jsonb_each(p_v->'relationships') LOOP
  SELECT coalesce(jsonb_agg(jsonb_build_object('slot',(a->>'target_slot')::int,
     'text',coalesce(a->>'known_fact','')||E'\n\n'||coalesce(a->>'conversation_tension',''))
     ORDER BY ord),'[]'::jsonb) INTO relation
  FROM jsonb_array_elements(rec.value) WITH ORDINALITY AS t(a,ord);
  rels:=jsonb_set(rels,ARRAY[rec.key],relation,true);
 END LOOP;
 FOR rec IN SELECT key,value FROM jsonb_each(p_v->'canonical_truth'->'responsibility_by_slot')
  ORDER BY key::int LOOP
   levels:=levels||jsonb_build_array((rec.value#>>'{}')::int);
 END LOOP;
 IF levels <> (SELECT jsonb_agg((p_v->'v680_verdict'->'levels'->>n::text)::int ORDER BY n)
    FROM generate_series(1,3) n)
 THEN RAISE EXCEPTION 'conflicting responsibility levels';END IF;
 SELECT coalesce(jsonb_agg(value->>'what' ORDER BY ord),'[]'::jsonb)
 INTO steps FROM jsonb_array_elements(p_v->'canonical_truth'->'timeline')
 WITH ORDINALITY AS t(value,ord);
 FOR item IN SELECT value FROM jsonb_array_elements(p_v->'v680_investigations') LOOP
  IF coalesce((item->>'core')::boolean,false) THEN CONTINUE;END IF;
  clean_text:=split_part(item->>'result',' — Ce que cela peut changer face au FDR : ',1);
  kind_:=CASE item->>'difficulty'
    WHEN 'clarity' THEN 'clarity' WHEN 'ambiguity' THEN 'ambiguity'
    ELSE 'balanced' END;
  trames:=trames||jsonb_build_array(jsonb_build_object(
   'id',item->>'public_id','title',item->>'title','text',clean_text,
   'min_cycle',(item->>'cycle')::int,
   'kind',kind_,'axes',jsonb_build_array(coalesce(item->>'axis','chronologie'))));
 END LOOP;
 IF jsonb_array_length(trames)<>11 THEN RAISE EXCEPTION 'optional investigation count mismatch';END IF;
 truth_:=coalesce(original->'truth','{}'::jsonb) ||
   jsonb_build_object('summary',p_v->'canonical_truth'->>'summary','levels',levels,
     'cinematic',coalesce(original#>'{truth,cinematic}','{}'::jsonb) ||
       jsonb_build_object('timeline',steps));
 RETURN original||jsonb_build_object(
  'suspects',cards,'relations',rels,'trames',trames,'truth',truth_);
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v695_build_pack(text,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v695_pin_room(p_room text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE r public.igr_v4_rooms%rowtype; d igr_private.igr_v680_terror_editorial_drafts%rowtype;
 snap igr_private.igr_v695_terror_room_packs%rowtype; content_ jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room)) FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'lobby' THEN RETURN false;END IF;
 SELECT * INTO snap FROM igr_private.igr_v695_terror_room_packs WHERE room_code=r.code;
 IF FOUND THEN RETURN snap.scenario_id=r.scenario_id AND
  snap.manuscript_md5=md5(snap.pack::text);END IF;
 IF NOT igr_private.igr_v695_release_eligible() THEN RETURN false;END IF;
 SELECT * INTO d FROM igr_private.igr_v680_terror_editorial_drafts x
 WHERE x.scenario_id=r.scenario_id AND x.variant_id IN ('A','B','C')
  AND x.editorial_status='review_ready'
 ORDER BY pg_catalog.gen_random_uuid() LIMIT 1;
 IF NOT FOUND THEN RETURN false;END IF;
 content_:=igr_private.igr_v695_build_pack(r.scenario_id,d.proposed_manuscript);
 INSERT INTO igr_private.igr_v695_terror_room_packs
 (room_code,scenario_id,variant_id,pack,manuscript_md5)
 VALUES(r.code,r.scenario_id,d.variant_id,content_,md5(content_::text));
 RETURN true;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v695_pin_room(text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v695_pinned_pack(p_room text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE snap igr_private.igr_v695_terror_room_packs%rowtype;
BEGIN
 SELECT * INTO snap FROM igr_private.igr_v695_terror_room_packs
 WHERE room_code=upper(trim(p_room));
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF snap.manuscript_md5<>md5(snap.pack::text) THEN
  RAISE EXCEPTION 'terror canonical snapshot failed checksum';END IF;
 RETURN snap.pack;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v695_pinned_pack(text) FROM PUBLIC,anon,authenticated;

-- The nine guaranteed core investigations are all released to the investigation
-- team: exactly three per cycle. Optional investigations remain adaptive.
CREATE OR REPLACE FUNCTION igr_private.igr_v695_emit_guaranteed(p_room text,p_cycle int)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE snap igr_private.igr_v695_terror_room_packs%rowtype;
 d igr_private.igr_v680_terror_editorial_drafts%rowtype; e jsonb; num int:=0;
 code_ text; prose_ text;
BEGIN
 SELECT * INTO snap FROM igr_private.igr_v695_terror_room_packs
 WHERE room_code=p_room;
 IF NOT FOUND THEN RETURN 0;END IF;
 SELECT * INTO d FROM igr_private.igr_v680_terror_editorial_drafts
 WHERE scenario_id=snap.scenario_id AND variant_id=snap.variant_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'sealed variant missing';END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(d.proposed_manuscript->'v680_guaranteed_trames')
  WHERE (value->>'cycle')::int=p_cycle ORDER BY value->>'public_id' LOOP
   code_:=e->>'public_id';
   IF EXISTS(SELECT 1 FROM public.igr_v4_events t WHERE t.room_code=p_room
      AND t.cycle=p_cycle AND t.event_type='trame'
      AND t.payload->>'public_id'=code_) THEN CONTINUE;END IF;
   prose_:=split_part(e->>'text',' — Ce que cela peut changer face au FDR : ',1);
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
   VALUES(p_room,'trame','roles',
     ARRAY['enqueteur','analyste','procureur','inspecteur','expert']::text[],
     p_cycle,jsonb_build_object('public_id',code_,'title',e->>'title',
       'text',prose_,'cycle',p_cycle,'source',e->>'source',
       'investigation_type','guaranteed','canonical_verified',true));
   num:=num+1;
 END LOOP;
 RETURN num;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v695_emit_guaranteed(text,integer) FROM PUBLIC,anon,authenticated;

-- Reversible baseline backups. All mutations are restricted to the exact functions.
CREATE TABLE IF NOT EXISTS igr_private.igr_v695_function_backups(
 signature text PRIMARY KEY,definition text NOT NULL,saved_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE igr_private.igr_v695_function_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v695_function_backups FROM PUBLIC,anon,authenticated;

DO $patch$
DECLARE sig text;fn text;n int;
BEGIN
 FOR sig IN SELECT unnest(ARRAY[
 'public.igr_v4_start_game(text,uuid)',
 'public.igr_v4_build_private_card(text,uuid)',
 'public.igr_omerta_legacy_sync_core(text,uuid)',
 'public.igr_v4_emit_trame(text)',
 'public.igr_v4_make_reveal(text)',
 'igr_private.igr_v681_terror_dynamic_room()'
 ]) LOOP
  INSERT INTO igr_private.igr_v695_function_backups(signature,definition)
  SELECT sig,pg_get_functiondef(sig::regprocedure) ON CONFLICT DO NOTHING;
 END LOOP;

 -- The snapshot must exist before the loop that builds secret suspect cards.
 sig:='public.igr_v4_start_game(text,uuid)';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'for idx in 0..c - 1 loop')=0 THEN RAISE EXCEPTION 'start-game anchor missing';END IF;
 fn:=replace(fn,'for idx in 0..c - 1 loop',
   'if r.scenario_id in (''026'',''027'',''028'') then '||
   'if not igr_private.igr_v695_pin_room(r.code) then raise exception ''TERREUR variants unavailable'';end if;end if;'||
   E'\n  for idx in 0..c - 1 loop');
 EXECUTE fn;

 -- Replace only the pack source; each player receives only their own secret card.
 sig:='public.igr_v4_build_private_card(text,uuid)';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'if p.public_role=''suspect'' then')=0 THEN RAISE EXCEPTION 'private-card anchor missing';END IF;
 fn:=replace(fn,'if p.public_role=''suspect'' then',
  'if r.scenario_id in (''026'',''027'',''028'') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;'||
  E' if p.public_role=''suspect'' then');
 EXECUTE fn;

 -- The public sync continues to redact truth until room.status=finished.
 sig:='public.igr_omerta_legacy_sync_core(text,uuid)';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'select coalesce(jsonb_agg(jsonb_build_object(''id'',id,')=0
 THEN RAISE EXCEPTION 'sync-core anchor missing';END IF;
 fn:=replace(fn,'select coalesce(jsonb_agg(jsonb_build_object(''id'',id,',
  'if r.scenario_id in (''026'',''027'',''028'') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;'||
  E'\n select coalesce(jsonb_agg(jsonb_build_object(''id'',id,');
 EXECUTE fn;

 -- All new evidence is read from the room snapshot, never from a global A-only pack.
 sig:='public.igr_v4_emit_trame(text)';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'v_used := coalesce(')=0 THEN RAISE EXCEPTION 'trame source anchor missing';END IF;
 fn:=replace(fn,'v_used := coalesce(',
   'if v_room.scenario_id in (''026'',''027'',''028'') then '||
   'v_pack:=coalesce(igr_private.igr_v695_pinned_pack(v_room.code),v_pack);'||
   'perform igr_private.igr_v695_emit_guaranteed(v_room.code,v_room.cycle);end if;'||
   E'\n  v_used := coalesce(');
 EXECUTE fn;

 sig:='public.igr_v4_make_reveal(text)';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'truth_levels := coalesce(')=0 THEN RAISE EXCEPTION 'reveal source anchor missing';END IF;
 fn:=replace(fn,'truth_levels := coalesce(',
  'if r.scenario_id in (''026'',''027'',''028'') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;'||
   E'\n  truth_levels := coalesce(');
 EXECUTE fn;

 -- The terminal war bulletin needs the same selected truth as the final verdict.
 sig:='igr_private.igr_v681_terror_dynamic_room()';
 SELECT pg_get_functiondef(sig::regprocedure) INTO fn;
 IF strpos(fn,'FROM public.igr_v4_scenario_packs')=0
 OR strpos(fn,'WHERE scenario_id=new.scenario_id;')=0
 THEN RAISE EXCEPTION 'terror terminal truth anchor missing';END IF;
 fn:=replace(fn,
  'SELECT pack->''truth''->''levels'' INTO truth_levels FROM public.igr_v4_scenario_packs'||
   E'\n    WHERE scenario_id=new.scenario_id;',
  'SELECT coalesce(igr_private.igr_v695_pinned_pack(new.code)->''truth''->''levels'',pack->''truth''->''levels'')'||
   ' INTO truth_levels FROM public.igr_v4_scenario_packs'||
   E'\n    WHERE scenario_id=new.scenario_id;');
 EXECUTE fn;
END $patch$;

-- The release indicator is server-side, never accessible to clients.
DO $audit$
BEGIN
 IF NOT igr_private.igr_v695_release_eligible() THEN
  RAISE EXCEPTION '9 terror drafts failed release integrity validation';
 END IF;
END $audit$;
COMMIT;
