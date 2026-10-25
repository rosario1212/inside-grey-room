
-- 016: private, scenario-pinned A/B/C evidence with locked 3-axis verdict
CREATE TABLE IF NOT EXISTS igr_private.igr_v481_016_room_snapshots(
 room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 variant_id text NOT NULL CHECK(variant_id IN ('A','B','C')),
 pack jsonb NOT NULL,
 pinned_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON igr_private.igr_v481_016_room_snapshots FROM public,anon,authenticated;

DO $setup$
DECLARE src text;
BEGIN
 src=pg_get_functiondef('igr_private.igr_v450_015_build_pack(text)'::regprocedure);
 src=replace(src,'igr_v450_015_build_pack','igr_v480_016_build_pack');
 src=replace(src,'''015''','''016''');
 src=replace(src,'015 private','016 private');
 src=replace(src,'v450_','v480_');
 src=replace(src,'reconstruction_015','reconstruction_016');
 src=replace(src,'investigation_015','investigation_016');
 src=replace(src, 'array[''authority'',''continuation'',''records'']','array[''after_video'',''death'',''warning'']');
 EXECUTE src;
END $setup$;
REVOKE ALL ON FUNCTION igr_private.igr_v480_016_build_pack(text) FROM public,anon,authenticated;

-- Neutralize the old single-ending news, journalists' clues, and add cycle-safe expert actions.
CREATE OR REPLACE FUNCTION igr_private.igr_v480_016_safe_pack(p_variant text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE p jsonb; m jsonb;
BEGIN
 p:=igr_private.igr_v480_016_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='016' AND variant_id=p_variant;
 RETURN p || jsonb_build_object(
  'news',jsonb_build_array(
   jsonb_build_object('id','n1','title','ENREGISTREMENT','text','Le film authentifié atteste un enlèvement et des violences, pas les circonstances exactes de la mort.'),
   jsonb_build_object('id','n2','title','TRAFIC CLANDESTIN','text','Une partie du matériel provient d’un circuit illicite, à distinguer de la cause du décès.'),
   jsonb_build_object('id','n3','title','PÉRIODE MANQUANTE','text','Les mouvements après la coupure doivent être corroborés par des sources indépendantes.'),
   jsonb_build_object('id','n4','title','DÉCÈS À ÉLUCIDER','text','Les conclusions médico-légales et les actes de chaque participant doivent être analysés séparément.')
  ),
  'journalist_leads',jsonb_build_array(
   jsonb_build_object('id','j1','side','enquete','title','Portée du film','result','La vidéo atteste des violences, mais sa coupure ne permet pas d’attribuer à elle seule la cause du décès.'),
   jsonb_build_object('id','j2','side','suspects','title','Préparation','result','La séquestration a été préparée avant l’arrivée de la victime. La responsabilité de ce plan est distincte des faits hors caméra.'),
   jsonb_build_object('id','j3','side','enquete','title','Contrôle des accès','result','Plusieurs déplacements sont consignés. Leur lecture exige de comparer la période filmée aux minutes non filmées.'),
   jsonb_build_object('id','j4','side','suspects','title','Chaîne du matériel','result','Le matériel a circulé entre plusieurs acteurs. Une fourniture ne suffit pas à attribuer le décès.'),
   jsonb_build_object('id','j5','side','enquete','title','Alerte','result','Un message demandant d’arrêter existe. Son heure d’envoi ne prouve pas sa lecture ni la possibilité d’une intervention.'),
   jsonb_build_object('id','j6','side','suspects','title','Expertise indispensable','result','Les causes du décès doivent être établies par une analyse indépendante des déclarations et de la vidéo.')
  ),
  'expert_actions',coalesce(m->'v480_expert_actions','[]'::jsonb)
 );
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v480_016_safe_pack(text) FROM public,anon,authenticated;

-- Rebuild 015's complete release-control and pinned-runtime contract for 016
DO $setup$
DECLARE src text; sig text;
BEGIN
 FOR sig IN SELECT unnest(ARRAY[
   'igr_private.igr_v451_015_release_status()',
   'igr_private.igr_v451_015_pin_room(text)',
   'igr_private.igr_v451_015_pinned_pack(text)'
 ]) LOOP
  src=pg_get_functiondef(sig::regprocedure);
  src=replace(src,'igr_v451_015','igr_v481_016');
  src=replace(src,'igr_v450_015_build_pack','igr_v480_016_safe_pack');
  src=replace(src,'v451_approval','v481_approval');
  src=replace(src,'v450_investigations','v480_investigations');
  src=replace(src,'investigation_015','investigation_016');
  src=replace(src,'reconstruction_015','reconstruction_016');
  src=replace(src,'''015''','''016''');
  src=replace(src,'owner_authorized_release_015','owner_authorized_release_016');
  src=replace(src,'015','016');
  -- Exactly 5-9 participants after adding one optional forensic expert.
  src=replace(src,'igr_v4_max_players(''016'')=7','igr_v4_max_players(''016'')=9');
  EXECUTE src;
 END LOOP;
END $setup$;
REVOKE ALL ON FUNCTION igr_private.igr_v481_016_release_status() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v481_016_pin_room(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v481_016_pinned_pack(text) FROM public,anon,authenticated;

-- Allow an Expert only as ninth participant, preserve all 5-8-player rosters.
DO $setup$
DECLARE src text;
BEGIN
 src=pg_get_functiondef('public.igr_v4_max_players(text)'::regprocedure);
 IF position('when p_scenario=''016'' then 8' in src)=0 THEN RAISE EXCEPTION '016 max roster anchor not found'; END IF;
 EXECUTE replace(src,'when p_scenario=''016'' then 8','when p_scenario=''016'' then 9');
 src=pg_get_functiondef('public.igr_v4_role_for_seat(text,integer,integer)'::regprocedure);
 IF position('''maitre'',''journaliste'',''juge''])[p_seat+1]' in src)=0 THEN RAISE EXCEPTION '016 role seat anchor not found';END IF;
 EXECUTE replace(src,'''maitre'',''journaliste'',''juge''])[p_seat+1]','''maitre'',''journaliste'',''juge'',''expert''])[p_seat+1]');
 src=pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure);
 IF position('when p_scenario=''027'' and p_count>=8 then 1 else 0 end' in src)=0 THEN RAISE EXCEPTION '016 expert capacity anchor not found';END IF;
 EXECUTE replace(src,'when p_scenario=''027'' and p_count>=8 then 1 else 0 end',
   'when p_scenario=''027'' and p_count>=8 then 1 when p_scenario=''016'' and p_count>=9 then 1 else 0 end');
END $setup$;

-- Add private packet references everywhere the legacy 015 runtime already uses a pinned pack.
DO $setup$
DECLARE src text; sig text; rv text; pv text; anchor text; addition text;
BEGIN
 FOREACH sig IN ARRAY ARRAY[
 'public.igr_v4_build_private_card(text,uuid)',
 'public.igr_v4_sync(text,uuid)',
 'public.igr_v4_emit_trame(text)',
 'public.igr_v4_make_reveal(text)',
 'public.igr_v52_make_reveal(text)'
 ] LOOP
 src=pg_get_functiondef(sig::regprocedure);
 rv=case when sig='public.igr_v4_emit_trame(text)' then 'v_room' else 'r' end;
 pv=case when sig='public.igr_v4_emit_trame(text)' then 'v_pack' else 'pack' end;
 anchor=format('if %s.scenario_id=''015'' then %s:=igr_private.igr_v451_015_pinned_pack(%s.code);if %s is null then raise exception ''015 private snapshot missing'';end if;end if;',rv,pv,rv,pv);
 addition=format(' if %s.scenario_id=''016'' then %s:=igr_private.igr_v481_016_pinned_pack(%s.code);if %s is null then raise exception ''016 private snapshot missing'';end if;end if;',rv,pv,rv,pv);
 IF position(addition in src)=0 THEN
  IF position(anchor in src)=0 THEN RAISE EXCEPTION '016 snapshot reader anchor missing in %',sig;END IF;
  EXECUTE replace(src,anchor,anchor||addition);
 END IF;
 END LOOP;
END $setup$;

-- Pin once at start: reconnects and rematches cannot silently switch versions.
DO $setup$
DECLARE src text; anchor text;
BEGIN
 src=pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure);
 anchor=$t$  if r.scenario_id='015' then
    if coalesce((igr_private.igr_v451_015_release_status()->>'eligible')::boolean,false) is not true then raise exception '015 gated';end if;
    if not igr_private.igr_v451_015_pin_room(r.code) then raise exception '015 snapshot unavailable';end if;
  end if;$t$;
 IF position(anchor in src)=0 THEN RAISE EXCEPTION '016 start hook missing';END IF;
 EXECUTE replace(src,anchor,anchor||$t$
  if r.scenario_id='016' then
    if coalesce((igr_private.igr_v481_016_release_status()->>'eligible')::boolean,false) is not true then raise exception '016 gated';end if;
    if not igr_private.igr_v481_016_pin_room(r.code) then raise exception '016 snapshot unavailable';end if;
  end if;$t$);
END $setup$;

-- Sync only offers the currently pinned variant's nine anonymous investigations to the investigators.
DO $setup$
DECLARE src text; anchor text; addition text;
BEGIN
 src=pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure);
 anchor=$t$'investigation_015_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_015'),$t$;
 addition=$t$
'investigation_016',case when r.scenario_id='016' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
 from jsonb_array_elements(coalesce(pack->'investigation_016','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_016_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_016'),$t$;
 IF position(addition in src)=0 THEN
  IF position(anchor in src)=0 THEN RAISE EXCEPTION '016 sync hook missing';END IF;
  EXECUTE replace(src,anchor,anchor||addition);
 END IF;
END $setup$;

-- Reuse the mature rate-limited / one-choice-per-cycle investigation implementation.
DO $setup$
DECLARE src text;
BEGIN
 src=pg_get_functiondef('public.igr_v455_015_investigate(text,uuid,text)'::regprocedure);
 src=replace(src,'igr_v455_015_investigate','igr_v485_016_investigate');
 src=replace(src,'igr_v451_015','igr_v481_016');
 src=replace(src,'investigation_015','investigation_016');
 src=replace(src,'''015''','''016''');
 src=replace(src,'015_investigation','016_investigation');
 src=replace(src,'015 not released','016 not released');
 EXECUTE src;
END $setup$;
REVOKE ALL ON FUNCTION public.igr_v485_016_investigate(text,uuid,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v485_016_investigate(text,uuid,text) TO anon,authenticated;

-- Change forensic expert and journalist actions to read 016's pinned private scenario pack, not B's stale public legacy pack.
DO $setup$
DECLARE src text; sig text; old_ text;
BEGIN
 FOREACH sig IN ARRAY ARRAY[
  'public.igr_v50_expert_state(text,uuid)',
  'public.igr_v50_expert_analyze(text,uuid,text)'
 ] LOOP
  src=pg_get_functiondef(sig::regprocedure);
  old_=$t$elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);end if;$t$;
  IF position(old_ in src)=0 THEN RAISE EXCEPTION 'Expert private reader missing %',sig;END IF;
  EXECUTE replace(src,old_,$t$elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if;$t$);
 END LOOP;
 src=pg_get_functiondef('public.igr_v50_journalist_investigate(text,uuid,text)'::regprocedure);
 old_='select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;';
 IF position(old_ in src)=0 THEN RAISE EXCEPTION 'Journalist 016 reader anchor missing';END IF;
 EXECUTE replace(src,old_,old_||' if r.scenario_id=''016'' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if;');
END $setup$;

-- Strictly three reconstruction axes, restricted to investigators and analysts.
DO $setup$
DECLARE src text; anchor text; field_ text;
BEGIN
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 IF position(anchor in src)=0 THEN RAISE EXCEPTION '016 verdict guard anchor missing';END IF;
 EXECUTE replace(src,anchor,$t$
 if r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_016')<>'object'
     or coalesce(p_payload->'reconstruction_016'->>'after_video','') not in
       ('executant_reste_seul','organisateur_revient_clandestinement','executant_n_appelle_pas_les_secours')
     or coalesce(p_payload->'reconstruction_016'->>'death','') not in
       ('executant_homicide_volontaire','organisateur_homicide_volontaire','deces_violences_sedation_sans_geste_distinct')
     or coalesce(p_payload->'reconstruction_016'->>'warning','') not in
       ('intermediaire_message_trop_tard','intermediaire_ignore_retour','intermediaire_a_ete_induit_en_erreur')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_016'))<>3
   then raise exception 'invalid 016 reconstruction';end if;
 end if;
$t$||anchor);
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 field_='''reconstruction_015'',case when r.scenario_id=''015'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_015'' else null end';
 IF position(field_ in src)=0 THEN RAISE EXCEPTION '016 final action payload anchor missing';END IF;
 EXECUTE replace(src,field_,field_||',''reconstruction_016'',case when r.scenario_id=''016'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_016'' else null end');
END $setup$;

-- Score A, B, C solely against the variant frozen in the room, never against a global answer.
DO $setup$
DECLARE src text; anchor text; closing_ text;
BEGIN
 src=pg_get_functiondef('igr_private.igr_v457_015_reveal_enrich(text,jsonb)'::regprocedure);
 src=replace(src,'igr_v457_015_reveal_enrich','igr_v487_016_reveal_enrich');
 src=replace(src,'igr_v451_015','igr_v481_016');
 src=replace(src,'reconstruction_015','reconstruction_016');
 src=replace(src,'''015''','''016''');
 src=replace(src,'015 reveal','016 reveal');
 EXECUTE src;
 src=pg_get_functiondef('public.igr_v52_make_reveal(text)'::regprocedure);
 anchor='return igr_private.igr_v457_015_reveal_enrich(p_room,';
 IF position(anchor in src)=0 THEN RAISE EXCEPTION '016 reveal wrapper missing'; END IF;
 src=replace(src,anchor,'return igr_private.igr_v487_016_reveal_enrich(p_room, igr_private.igr_v457_015_reveal_enrich(p_room,');
 closing_='''incomplete_decisions'',jsonb_array_length(absent)>0'||chr(10)||'  )))))))));';
 IF position(closing_ in src)=0 THEN RAISE EXCEPTION '016 reveal close anchor missing'; END IF;
 src=replace(src,closing_,'''incomplete_decisions'',jsonb_array_length(absent)>0'||chr(10)||'  ))))))))));');
 EXECUTE src;
END $setup$;
REVOKE ALL ON FUNCTION igr_private.igr_v487_016_reveal_enrich(text,jsonb) FROM public,anon,authenticated;

-- No new 016 rooms while publication status is incomplete.
CREATE OR REPLACE FUNCTION igr_private.igr_v489_016_room_release_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $guard$
BEGIN
 IF new.scenario_id='016' AND coalesce((igr_private.igr_v481_016_release_status()->>'eligible')::boolean,false) IS NOT TRUE
 THEN RAISE EXCEPTION 'Dossier 016 non publie' USING errcode='P0001'; END IF;
 RETURN new;
END $guard$;
REVOKE ALL ON FUNCTION igr_private.igr_v489_016_room_release_guard() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS igr_v489_016_room_release_guard ON public.igr_v4_rooms;
CREATE TRIGGER igr_v489_016_room_release_guard
BEFORE INSERT OR UPDATE OF scenario_id ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v489_016_room_release_guard();
