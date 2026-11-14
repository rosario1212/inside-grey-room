
BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v675_020_live_backup(
 variant_id text PRIMARY KEY, manuscript jsonb NOT NULL,
 editorial_status text,approved_by text,approved_at timestamptz,
 original_md5 text, captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v675_020_live_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v675_020_live_backup FROM public,anon,authenticated;
INSERT INTO igr_private.igr_v675_020_live_backup(variant_id,manuscript,editorial_status,approved_by,approved_at,original_md5)
SELECT variant_id,manuscript,editorial_status,approved_by,approved_at,content_md5
FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='020'
ON CONFLICT(variant_id) DO NOTHING;
CREATE TABLE IF NOT EXISTS igr_private.igr_v675_020_public_backup(
 scenario_id text PRIMARY KEY, pack jsonb NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v675_020_public_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v675_020_public_backup FROM public,anon,authenticated;
INSERT INTO igr_private.igr_v675_020_public_backup(scenario_id,pack)
SELECT scenario_id,pack FROM public.igr_v4_scenario_packs WHERE scenario_id='020'
ON CONFLICT(scenario_id) DO NOTHING;
DO $verify$
DECLARE d record;cy integer;
BEGIN
 IF (SELECT count(*) FROM igr_private.igr_v670_020_editorial_drafts)<>3
 THEN RAISE EXCEPTION '020 missing private candidates';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_rooms WHERE scenario_id='020' AND status='playing')
 THEN RAISE EXCEPTION '020 playing room cannot switch manuscript';END IF;
 IF (SELECT count(distinct proposed_manuscript#>>'{v600_verdict,ignition}')
  FROM igr_private.igr_v670_020_editorial_drafts)<>3
 THEN RAISE EXCEPTION '020 ignitions must be distinct';END IF;
 FOR d IN SELECT variant_id,original_md5,proposed_manuscript m,
   (SELECT content_md5 FROM igr_private.igr_v99_variant_manuscripts v
     WHERE v.scenario_id='020' AND v.variant_id=t.variant_id) as live_md5
   FROM igr_private.igr_v670_020_editorial_drafts t
 LOOP
  IF d.original_md5<>d.live_md5
    OR jsonb_array_length(d.m->'v670_investigations')<>20
    OR jsonb_array_length(d.m->'v670_runtime_trames')<>6
    OR jsonb_array_length(d.m->'v670_private_cards')<>4
    OR jsonb_array_length(d.m->'v670_field_actions')<>15
    OR jsonb_array_length(d.m->'v670_expert_actions')<>6
    OR jsonb_array_length(d.m->'v670_journalist_leads')<>3
    OR (SELECT count(distinct e->>'id') FROM jsonb_array_elements(d.m->'v670_investigations') e)<>20
    OR (SELECT count(*) FROM jsonb_array_elements(d.m->'v670_investigations') e WHERE coalesce((e->>'core')::boolean,false))<>9
    OR (d.m#>>'{v601_approval,owner_authorized}')<>'true'
  THEN RAISE EXCEPTION '020 corrupt candidate %',d.variant_id;END IF;
  FOR cy IN 1..3 LOOP
   IF (SELECT count(*) FROM jsonb_array_elements(d.m->'v670_investigations') e WHERE (e->>'cycle')::int=cy)
     <>(7-(cy=1)::integer)
   OR (SELECT count(*) FROM jsonb_array_elements(d.m->'v670_investigations') e WHERE (e->>'cycle')::int=cy AND (e->>'core')::boolean)<>3
   OR (SELECT count(*) FROM jsonb_array_elements(d.m->'v670_runtime_trames') e WHERE (e->>'min_cycle')::int=cy AND (e->>'guaranteed')::boolean)<>2
   THEN RAISE EXCEPTION '020 evidence invalid: variant % cycle %',d.variant_id,cy;END IF;
  END LOOP;
 END LOOP;
 IF has_table_privilege('anon','igr_private.igr_v670_020_editorial_drafts','select')
 THEN RAISE EXCEPTION '020 draft exposed publicly';END IF;
END; $verify$;
-- Remove the obsolete public single-cause spoiler, retaining required base-core metadata.
UPDATE public.igr_v4_scenario_packs p
SET pack=(p.pack-'truth'-'trames'-'news')||jsonb_build_object(
 'truth','{}'::jsonb,
 'news','[]'::jsonb,
 'context','Le Bal des Fondateurs a fait 327 morts. L origine du feu, la disponibilité des issues, les protections et les décisions d évacuation sont à établir séparément.',
 'trames',jsonb_build_array(
  jsonb_build_object('title','UN BÂTIMENT OCCUPÉ','text','La capacité des passages et les règles de circulation exigent une vérification indépendante.','min_cycle',1,'kind','balanced','axes',jsonb_build_array('acces')),
  jsonb_build_object('title','DES RÉSERVES À CONTRÔLER','text','Plusieurs éléments techniques doivent être rapprochés des documents de préparation.','min_cycle',2,'kind','balanced','axes',jsonb_build_array('materiel')),
  jsonb_build_object('title','UNE CHRONOLOGIE À VÉRIFIER','text','Le traitement des alertes et la diffusion des instructions doivent être confrontés aux journaux.','min_cycle',3,'kind','balanced','axes',jsonb_build_array('chronologie'))
 ),
 'suspects',jsonb_build_array(
  jsonb_build_object('place','Responsable de l exploitation','chronology','Tu participais aux décisions sur les accès et les autorisations du gala.','hide','Certaines décisions ne figurent pas intégralement dans le dossier public.','anchors','Tu connaissais le plan d accueil.','position','Expliquer les contraintes et les arbitrages de gestion.','objective_main','Distinguer tes responsabilités de celles des autres acteurs.'),
  jsonb_build_object('place','Contractant de sécurité incendie','chronology','Tu assurais une partie des contrôles avant la soirée.','hide','Le suivi des réserves doit être précisé.','anchors','Tu disposais des rapports techniques.','position','Expliquer les contrôles effectués.','objective_main','Établir les limites de tes obligations techniques.'),
  jsonb_build_object('place','Coordinateur de sécurité','chronology','Tu recevais les alertes et gérais les annonces pendant le gala.','hide','Tu n as pas détaillé tous les échanges du poste.','anchors','Tu connaissais les procédures et le dispositif de coordination.','position','Justifier la réponse aux alertes.','objective_main','Distinguer les signaux reçus des décisions prises.'),
  jsonb_build_object('place','Activiste infiltré','chronology','Tu étais présent clandestinement dans des secteurs réservés.','hide','Tu as menti sur une partie de tes déplacements.','anchors','Ta présence ne suffit pas à établir le mécanisme du feu.','position','Expliquer ton entrée et tes gestes vérifiables.','objective_main','Défendre ta version sans effacer les traces de ton intrusion.')
 )) WHERE scenario_id='020';

WITH prepared AS (
 SELECT d.variant_id,
 (d.proposed_manuscript-
 'v670_investigations'-'v670_runtime_trames'-'v670_private_cards'-
 'v670_field_actions'-'v670_expert_actions'-'v670_journalist_leads'-
 'v670_press_news'-'v670_editorial_status') ||
 jsonb_build_object(
  'v600_investigations',(SELECT jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^020_[ABC]_','020_')),true) ORDER BY ord)
    FROM jsonb_array_elements(d.proposed_manuscript->'v670_investigations') WITH ORDINALITY t(e,ord)),
  'v600_runtime_trames',(SELECT jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^020_[ABC]_','020_')),true) ORDER BY ord)
    FROM jsonb_array_elements(d.proposed_manuscript->'v670_runtime_trames') WITH ORDINALITY t(e,ord)),
  'private_cards',(SELECT jsonb_agg(orig.e||neu.e ORDER BY orig.ord)
    FROM jsonb_array_elements(d.original_manuscript->'private_cards') WITH ORDINALITY orig(e,ord)
    JOIN jsonb_array_elements(d.proposed_manuscript->'v670_private_cards') WITH ORDINALITY neu(e,ord)
    ON orig.ord=neu.ord),
  'v600_field_actions',(SELECT jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^020_[ABC]_','020_')),true) ORDER BY ord)
    FROM jsonb_array_elements(d.proposed_manuscript->'v670_field_actions') WITH ORDINALITY t(e,ord)),
  'v600_expert_actions',(SELECT jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^020_[ABC]_','020_')),true) ORDER BY ord)
    FROM jsonb_array_elements(d.proposed_manuscript->'v670_expert_actions') WITH ORDINALITY t(e,ord)),
  'v600_journalist_leads',d.proposed_manuscript->'v670_journalist_leads',
  'v600_press_news',(SELECT jsonb_agg(jsonb_build_object(
   'id','020-press-'||ord,'title',e->>'title','text',e->>'text','min_cycle',(e->>'min_cycle')::int
   ) ORDER BY ord) FROM jsonb_array_elements(d.proposed_manuscript->'v670_runtime_trames') WITH ORDINALITY t(e,ord)),
  'v675_editorial_version','three_origins_adaptive_v675_20261114'
 ) new_manuscript
 FROM igr_private.igr_v670_020_editorial_drafts d
)
UPDATE igr_private.igr_v99_variant_manuscripts live
SET manuscript=prepared.new_manuscript,

 editorial_status='ready',approved_by='owner_authorized_release_020',
 approved_at=now(),updated_at=now()
FROM prepared WHERE live.scenario_id='020' AND live.variant_id=prepared.variant_id;

CREATE OR REPLACE FUNCTION igr_private.igr_v600_020_build_pack(p_variant text)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO 'pg_catalog'
AS $fn$
DECLARE m jsonb;base jsonb;t jsonb;choices jsonb;cards jsonb;relations jsonb;levels jsonb;i integer;
BEGIN
 IF p_variant NOT IN ('A','B','C') THEN RAISE EXCEPTION 'Invalid 020 variant';END IF;
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='020' AND variant_id=p_variant;
 IF m IS NULL THEN RAISE EXCEPTION '020 private manuscript missing';END IF;
 t:=m->'v600_runtime_trames';choices:=m->'v600_investigations';
 IF jsonb_array_length(coalesce(t,'[]'::jsonb))<>6
 OR jsonb_array_length(coalesce(choices,'[]'::jsonb))<>20
 OR jsonb_typeof(m->'v600_verdict')<>'object'
 OR NOT(m->'v600_verdict' ?& ARRAY['ignition','exits','maintenance','evacuation'])
 OR (SELECT count(*) FROM jsonb_object_keys(m->'v600_verdict'))<>4
 THEN RAISE EXCEPTION '020 private evidence pack incomplete';END IF;
 FOR i IN 1..3 LOOP
  IF (SELECT count(*) FROM jsonb_array_elements(t) e WHERE (e->>'min_cycle')::int=i AND coalesce((e->>'guaranteed')::boolean,false)
   AND length(coalesce(e->>'source',''))>20)<>2
  OR (SELECT count(*) FROM jsonb_array_elements(choices) e WHERE (e->>'cycle')::int=i)<>CASE WHEN i=1 THEN 6 ELSE 7 END
  THEN RAISE EXCEPTION '020 unsolvable cycle %',i;END IF;
 END LOOP;
 IF (SELECT count(distinct e->>'id') FROM jsonb_array_elements(choices) e)<>20
 THEN RAISE EXCEPTION '020 duplicate investigation id';END IF;
 SELECT pack INTO base FROM public.igr_v4_scenario_packs WHERE scenario_id='020';
 IF base IS NULL OR jsonb_array_length(coalesce(base->'suspects','[]'::jsonb))<>4
 THEN RAISE EXCEPTION '020 generic pack missing';END IF;
 SELECT jsonb_agg(jsonb_build_object(
  'place',e->>'identity','chronology',e->>'your_chronology',
  'hide',e->>'what_you_hide','anchors',e->>'what_you_know',
  'position',e->>'objective','slot',(e->>'slot')::int
 ) ORDER BY (e->>'slot')::int) INTO cards
 FROM jsonb_array_elements(m->'private_cards') e;
 IF jsonb_array_length(coalesce(cards,'[]'::jsonb))<>4
 THEN RAISE EXCEPTION '020 invalid private suspect cards';END IF;
 SELECT jsonb_object_agg(k,
  (SELECT jsonb_agg(jsonb_build_object(
    'slot',(a->>'target_slot')::int,
    'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
    ORDER BY (a->>'target_slot')::int)
   FROM jsonb_array_elements(v) a))
 INTO relations FROM jsonb_each(m->'relationships') z(k,v);
 IF (SELECT count(*) FROM jsonb_object_keys(relations))<>4
 THEN RAISE EXCEPTION '020 relationships missing';END IF;
 levels:=jsonb_build_array(
  (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,3}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,4}')::int);
 RETURN base || jsonb_build_object(
  'context',m->>'public_briefing','suspects',cards,
  'witnesses',coalesce(m->'v600_witnesses','[]'::jsonb),
  'relations',relations,'trames',t,'field_actions',m->'v600_field_actions',
  'investigation_020',choices,
  'truth',jsonb_build_object(
   'summary',m->'canonical_truth'->>'summary',
   'levels',levels,'reconstruction_020',m->'v600_verdict',
   'cinematic',jsonb_build_object(
     'final_line',m->>'final_reveal',
     'timeline',m->'canonical_truth'->'timeline',
     'reframes',jsonb_build_array(
       'La cause du foyer et les causes du bilan humain doivent être dissociées.',
       'Les actes et les connaissances de chaque responsable ne se confondent pas.'))
  ));
END $fn$;
CREATE OR REPLACE FUNCTION igr_private.igr_v600_020_safe_pack(p_variant text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $fn$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v600_020_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='020' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v600_verdict')<>'object'
 OR NOT(m->'v600_verdict' ?& ARRAY['ignition','exits','maintenance','evacuation'])
 OR (SELECT count(*) FROM jsonb_object_keys(m->'v600_verdict'))<>4
 THEN RAISE EXCEPTION '020 private verdict incomplete';END IF;
 RETURN p||jsonb_build_object(
   'expert_actions',m->'v600_expert_actions',
   'news',m->'v600_journalist_leads',
   'journalist_leads',m->'v600_journalist_leads'
 );
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v600_020_safe_pack(text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v601_020_release_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $fn$
DECLARE r record;n integer:=0;approved integer:=0;seen text[]:=ARRAY[]::text[];b jsonb;secure boolean;
BEGIN
 FOR r IN SELECT variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='020'
 AND variant_id IN ('A','B','C') LOOP
  n:=n+1;
  BEGIN
   b:=igr_private.igr_v600_020_safe_pack(r.variant_id);
   IF r.content_md5=md5(r.manuscript::text)
    AND jsonb_array_length(b->'trames')=6
    AND jsonb_array_length(b->'investigation_020')=20
    AND jsonb_array_length(b->'suspects')=4
    AND jsonb_typeof(b->'truth'->'reconstruction_020')='object'
    AND NOT((b#>>'{truth,reconstruction_020,ignition}')=ANY(seen))
   THEN
    seen:=array_append(seen,b#>>'{truth,reconstruction_020,ignition}');
    IF r.editorial_status='ready' AND r.approved_at IS NOT NULL
     AND r.approved_by='owner_authorized_release_020'
     AND r.manuscript#>>'{v601_approval,owner_authorized}'='true'
    THEN approved:=approved+1;END IF;
   END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
 END LOOP;
 secure:=NOT has_function_privilege('anon','igr_private.igr_v600_020_safe_pack(text)','EXECUTE')
  AND NOT has_function_privilege('authenticated','igr_private.igr_v600_020_safe_pack(text)','EXECUTE')
  AND NOT has_function_privilege('anon','igr_private.igr_v675_020_offered(text,integer)','EXECUTE');
 RETURN jsonb_build_object(
  'eligible',n=3 AND approved=3 AND array_length(seen,1)=3 AND secure
    AND public.igr_v4_min_players('020')=13 AND public.igr_v4_max_players('020')=16,
  'found',n,'approved',approved,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false
 );
END $fn$;
CREATE OR REPLACE FUNCTION public.igr_v605_020_investigate(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;
BEGIN
 IF (igr_private.igr_v601_020_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '020 not released';END IF;
 PERFORM igr_private.rate_limit('020_investigation',p_player_token::text,18,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'020' OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'not available';END IF;
 IF NOT (r.phase IN ('investigation_assembly','interrogation_select','interrogation','cycle_debrief') OR r.phase LIKE 'annex_%')
 THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF (SELECT count(*) FROM public.igr_v4_actions a WHERE a.room_code=r.code AND a.cycle=r.cycle
  AND a.action_type='investigation_020')>=2 THEN RAISE EXCEPTION 'two-choice cycle limit';END IF;
 pack:=igr_private.igr_v601_020_pinned_pack(r.code);
 IF pack IS NULL THEN RAISE EXCEPTION 'private snapshot missing';END IF;
 SELECT e INTO item FROM jsonb_array_elements(coalesce(pack->'investigation_020','[]'::jsonb)) t(e)
 WHERE e->>'id'=p_choice AND (e->>'cycle')::int=r.cycle LIMIT 1;
 IF item IS NULL THEN RAISE EXCEPTION 'invalid lead';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(igr_private.igr_v675_020_offered(r.code,r.cycle)) t(e)
 WHERE e->>'id'=p_choice) THEN RAISE EXCEPTION 'lead not offered';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'investigation_020',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 VALUES(r.code,'investigation_020','roles',ARRAY['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v605_020_investigate(text,uuid,text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v675_020_investigate_choice(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN RETURN public.igr_v605_020_investigate(p_code,p_player_token,p_choice);END $function$;
REVOKE ALL ON FUNCTION public.igr_v675_020_investigate_choice(text,uuid,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v675_020_investigate_choice(text,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v606_020_investigate_index(p_code text,p_player_token uuid,p_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;offers jsonb;choice text;
BEGIN
 IF p_index NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'invalid index';END IF;
 IF NOT EXISTS (SELECT 1 FROM public.igr_v4_players p WHERE p.room_code=upper(trim(p_code))
  AND p.player_token=p_player_token AND p.public_role IN ('enqueteur','analyste'))
 THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND OR r.scenario_id<>'020' THEN RAISE EXCEPTION 'not available';END IF;
 offers:=igr_private.igr_v675_020_offered(r.code,r.cycle);
 SELECT e->>'id' INTO choice FROM jsonb_array_elements(offers) WITH ORDINALITY t(e,ord)
 WHERE ord=p_index LIMIT 1;
 IF choice IS NULL THEN RAISE EXCEPTION 'no choice';END IF;
 RETURN public.igr_v605_020_investigate(p_code,p_player_token,choice);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v606_020_investigate_index(text,uuid,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v606_020_investigate_index(text,uuid,integer) TO anon,authenticated;
DO $replace_fn$ DECLARE old_def text;new_def text;BEGIN SELECT pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure) INTO old_def; IF old_def IS NULL THEN RAISE EXCEPTION '020 existing function missing';END IF;new_def:=old_def;
IF position(' select * into room from public.igr_v4_rooms where code=upper(trim(p_code));' in new_def)=0 THEN RAISE EXCEPTION '020 patch anchor absent'; END IF;
new_def:=replace(new_def,' select * into room from public.igr_v4_rooms where code=upper(trim(p_code));','
 if raw->''room''->>''scenario_id''=''020'' and raw->''room''->>''status''=''playing''
 and raw->''player''->>''public_role'' in (''enqueteur'',''analyste'') then
  raw:=jsonb_set(raw,''{scenario,investigation_020}'',
    igr_private.igr_v675_020_offered(p_code,(raw#>>''{room,cycle}'')::int),true);
  raw:=jsonb_set(raw,''{scenario,investigation_020_used}'',
    to_jsonb((select count(*)>=2 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>''{room,cycle}'')::int
       and a.action_type=''investigation_020'')),true);
  raw:=jsonb_set(raw,''{scenario,investigation_020_adaptive}'',''true''::jsonb,true);
 end if;
 select * into room from public.igr_v4_rooms where code=upper(trim(p_code));');
IF new_def=old_def THEN RAISE EXCEPTION '020 function not patched';END IF;EXECUTE new_def; END; $replace_fn$;
DO $replace_fn$ DECLARE old_def text;new_def text;BEGIN SELECT pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure) INTO old_def; IF old_def IS NULL THEN RAISE EXCEPTION '020 existing function missing';END IF;new_def:=old_def;
IF position('not (p_payload->''reconstruction_020'' ?& array[''ignition'',''exits'',''maintenance'',''evacuation''])) then raise exception ''invalid 020 reconstruction'';end if;' in new_def)=0 THEN RAISE EXCEPTION '020 patch anchor absent'; END IF;
new_def:=replace(new_def,'not (p_payload->''reconstruction_020'' ?& array[''ignition'',''exits'',''maintenance'',''evacuation''])) then raise exception ''invalid 020 reconstruction'';end if;','not (p_payload->''reconstruction_020'' ?& array[''ignition'',''exits'',''maintenance'',''evacuation'']) or coalesce(p_payload->''reconstruction_020''->>''ignition'','''') not in (''intentional_diversion'',''accidental_equipment_fault'',''authorized_stage_effect'') or coalesce(p_payload->''reconstruction_020''->>''exits'','''') not in (''known_restrictions'',''final_check_waived'',''restrictions_kept_after_warnings'') or coalesce(p_payload->''reconstruction_020''->>''maintenance'','''') not in (''known_repairs_deferred'',''overoptimistic_signoff'') or coalesce(p_payload->''reconstruction_020''->>''evacuation'','''') not in (''risk_underestimated'',''false_assurance_delay'',''deliberate_delay'')) then raise exception ''invalid 020 reconstruction'';end if;');
IF new_def=old_def THEN RAISE EXCEPTION '020 function not patched';END IF;EXECUTE new_def; END; $replace_fn$;

UPDATE igr_private.igr_v670_020_editorial_drafts SET editorial_status='published_verified',updated_at=now();
DO $post$
DECLARE v text;p jsonb;seen text[]:=ARRAY[]::text[];
BEGIN
 FOR v IN SELECT variant_id FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='020' ORDER BY variant_id LOOP
  p:=igr_private.igr_v600_020_safe_pack(v);
  IF jsonb_array_length(p->'investigation_020')<>20
   OR jsonb_array_length(p->'trames')<>6
   OR jsonb_array_length(p->'suspects')<>4
   OR jsonb_array_length(p->'field_actions')<>15
   OR jsonb_array_length(p->'expert_actions')<>6
   OR jsonb_array_length(p->'witnesses')<>2
   OR (SELECT count(*) FROM jsonb_object_keys(p->'truth'->'reconstruction_020'))<>4
   OR (p#>>'{truth,reconstruction_020,ignition}')=ANY(seen)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'investigation_020') e WHERE e->>'id' ~ '^020_[ABC]_')
  THEN RAISE EXCEPTION '020 invalid private live pack %',v;END IF;
  seen:=array_append(seen,p#>>'{truth,reconstruction_020,ignition}');
 END LOOP;
 IF (igr_private.igr_v601_020_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '020 release not eligible';END IF;
 IF has_function_privilege('anon','igr_private.igr_v600_020_safe_pack(text)','EXECUTE')
 OR has_function_privilege('authenticated','igr_private.igr_v675_020_offered(text,integer)','EXECUTE')
 OR has_table_privilege('anon','igr_private.igr_v670_020_editorial_drafts','SELECT')
 THEN RAISE EXCEPTION '020 protected solutions exposed';END IF;
END; $post$;
COMMIT;
