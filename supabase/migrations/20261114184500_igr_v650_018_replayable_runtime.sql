
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
 SELECT e INTO item FROM jsonb_array_elements(coalesce(pack->'investigation_018','[]'::jsonb)) e
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

-- Patch existing canonical readers without replacing unrelated scenarios.
DO $patch$
DECLARE d text; n text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v540_018_build_pack(text)'::regprocedure) INTO d;
 n:=replace(d,'jsonb_array_length(coalesce(choices,''[]''::jsonb))<>9',
   'jsonb_array_length(coalesce(choices,''[]''::jsonb))<>20');
 n:=replace(n,'(e->>''cycle'')::int=num)<>3',
   '(e->>''cycle'')::int=num)<>(case when num=1 then 6 else 7 end)');
 n:=replace(n,')<>9' || E'\n' || ' then raise exception ''017 duplicate',')<>20'||E'\n'||' then raise exception ''018 duplicate');
 n:=replace(n,'then raise exception ''017', 'then raise exception ''018');
 n:=replace(n,'''investigation_018'',choices,',
   '''investigation_018'',choices,'||E'\n'||'  ''field_actions'',coalesce(m->''v650_field_actions'',base->''field_actions''),');
 IF n=d OR position('field_actions' IN n)=0 OR position('<>20' IN n)=0 THEN
  RAISE EXCEPTION '018 build pack patch failed';
 END IF;
 EXECUTE n;
 SELECT pg_get_functiondef('igr_private.igr_v541_018_release_status()'::regprocedure) INTO d;
 n:=replace(d,'jsonb_array_length(b->''investigation_018'')=9','jsonb_array_length(b->''investigation_018'')=20');
 IF n=d THEN RAISE EXCEPTION '018 release status patch failed';END IF;
 EXECUTE n;
 SELECT pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure) INTO d;
 n:=replace(d,
  ' select * into room from public.igr_v4_rooms where code=upper(trim(p_code));',
  ' if raw->''room''->>''scenario_id''=''018'' and raw->''room''->>''status''=''playing'' and raw->''player''->>''public_role'' in (''enqueteur'',''analyste'') then' || E'\n' ||
  '  raw:=jsonb_set(raw,''{scenario,investigation_018}'',igr_private.igr_v650_018_offered(p_code,(raw#>>''{room,cycle}'')::int),true);'||E'\n'||
  '  raw:=jsonb_set(raw,''{scenario,investigation_018_used}'',to_jsonb((select count(*)>=2 from public.igr_v4_actions a where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>''{room,cycle}'')::int and a.action_type=''investigation_018'')),true);'||E'\n'||
  '  raw:=jsonb_set(raw,''{scenario,investigation_018_adaptive}'',''true''::jsonb,true);'||E'\n'||
  ' end if;'||E'\n'||
  ' select * into room from public.igr_v4_rooms where code=upper(trim(p_code));');
 IF n=d OR position('igr_v650_018_offered' IN n)=0 THEN RAISE EXCEPTION '018 sync overlay patch failed';END IF;
 EXECUTE n;
END $patch$;
