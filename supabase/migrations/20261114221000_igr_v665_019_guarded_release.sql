
-- Scenario 019 three distinct murderers: private guard, rollback snapshot and atomic activation.
BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v665_019_live_backup(
 variant_id text PRIMARY KEY,manuscript jsonb NOT NULL,editorial_status text,
 approved_by text,approved_at timestamptz,original_md5 text,captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v665_019_live_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v665_019_live_backup FROM public,anon,authenticated;
INSERT INTO igr_private.igr_v665_019_live_backup
 (variant_id,manuscript,editorial_status,approved_by,approved_at,original_md5)
SELECT variant_id,manuscript,editorial_status,approved_by,approved_at,content_md5
FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='019'
ON CONFLICT(variant_id) DO NOTHING;
CREATE TABLE IF NOT EXISTS igr_private.igr_v665_019_base_pack_backup(
 scenario_id text PRIMARY KEY,pack jsonb NOT NULL,captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v665_019_base_pack_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v665_019_base_pack_backup FROM public,anon,authenticated;
INSERT INTO igr_private.igr_v665_019_base_pack_backup(scenario_id,pack)
SELECT scenario_id,pack FROM public.igr_v4_scenario_packs WHERE scenario_id='019'
ON CONFLICT(scenario_id) DO NOTHING;
DO $verify$
DECLARE r record;
BEGIN
 IF (SELECT count(*) FROM igr_private.igr_v665_019_editorial_drafts)<>3 THEN
  RAISE EXCEPTION '019 candidates missing';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_rooms WHERE scenario_id='019' AND status='playing') THEN
  RAISE EXCEPTION '019 active games must not be disrupted';END IF;
 FOR r IN SELECT d.variant_id,d.original_md5,d.proposed_manuscript m,
  x.content_md5 live_md5 FROM igr_private.igr_v665_019_editorial_drafts d
 JOIN igr_private.igr_v99_variant_manuscripts x ON x.scenario_id='019' AND x.variant_id=d.variant_id
 LOOP
  IF r.original_md5<>r.live_md5 OR
    jsonb_array_length(r.m->'v570_investigations')<>20 OR
    jsonb_array_length(r.m->'v570_runtime_trames')<>3 OR
    jsonb_array_length(r.m->'v570_journal_news')<>3 OR
    jsonb_array_length(r.m->'private_cards')<>3 OR
    (SELECT count(distinct e->>'id') FROM jsonb_array_elements(r.m->'v570_investigations') e)<>20 OR
    (SELECT count(*) FROM jsonb_array_elements(r.m->'v570_investigations') e WHERE (e->>'cycle')::int=1)<>6 OR
    (SELECT count(*) FROM jsonb_array_elements(r.m->'v570_investigations') e WHERE (e->>'cycle')::int=2)<>7 OR
    (SELECT count(*) FROM jsonb_array_elements(r.m->'v570_investigations') e WHERE (e->>'cycle')::int=3)<>7 OR
    NOT (r.m->'v570_verdict' ?& array['killer','security_role','cover']) OR
    (r.m#>>'{v571_approval,owner_authorized}')<>'true'
  THEN RAISE EXCEPTION '019 private candidate failed: %',r.variant_id;END IF;
 END LOOP;
END $verify$;
DO $patch$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('igr_private.igr_v570_019_build_pack(text)'::regprocedure) INTO d; IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF; n:=d;
n:=replace(n,'jsonb_array_length(coalesce(choices,''[]''::jsonb))<>9','jsonb_array_length(coalesce(choices,''[]''::jsonb))<>20');
n:=replace(n,'(e->>''cycle'')::int=num)<>3','(e->>''cycle'')::int=num)<>(case when num=1 then 6 else 7 end)');
n:=replace(n,'count(distinct e->>''id'') from jsonb_array_elements(choices) e)<>9','count(distinct e->>''id'') from jsonb_array_elements(choices) e)<>20');
n:=replace(n,'array[''mandate'',''knowledge'',''cover'']','array[''killer'',''security_role'',''cover'']');
n:=replace(n,'''truth'',(base->''truth'')||jsonb_build_object(','''truth'',jsonb_build_object(');
n:=replace(n,'''cinematic'',jsonb_build_object(''final_line'',m->>''final_reveal'')','''cinematic'',jsonb_build_object(''final_line'',m->>''final_reveal'',''turn'',m->>''final_reveal'',''timeline'',m->''canonical_truth''->''timeline'',''characters'',private_cards,''reframes'',jsonb_build_array(''La version publique omettait une partie du rôle de la victime.'',''La pression, l’acte mortel et la dissimulation ne se confondent pas.''))');
IF n=d THEN RAISE EXCEPTION '019 canonical function unchanged';END IF;EXECUTE n;END $patch$;

CREATE OR REPLACE FUNCTION igr_private.igr_v570_019_safe_pack(p_variant text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $function$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v570_019_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='019' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v570_verdict')<>'object'
 OR NOT(m->'v570_verdict' ?& ARRAY['killer','security_role','cover'])
 OR (SELECT count(*) FROM jsonb_object_keys(m->'v570_verdict'))<>3
 THEN RAISE EXCEPTION '019 invalid private verdict';END IF;
 RETURN p||jsonb_build_object(
 'expert_actions','[]'::jsonb,
 'news',coalesce(m->'v570_journal_news','[]'::jsonb),
 'journalist_leads','[]'::jsonb
 );
END $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v570_019_safe_pack(text) FROM public,anon,authenticated;
DO $patch$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('igr_private.igr_v571_019_release_status()'::regprocedure) INTO d; IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF; n:=d;
n:=replace(n,'jsonb_array_length(b->''investigation_019'')=9','jsonb_array_length(b->''investigation_019'')=20');
IF n=d THEN RAISE EXCEPTION '019 canonical function unchanged';END IF;EXECUTE n;END $patch$;
DO $patch$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure) INTO d; IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF; n:=d;
n:=replace(n,'if r.scenario_id=''019'' and p.public_role in (''enqueteur'',''analyste'') and (jsonb_typeof(p_payload->''reconstruction_019'')<>''object'' or (select count(*) from jsonb_object_keys(p_payload->''reconstruction_019''))<>3 or not (p_payload->''reconstruction_019'' ?& array[''mandate'',''knowledge'',''cover''])) then raise exception ''invalid 019 reconstruction'';end if;','if r.scenario_id=''019'' and p.public_role in (''enqueteur'',''analyste'') and (jsonb_typeof(p_payload->''reconstruction_019'')<>''object'' or (select count(*) from jsonb_object_keys(p_payload->''reconstruction_019''))<>3 or not (p_payload->''reconstruction_019'' ?& array[''killer'',''security_role'',''cover'']) or coalesce(p_payload->''reconstruction_019''->>''killer'','''') not in (''security'',''influencer'',''institutional'') or coalesce(p_payload->''reconstruction_019''->>''security_role'','''') not in (''actual_killer'',''scene_facilitator'',''misled_operator'') or coalesce(p_payload->''reconstruction_019''->>''cover'','''') not in (''postmortem_institutional'',''altered_security_log'',''fabricated_access_log'')) then raise exception ''invalid 019 reconstruction'';end if;');
IF n=d THEN RAISE EXCEPTION '019 canonical function unchanged';END IF;EXECUTE n;END $patch$;
DO $patch$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure) INTO d; IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF; n:=d;
n:=replace(n,' select * into room from public.igr_v4_rooms where code=upper(trim(p_code));','
 if raw->''room''->>''scenario_id''=''019'' and raw->''room''->>''status''=''playing''
 and raw->''player''->>''public_role'' in (''enqueteur'',''analyste'') then
  raw:=jsonb_set(raw,''{scenario,investigation_019}'',
    igr_private.igr_v665_019_offered(p_code,(raw#>>''{room,cycle}'')::int),true);
  raw:=jsonb_set(raw,''{scenario,investigation_019_used}'',
    to_jsonb((select count(*)>=2 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>''{room,cycle}'')::int
        and a.action_type=''investigation_019'')),true);
  raw:=jsonb_set(raw,''{scenario,investigation_019_adaptive}'',''true''::jsonb,true);
 end if;
 select * into room from public.igr_v4_rooms where code=upper(trim(p_code));');
IF n=d THEN RAISE EXCEPTION '019 canonical function unchanged';END IF;EXECUTE n;END $patch$;

-- Sanitise the publicly queryable legacy generic pack: it must not retain a false one-killer finale.
UPDATE public.igr_v4_scenario_packs a SET pack=
 (a.pack-'truth'-'trames'-'news')||jsonb_build_object(
 'truth','{}'::jsonb,'trames','[]'::jsonb,'news','[]'::jsonb,
 'context','Un ancien responsable financier est tué pendant un gala avant de remettre un dossier complet sur des détournements auxquels il avait participé. Le mécène, la sécurité et un intermédiaire institutionnel cachent des décisions différentes.',
 'suspects',jsonb_build_array(
  jsonb_build_object('place','Figure influente qui finançait le gala','position','Justifier la pression commandée'),
  jsonb_build_object('place','Chef de sécurité chargé des accès','position','Justifier les rondes et décisions de surveillance'),
  jsonb_build_object('place','Intermédiaire institutionnel chargé des contrôles','position','Justifier la circulation des documents')
 )) WHERE scenario_id='019';
UPDATE igr_private.igr_v99_variant_manuscripts a
SET manuscript=(d.proposed_manuscript-'v665_editorial_status')||
 jsonb_build_object('v665_editorial_version','019-v665-20261114-three-killers',
 'v665_publication','atomic_verified_private_release'),
 editorial_status='ready',approved_by='owner_authorized_release_019',approved_at=now(),updated_at=now()
FROM igr_private.igr_v665_019_editorial_drafts d
WHERE a.scenario_id='019' AND a.variant_id=d.variant_id;
UPDATE igr_private.igr_v665_019_editorial_drafts
SET editorial_status='published_verified',updated_at=now();
DO $check$
DECLARE v text;p jsonb;seen text[]:=array[]::text[];verdict jsonb;
BEGIN
 FOR v IN SELECT variant_id FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='019' ORDER BY variant_id LOOP
  p:=igr_private.igr_v570_019_safe_pack(v);
  verdict:=p->'truth'->'reconstruction_019';
  IF jsonb_array_length(p->'investigation_019')<>20 OR
   jsonb_array_length(p->'trames')<>3 OR
   jsonb_array_length(p->'news')<>3 OR
   jsonb_array_length(p->'suspects')<>3 OR
   (SELECT count(*) FROM jsonb_object_keys(verdict))<>3 OR
   NOT (verdict ?& array['killer','security_role','cover']) OR
   (verdict->>'killer')=ANY(seen)
  THEN RAISE EXCEPTION '019 private pack incoherent %',v;END IF;
  seen:=array_append(seen,verdict->>'killer');
 END LOOP;
 IF (igr_private.igr_v571_019_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '019 release not eligible';END IF;
 IF has_function_privilege('anon','igr_private.igr_v665_019_offered(text,integer)','EXECUTE')
 OR has_function_privilege('authenticated','igr_private.igr_v665_019_offered(text,integer)','EXECUTE')
 OR has_function_privilege('anon','igr_private.igr_v570_019_safe_pack(text)','EXECUTE')
 THEN RAISE EXCEPTION '019 sealed evidence visible without authorisation';END IF;
END $check$;
COMMIT;
