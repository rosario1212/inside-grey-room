
-- IGR 018 v650: private adaptive repertoire; no plot manuscripts or answer keys are stored in Git.
CREATE TABLE IF NOT EXISTS igr_private.igr_v650_018_release_backup (
 variant_id text PRIMARY KEY, manuscript jsonb NOT NULL, editorial_status text,
 approved_by text, approved_at timestamptz, content_md5 text, captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v650_018_release_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v650_018_release_backup FROM public,anon,authenticated;
INSERT INTO igr_private.igr_v650_018_release_backup (variant_id,manuscript,editorial_status,approved_by,approved_at,content_md5)
SELECT variant_id,manuscript,editorial_status,approved_by,approved_at,content_md5
FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='018'
ON CONFLICT (variant_id) DO NOTHING;

-- Only the private server can inspect the locked factual hypotheses and hidden truth.
CREATE OR REPLACE FUNCTION igr_private.igr_v650_018_offered(p_room text,p_cycle integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_pack jsonb;v_focus text:='chronologie';v_level text:='balanced';v_hits int:=0;v_answers int:=0;v_result jsonb;
BEGIN
 IF p_cycle NOT BETWEEN 1 AND 3 THEN RETURN '[]'::jsonb; END IF;
 v_pack:=igr_private.igr_v541_018_pinned_pack(p_room);
 IF v_pack IS NULL THEN RETURN '[]'::jsonb; END IF;
 SELECT a.payload->>'axis' INTO v_focus FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='debrief'
 AND a.payload->>'axis' IN ('chronologie','acces','mobile','materiel','responsabilite')
 ORDER BY a.id DESC LIMIT 1;
 v_focus:=coalesce(v_focus,'chronologie');
 SELECT count(*)::int,
 coalesce(sum(
   (CASE WHEN a.payload->>'killer'=v_pack#>>'{truth,reconstruction_018,killer}' THEN 1 ELSE 0 END)
  +(CASE WHEN a.payload->>'tableau'=v_pack#>>'{truth,reconstruction_018,tableau}' THEN 1 ELSE 0 END)
  +(CASE WHEN a.payload->>'prior_plan'=v_pack#>>'{truth,reconstruction_018,prior_plan}' THEN 1 ELSE 0 END)
 ),0)::int
 INTO v_answers,v_hits
 FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='hypothesis_018';
 IF v_answers>0 THEN
  IF v_hits < v_answers*1.4 THEN v_level:='clarity';
  ELSIF v_hits>=v_answers*2.4 THEN v_level:='challenge';
  END IF;
 END IF;
 WITH options AS (
 SELECT e AS v,ord,
   (CASE WHEN e->>'core'='true' THEN 30 ELSE 0 END)
  +(CASE WHEN e->>'axis'=v_focus THEN 5 ELSE 0 END)
  +(CASE WHEN e->>'level'=v_level THEN 8 ELSE 0 END)
  +(CASE WHEN e->>'level'='balanced' THEN 2 ELSE 0 END) AS score
 FROM jsonb_array_elements(coalesce(v_pack->'investigation_018','[]'::jsonb))
 WITH ORDINALITY AS x(e,ord)
 WHERE (e->>'cycle')::int=p_cycle
 AND NOT EXISTS (
  SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=upper(trim(p_room))
  AND a.cycle=p_cycle AND a.action_type='investigation_018' AND a.payload->>'choice'=e->>'id'
 )
 ), offered AS (SELECT v,ord,score FROM options ORDER BY score DESC,ord ASC LIMIT 4)
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title') ORDER BY score DESC,ord ASC),'[]'::jsonb)
 INTO v_result FROM offered;
 RETURN v_result;
END $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v650_018_offered(text,integer) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v650_018_hypothesis_submit(
 p_code text,p_player_token uuid,p_killer text,p_tableau text,p_prior_plan text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'018' OR r.status<>'playing'
  OR r.cycle NOT BETWEEN 1 AND 2 OR r.phase<>'cycle_debrief' THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF p_killer NOT IN ('resident_1','resident_2','resident_3','undetermined')
 OR p_tableau NOT IN ('resident_1','resident_2','resident_3','undetermined')
 OR p_prior_plan NOT IN ('isolated_confrontation','joint_intimidation','undetermined')
 THEN RAISE EXCEPTION 'invalid hypothesis';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
 AND a.player_id=p.id AND a.cycle=r.cycle AND a.action_type='hypothesis_018')
 THEN RAISE EXCEPTION 'already submitted';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'hypothesis_018',
 jsonb_build_object('killer',p_killer,'tableau',p_tableau,'prior_plan',p_prior_plan));
 RETURN jsonb_build_object('ok',true);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v650_018_hypothesis_submit(text,uuid,text,text,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v650_018_hypothesis_submit(text,uuid,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v545_018_investigate(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;
BEGIN
 PERFORM igr_private.rate_limit('018_investigation',p_player_token::text,18,60);
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'018' OR r.status<>'playing' THEN RAISE EXCEPTION 'unavailable';END IF;
 IF r.cycle NOT BETWEEN 1 AND 3 OR NOT (r.phase IN
 ('investigation_assembly','interrogation_select','interrogation','cycle_debrief') OR r.phase LIKE 'annex_%')
 THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF (SELECT count(*) FROM public.igr_v4_actions a WHERE a.room_code=r.code AND a.cycle=r.cycle
 AND a.action_type='investigation_018')>=2 THEN RAISE EXCEPTION 'cycle limit';END IF;
 pack:=igr_private.igr_v541_018_pinned_pack(r.code);
 IF pack IS NULL THEN RAISE EXCEPTION 'sealed dossier missing';END IF;
 SELECT e.value INTO item FROM jsonb_array_elements(coalesce(pack->'investigation_018','[]'::jsonb)) e
 WHERE e->>'id'=p_choice AND (e->>'cycle')::int=r.cycle LIMIT 1;
 IF item IS NULL THEN RAISE EXCEPTION 'invalid choice';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(igr_private.igr_v650_018_offered(r.code,r.cycle)) e
 WHERE e->>'id'=p_choice) THEN RAISE EXCEPTION 'choice not offered';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'investigation_018',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 VALUES(r.code,'investigation_018','roles',array['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('choice',p_choice,'title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v545_018_investigate(text,uuid,text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v546_018_investigate_index(p_code text,p_player_token uuid,p_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;offer jsonb;choice text;
BEGIN
 IF p_index NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'invalid index';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND OR r.scenario_id<>'018' THEN RAISE EXCEPTION 'not available';END IF;
 offer:=igr_private.igr_v650_018_offered(r.code,r.cycle);
 SELECT e->>'id' INTO choice FROM jsonb_array_elements(offer) WITH ORDINALITY t(e,i)
 WHERE i=p_index LIMIT 1;
 IF choice IS NULL THEN RAISE EXCEPTION 'no choice';END IF;
 RETURN public.igr_v545_018_investigate(p_code,p_player_token,choice);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v546_018_investigate_index(text,uuid,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v546_018_investigate_index(text,uuid,integer) TO anon,authenticated;


CREATE OR REPLACE FUNCTION public.igr_v650_018_investigate_choice(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
 RETURN public.igr_v545_018_investigate(p_code,p_player_token,p_choice);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v650_018_investigate_choice(text,uuid,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v650_018_investigate_choice(text,uuid,text) TO anon,authenticated;


CREATE OR REPLACE FUNCTION igr_private.igr_v540_018_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; witness_cards jsonb; private_cards jsonb; relation_map jsonb; lvl jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 018 variant';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='018' and variant_id=p_variant;
 if m is null then raise exception 'Private manuscript missing';end if;
 t=m->'v540_runtime_trames';choices=m->'v540_investigations';witness_cards=m->'witnesses';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>3 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>20 or

   jsonb_typeof(m->'v540_verdict')<>'object' or
   not ((m->'v540_verdict') ?& array['killer','tableau','prior_plan']) or
   (select count(*) from jsonb_object_keys(m->'v540_verdict'))<>3
 then raise exception 'Private evidence pack is incomplete';end if;
 for num in 1..3 loop
  if (select count(*) from jsonb_array_elements(t) e
    where (e->>'min_cycle')::int=num
    and coalesce((e->>'guaranteed')::boolean,false)=true
    and length(coalesce(e->>'source',''))>20)<>1
    or (select count(*) from jsonb_array_elements(choices) e where (e->>'cycle')::int=num)<>(case when num=1 then 6 else 7 end)
  then raise exception '018 unsolvable cycle %',num;end if;
 end loop;
 if (select count(distinct e->>'id') from jsonb_array_elements(choices) e)<>20
 then raise exception '018 duplicate investigation IDs';end if;
 select pack into base from public.igr_v4_scenario_packs where scenario_id='018';
 if base is null or jsonb_array_length(coalesce(base->'suspects','[]'::jsonb))<>3 then
   raise exception '018 base case missing';end if;
 select jsonb_agg(
   jsonb_build_object(
    'place',e->>'identity',
    'chronology',e->>'your_chronology',
    'hide',e->>'what_you_hide',
    'anchors',e->>'what_you_know',
    'position',e->>'objective',
    'slot',(e->>'slot')::int
   ) order by (e->>'slot')::int
 ) into private_cards from jsonb_array_elements(m->'private_cards') e;
 if jsonb_array_length(coalesce(private_cards,'[]'::jsonb))<>3 then
   raise exception '018 incomplete suspect cards';end if;
 select jsonb_object_agg(k,
  (select jsonb_agg(jsonb_build_object(
     'slot',(a->>'target_slot')::int,
     'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
     order by (a->>'target_slot')::int)
   from jsonb_array_elements(v) a)
 ) into relation_map
 from jsonb_each(m->'relationships') z(k,v);
 if (select count(*) from jsonb_object_keys(relation_map))<>3 then
   raise exception '018 missing private relationships';end if;
 lvl=jsonb_build_array(
  (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,3}')::int);
 return base || jsonb_build_object(
  'context',m->>'public_briefing',
  'suspects',private_cards,
  'witnesses',coalesce(witness_cards,'[]'::jsonb),
  'relations',relation_map,
  'trames',t,
  'investigation_018',choices,
  'field_actions',coalesce(m->'v650_field_actions',base->'field_actions'),
  'truth',(base->'truth')||jsonb_build_object(
    'summary',m->'canonical_truth'->>'summary',
    'levels',lvl,
    'reconstruction_018',m->'v540_verdict',
    'cinematic',jsonb_build_object('final_line',m->>'final_reveal')
  )
 );
end;
$function$

CREATE OR REPLACE FUNCTION igr_private.igr_v540_018_safe_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v540_018_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='018' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v540_verdict')<>'object'
  OR NOT (m->'v540_verdict') ?& ARRAY['killer','tableau','prior_plan']
  OR (SELECT count(*) FROM jsonb_object_keys(m->'v540_verdict'))<>3
  OR jsonb_array_length(coalesce(m->'v540_expert_actions','[]'::jsonb))<>3
 THEN RAISE EXCEPTION '017 incomplete narrative or expert evidence';END IF;
 p:=jsonb_set(p,'{truth,reconstruction_018}',m->'v540_verdict',true);
 RETURN p || jsonb_build_object(
 'expert_actions',m->'v540_expert_actions',
 'news',jsonb_build_array(
  jsonb_build_object('id','018-news-1','title','NEUF ABSENTS','text','Neuf assiettes, neuf noms, mais aucun témoin ne peut parler à la place des absents.'),
  jsonb_build_object('id','018-news-2','title','DEUX SCÈNES POSSIBLES','text','Les traces matérielles doivent dissocier la mort de la composition du tableau.'),
  jsonb_build_object('id','018-news-3','title','TROIS MENSONGES','text','Une anomalie financière, des rancœurs et des visites distinctes ne prouvent pas une action collective.')
 ),
 'journalist_leads','[]'::jsonb);
END $function$

CREATE OR REPLACE FUNCTION igr_private.igr_v541_018_release_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r record; n int:=0; ok int:=0; seen text[]:=array[]::text[];b jsonb;secure boolean;
begin
 for r in select variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 from igr_private.igr_v99_variant_manuscripts where scenario_id='018' and variant_id in ('A','B','C') loop
  n:=n+1;
  begin
   b=igr_private.igr_v540_018_safe_pack(r.variant_id);
   if r.content_md5=md5(r.manuscript::text)
     and jsonb_array_length(b->'trames')=3
     and jsonb_array_length(b->'investigation_018')=20
     and jsonb_array_length(b->'suspects')=3
     and jsonb_typeof(b->'truth'->'reconstruction_018')='object'
     and not ((b->'truth'->'reconstruction_018')::text=any(seen)) then
      seen=array_append(seen,(b->'truth'->'reconstruction_018')::text);
      if r.editorial_status='ready' and r.approved_at is not null
        and r.approved_by='owner_authorized_release_018'
        and r.manuscript->'v541_approval'->>'owner_authorized'='true'
        then ok:=ok+1;
      end if;
   end if;
  exception when others then null;
  end;
 end loop;
 secure=not has_function_privilege('anon','igr_private.igr_v540_018_safe_pack(text)','EXECUTE')
  and not has_function_privilege('authenticated','igr_private.igr_v540_018_safe_pack(text)','EXECUTE');
 return jsonb_build_object(
  'eligible',n=3 and ok=3 and array_length(seen,1)=3 and secure
    and public.igr_v4_min_players('018')=6 and public.igr_v4_max_players('018')=9,
  'found',n,'approved',ok,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false);
end;
$function$

CREATE OR REPLACE FUNCTION public.igr_v4_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 raw jsonb;
 room public.igr_v4_rooms%rowtype;
 pack jsonb;
 originals jsonb;
 extras jsonb;
begin
 raw:=public.igr_omerta_standalone_safe_sync(p_code,p_player_token);
 if raw->'room'->>'scenario_id' in ('001','002','003','004','005') and
    raw->'player'->>'public_role' in ('enqueteur','analyste')
    and coalesce(igr_private.igr_v286_enabled(p_code),false)
 then return igr_private.igr_v286_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='007'
 and coalesce(igr_private.igr_v289_007_enabled(p_code),false)
 then return igr_private.igr_v289_007_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='008'
 and coalesce(igr_private.igr_v310_008_enabled(p_code),false)
 then return igr_private.igr_v310_008_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='010'
 and coalesce(igr_private.igr_v361_010_enabled(p_code),false)
 then return igr_private.igr_v361_010_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='009'
 and coalesce(igr_private.igr_v340_009_enabled(p_code),false)
 then return igr_private.igr_v340_009_sync_overlay(p_code,p_player_token,raw);end if;

 if raw->'room'->>'scenario_id'='018' and raw->'room'->>'status'='playing'
    and raw->'player'->>'public_role' in ('enqueteur','analyste') then
  raw:=jsonb_set(raw,'{scenario,investigation_018}',igr_private.igr_v650_018_offered(p_code,(raw#>>'{room,cycle}')::int),true);
  raw:=jsonb_set(raw,'{scenario,investigation_018_used}',
    to_jsonb((select count(*)>=2 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>'{room,cycle}')::int
      and a.action_type='investigation_018')),true);
  raw:=jsonb_set(raw,'{scenario,investigation_018_adaptive}','true'::jsonb,true);
 end if;
 select * into room from public.igr_v4_rooms where code=upper(trim(p_code));
 if not found or room.scenario_id<>'006' or room.status<>'playing'
    or raw->'player'->>'public_role' not in ('enqueteur','analyste')
 then return raw;end if;
 pack:=igr_private.igr_v260_006_pinned_pack(room.code);
 if coalesce(pack->'truth'->'reconstruction_006'->>'mode','')<>'mountain_v1'
    or jsonb_array_length(coalesce(pack->'investigation_006','[]'::jsonb))<>20
 then return raw;end if;
 select coalesce(jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^006_[ABC]_','006_')),true) order by e->>'id'),'[]'::jsonb)
 into originals
 from jsonb_array_elements(coalesce(raw->'scenario'->'investigation_006','[]'::jsonb)) e
 where (e->>'id') ~ '^006_[ABC]_[1-9]$';
 extras:=igr_private.igr_v283_006_offered(room.code,room.cycle);
 raw:=jsonb_set(raw,'{scenario,investigation_006}',originals||extras,true);
 raw:=jsonb_set(raw,'{scenario,investigation_006_limit}',to_jsonb(4),true);
 raw:=jsonb_set(raw,'{scenario,investigation_006_adaptive}','true'::jsonb,true);
if exists(select 1 from igr_private.igr_v99_room_canons c where c.room_code=room.code and c.scenario_id='006' and coalesce((c.manuscript->'v284_detailed_questionnaire'->>'enabled')::boolean,false)) then raw:=jsonb_set(raw,'{scenario,investigation_006_detailed}','true'::jsonb,true);end if;
 return raw;
end $function$


UPDATE igr_private.igr_v99_variant_manuscripts
SET manuscript=(manuscript - 'v650_staging') || (manuscript->'v650_staging'),
    editorial_status='ready',approved_by='owner_authorized_release_018',
    approved_at=now(),updated_at=now()
WHERE scenario_id='018' AND manuscript ? 'v650_staging';
DO $verify$
DECLARE v text;p jsonb;
BEGIN
 FOR v IN SELECT variant_id FROM igr_private.igr_v99_variant_manuscripts WHERE scenario_id='018' LOOP
  p:=igr_private.igr_v540_018_safe_pack(v);
  IF jsonb_array_length(p->'investigation_018')<>20 OR jsonb_array_length(p->'trames')<>3 THEN
   RAISE EXCEPTION '018 manuscript failed checks for variant %',v;
  END IF;
 END LOOP;
 IF NOT coalesce((igr_private.igr_v541_018_release_status()->>'eligible')::boolean,false) THEN
  RAISE EXCEPTION '018 not eligible for release';
 END IF;
END $verify$;
