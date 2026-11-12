-- IGR v286: canonical, gated 20-investigation runtime for scenarios 001–005.
-- These are read-only-source or server-only functions. No private A/B/C narrative, grading
-- values, user secrets, or unpublished investigations belong in this public repository.
-- 15 private variant candidate banks were authored and QA-checked in igr_private.
-- Every newly pinned room is version-gated by manuscript.v286_investigations.enabled.
-- The pinned manuscript must include the private 11-item optional_investigations and
-- detail_goals. Older rooms keep the previous one-investigation-per-cycle contract.
-- Events are restricted to investigator/analyst; no correctness signal is returned.
-- Deployment requires Cloudflare verified BEFORE activating any live manuscript flags.

CREATE OR REPLACE FUNCTION igr_private.igr_v286_enabled(p_room text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce((c.manuscript->'v286_investigations'->>'enabled')::boolean,false)
 and c.scenario_id in ('001','002','003','004','005')
 and jsonb_array_length(coalesce(c.manuscript->'v286_investigations'->'optional_investigations','[]'::jsonb))=11
 from igr_private.igr_v99_room_canons c where c.room_code=upper(btrim(p_room))
 and c.scenario_id in('001','002','003','004','005');
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v286_core(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sid text;v_pack jsonb;
begin
 select c.scenario_id into sid from igr_private.igr_v99_room_canons c
 where c.room_code=upper(btrim(p_room)) and c.scenario_id in('001','002','003','004','005');
 if sid is null then return '[]'::jsonb;end if;
 v_pack:=case sid
 when '001' then igr_private.igr_v181_001_pinned_game_pack(p_room)
 when '002' then igr_private.igr_v201_002_pinned_game_pack(p_room)
 when '003' then igr_private.igr_v220_003_pinned_pack(p_room)
 when '004' then igr_private.igr_v230_004_pinned_pack(p_room)
 when '005' then igr_private.igr_v250_005_pinned_pack(p_room)
 else '{}'::jsonb end;
 return coalesce(v_pack->('investigation_'||sid),'[]'::jsonb);
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v286_prior_alignment(p_room text, p_previous_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 sid text; v_m jsonb;v_goal jsonb;v_e jsonb;v_a jsonb;
 v_wrong jsonb:='{}'::jsonb;v_right jsonb:='{}'::jsonb;
 v_answers jsonb;v_role text;v_idx int;v_axis text;v_ans text;v_goal_val text;n int;
begin
 if p_previous_cycle not in (1,2) then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 select c.scenario_id,c.manuscript into sid,v_m from igr_private.igr_v99_room_canons c
 where c.room_code=upper(btrim(p_room)) and c.scenario_id in('001','002','003','004','005');
 if v_m is null or coalesce((v_m->'v286_investigations'->>'enabled')::boolean,false) is not true
 then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 v_goal:=v_m->'v286_investigations'->'detail_goals'->(p_previous_cycle::text);
 select a.payload->'answers' into v_e from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v286_detail_report' and p.public_role='enqueteur' order by a.id desc limit 1;
 select a.payload->'answers' into v_a from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v286_detail_report' and p.public_role='analyste' order by a.id desc limit 1;
 if v_e is null or v_a is null or v_goal is null then
 return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 for v_answers in select v_e union all select v_a loop
  for v_idx in 1..4 loop
   v_axis:=case v_idx when 1 then 'chronologie' when 2 then 'materiel'
     when 3 then 'temoignages' else 'responsabilite' end;
   v_ans:=coalesce(v_answers->>('q'||v_idx::text),'u');
   v_goal_val:=v_goal->>('q'||v_idx::text);
   if v_ans='u' or v_goal_val is null then continue;end if;
   if v_ans=v_goal_val then
    n:=coalesce((v_right->>v_axis)::int,0)+1;
    v_right:=jsonb_set(v_right,array[v_axis],to_jsonb(n),true);
   else
    n:=coalesce((v_wrong->>v_axis)::int,0)+1;
    v_wrong:=jsonb_set(v_wrong,array[v_axis],to_jsonb(n),true);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('ready',true,'wrong',v_wrong,'correct',v_right);
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v286_choices(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 sid text;m jsonb;core jsonb;primary_choices jsonb;extras jsonb;assessment jsonb;
begin
 if p_cycle not between 1 and 3 or not coalesce(igr_private.igr_v286_enabled(p_room),false)
 then return '[]'::jsonb;end if;
 select scenario_id,manuscript into sid,m from igr_private.igr_v99_room_canons
 where room_code=upper(btrim(p_room)) and scenario_id in('001','002','003','004','005');
 core:=igr_private.igr_v286_core(p_room);
 if jsonb_array_length(core)<>9 then raise exception 'invalid source pack';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',sid||'_'||e.ord::text,'title',e.item->>'title','cycle',p_cycle) order by e.ord),'[]'::jsonb)
 into primary_choices
 from jsonb_array_elements(core) with ordinality as e(item,ord)
 where (e.item->>'cycle')::int=p_cycle;
 assessment:=case when p_cycle>1 then igr_private.igr_v286_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 select coalesce(jsonb_agg(jsonb_build_object('id',sid||'_'||right(z.item->>'id',2),
       'title',z.item->>'title','cycle',p_cycle) order by z.priority,z.random_key),'[]'::jsonb)
 into extras from (
  select i as item,
   case when coalesce((assessment->>'ready')::boolean,false)
    then (-35*coalesce((assessment->'wrong'->>(i->>'axis'))::int,0)
          +7*coalesce((assessment->'correct'->>(i->>'axis'))::int,0))
    else 0 end as priority,
   md5(upper(btrim(p_room))||':'||p_cycle::text||':'||(i->>'id')) as random_key
  from jsonb_array_elements(m->'v286_investigations'->'optional_investigations') i
  where (i->>'cycle')::int=p_cycle
  order by priority,random_key limit 2
 ) z;
 return primary_choices||extras;
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v286_sync_overlay(p_code text, p_player_token uuid, p_raw jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sid text;room public.igr_v4_rooms%rowtype;actor public.igr_v4_players%rowtype;
begin
 select * into actor from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 select * into room from public.igr_v4_rooms where code=upper(btrim(p_code));
 sid:=room.scenario_id;
 if actor.id is null or actor.public_role not in('enqueteur','analyste')
  or room.status<>'playing' or sid not in('001','002','003','004','005')
  or not coalesce(igr_private.igr_v286_enabled(room.code),false) then return p_raw;end if;
 p_raw:=jsonb_set(p_raw,array['scenario','investigation_'||sid],
          igr_private.igr_v286_choices(room.code,room.cycle),true);
 p_raw:=jsonb_set(p_raw,array['scenario','investigation_'||sid||'_used'],'false'::jsonb,true);
 p_raw:=jsonb_set(p_raw,'{scenario,investigation_deep_v286}','true'::jsonb,true);
 p_raw:=jsonb_set(p_raw,'{scenario,investigation_deep_limit}',to_jsonb(4),true);
 return p_raw;
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v286_submit_detail(p_code text, p_player_token uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;k text;v text;
begin
 perform igr_private.rate_limit('v286_detail',p_player_token::text,16,60);
 select * into p from public.igr_v4_players
 where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.status<>'playing' or r.scenario_id not in('001','002','003','004','005')
 or r.phase<>'cycle_debrief' or r.cycle not in (1,2)
 or not coalesce(igr_private.igr_v286_enabled(r.code),false) then raise exception 'unavailable';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object'
 or length(p_answers::text)>300
 or (select count(*) from jsonb_object_keys(p_answers))<>4 then raise exception 'bad answers';end if;
 foreach k in array array['q1','q2','q3','q4'] loop
  if not p_answers?k or jsonb_typeof(p_answers->k)<>'string'
    or p_answers->>k not in ('a','b','c','u') then raise exception 'invalid answer';end if;
 end loop;
 if exists(select 1 from public.igr_v4_actions a where a.room_code=r.code
  and a.player_id=p.id and a.cycle=r.cycle
  and a.action_type in('v286_detail_report','debrief')) then raise exception 'already sealed';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'v286_detail_report',
 jsonb_build_object('answers',p_answers,'version','v286'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v286_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
  sid text;num int;v_core jsonb;v_m jsonb;v_optional jsonb;v_item jsonb;
  v_title text;v_total int;v_core_count int;v_optional_count int;
begin
 perform igr_private.rate_limit('v286_investigation',p_player_token::text,28,60);
 select * into p from public.igr_v4_players
 where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 sid:=r.scenario_id;
 if not found or r.status<>'playing' or sid not in('001','002','003','004','005')
 or not coalesce(igr_private.igr_v286_enabled(r.code),false)
 or r.cycle not between 1 and 3
 or not (r.phase in('investigation_assembly','interrogation_select','interrogation','cycle_debrief') or r.phase like 'annex_%')
 then raise exception 'unavailable';end if;
 if coalesce(p_choice,'') !~ ('^'||sid||'_([1-9]|1[0-9]|20)$')
 then raise exception 'invalid identifier';end if;
 num:=split_part(p_choice,'_',2)::int;
 if not exists(select 1 from jsonb_array_elements(igr_private.igr_v286_choices(r.code,r.cycle)) x
  where x->>'id'=p_choice) then raise exception 'not offered';end if;
 select c.manuscript into v_m from igr_private.igr_v99_room_canons c
 where c.room_code=r.code and c.scenario_id=sid;
 if num<=9 then
  v_core:=igr_private.igr_v286_core(r.code);
  v_item:=v_core->(num-1);
 else
  select x into v_item from jsonb_array_elements(v_m->'v286_investigations'->'optional_investigations') x
  where right(x->>'id',2)=num::text and (x->>'cycle')::int=r.cycle
   and (x->>'optional')::boolean=true limit 1;
 end if;
 if v_item is null or (v_item->>'cycle')::int<>r.cycle then raise exception 'wrong cycle';end if;
 select count(*),
 count(*) filter(where a.payload->>'choice' ~ ('^'||sid||'_[1-9]$')),
 count(*) filter(where a.payload->>'choice' ~ ('^'||sid||'_(1[0-9]|20)$'))
 into v_total,v_core_count,v_optional_count
 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle
 and a.action_type='investigation_'||sid;
 if v_total>=4 or (num<=9 and v_core_count>=3) or (num>9 and v_optional_count>=1)
 or exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle
 and a.action_type='investigation_'||sid and a.payload->>'choice'=p_choice)
 then raise exception 'cycle budget exhausted';end if;
 v_title:=v_item->>'title';
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_'||sid,
 jsonb_build_object('choice',p_choice,'id',p_choice,'title',v_title));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_'||sid,'roles',array['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('id',p_choice,'title',v_title,'text',v_item->>'result',
  'author',case when num<=9 then 'Examen des pièces' else 'Recoupement documentaire' end));
 return jsonb_build_object('ok',true,'cycle',r.cycle,'used',v_total+1);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v187_001_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce(igr_private.igr_v286_enabled(p_code),false) then
  return public.igr_v286_investigate(p_code,p_player_token,p_choice);
 end if;
 perform igr_private.rate_limit('001_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'001' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_001')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v181_001_pinned_game_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_001','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_001',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_001','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v203_002_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce(igr_private.igr_v286_enabled(p_code),false) then
  return public.igr_v286_investigate(p_code,p_player_token,p_choice);
 end if;
 perform igr_private.rate_limit('002_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'002' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_002')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v201_002_pinned_game_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_002','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_002',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_002','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v223_003_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce(igr_private.igr_v286_enabled(p_code),false) then
  return public.igr_v286_investigate(p_code,p_player_token,p_choice);
 end if;
 perform igr_private.rate_limit('003_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'003' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_003')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v220_003_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_003','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_003',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_003','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v232_004_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce(igr_private.igr_v286_enabled(p_code),false) then
  return public.igr_v286_investigate(p_code,p_player_token,p_choice);
 end if;
 perform igr_private.rate_limit('004_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'004' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_004')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v230_004_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_004','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_004',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_004','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v252_005_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce(igr_private.igr_v286_enabled(p_code),false) then
  return public.igr_v286_investigate(p_code,p_player_token,p_choice);
 end if;
 perform igr_private.rate_limit('005_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'005' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_005')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v250_005_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_005','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_005',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_005','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

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
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v286_five_case_smoke()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
<<qa_scope>>
declare
 cand record;room_code text;m jsonb;original jsonb;core jsonb;menu jsonb;
 token_enq uuid;token_ana uuid;token_sus uuid;v jsonb;
 sid text;opt text;second_opt text;num int;
 tested int:=0; optional_checked int:=0;blocked int:=0;submitted int:=0;
begin
 for cand in select c.*,v.manuscript live_manuscript from igr_private.igr_v286_investigation_candidates_001_005 c
 join igr_private.igr_v99_variant_manuscripts v using(scenario_id,variant_id)
 order by c.scenario_id,c.variant_id loop
  sid:=cand.scenario_id;
  room_code:='K'||upper(substr(md5(clock_timestamp()::text||random()::text),1,5));
  begin
   m:=cand.live_manuscript||jsonb_build_object('v286_investigations',
    jsonb_build_object('enabled',true,'version','v286','optional_investigations',cand.optional_investigations,
    'detail_goals',cand.detail_goals,'human_playtest_verified',false));
   insert into public.igr_v4_rooms(code,scenario_id,status,phase,cycle)
   values(room_code,sid,'playing','cycle_debrief',1);
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,public_role)
   values(room_code,'QA enquête',0,true,'enqueteur') returning player_token into token_enq;
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,public_role)
   values(room_code,'QA analyste',1,false,'analyste') returning player_token into token_ana;
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,public_role)
   values(room_code,'QA suspect',2,false,'suspect') returning player_token into token_sus;
   insert into igr_private.igr_v99_room_canons(room_code,scenario_id,variant_id,manuscript,manuscript_md5)
   values(room_code,sid,cand.variant_id,m,md5(m::text));
   core:=igr_private.igr_v286_core(room_code);
   if jsonb_array_length(core)<>9 then raise exception 'core count % %',sid,cand.variant_id;end if;
   menu:=igr_private.igr_v286_choices(room_code,1);
   if jsonb_array_length(menu)<>5 or (select count(*) from jsonb_array_elements(menu) e
    where (e->>'id') ~ ('^'||sid||'_([1-9]|1[0-9]|20)$'))<>5
   then raise exception 'bad cycle1 menu % % %',sid,cand.variant_id,menu;end if;
   perform public.igr_v286_submit_detail(room_code,token_enq,'{"q1":"b","q2":"b","q3":"b","q4":"b"}'::jsonb);
   v:=igr_private.igr_v286_prior_alignment(room_code,1);
   if (v->>'ready')::boolean is true then raise exception 'single role scoring';end if;
   perform public.igr_v286_submit_detail(room_code,token_ana,'{"q1":"b","q2":"b","q3":"b","q4":"b"}'::jsonb);
   submitted:=submitted+2;
   v:=igr_private.igr_v286_prior_alignment(room_code,1);
   if (v->>'ready')::boolean is not true then raise exception 'dual scoring missing';end if;
   update public.igr_v4_rooms set cycle=2,phase='investigation_assembly' where code=room_code;
   menu:=igr_private.igr_v286_choices(room_code,2);
   if jsonb_array_length(menu)<>5 or exists(select 1 from jsonb_array_elements(menu)e where e->>'id' like '%_A_%')
   then raise exception 'cycle2 menu leaked variant';end if;
   select e->>'id' into opt from jsonb_array_elements(menu)e
   where split_part(e->>'id','_',2)::int>=10 limit 1;
   select e->>'id' into second_opt from jsonb_array_elements(menu)e
   where split_part(e->>'id','_',2)::int>=10 and e->>'id'<>opt limit 1;
   perform public.igr_v286_investigate(room_code,token_enq,opt);
   begin
    perform public.igr_v286_investigate(room_code,token_ana,second_opt);
    raise exception 'allowed second optional';
   exception when raise_exception then
    if sqlerrm='allowed second optional' then raise;end if;
    blocked:=blocked+1;
   end;
   for num in 1..3 loop
    perform public.igr_v286_investigate(room_code,token_ana,(menu->(num-1))->>'id');
   end loop;
   begin
    perform public.igr_v286_investigate(room_code,token_enq,second_opt);
    raise exception 'allowed fifth action';
   exception when raise_exception then
    if sqlerrm='allowed fifth action' then raise;end if;
    blocked:=blocked+1;
   end;
   if (select count(*) from public.igr_v4_events
     where public.igr_v4_events.room_code=qa_scope.room_code and event_type='investigation_'||sid and visibility='roles'
       and audience_roles=array['enqueteur','analyste']::text[])<>4
   then raise exception 'role-only events missing';end if;
   begin
    perform public.igr_v286_investigate(room_code,token_sus,(menu->0)->>'id');
    raise exception 'suspect accepted';
   exception when raise_exception then
    if sqlerrm='suspect accepted' then raise;end if;blocked:=blocked+1;
   end;
   tested:=tested+1;optional_checked:=optional_checked+11;
   raise exception using errcode='PT001', message='ROLLBACK QA';
  exception when sqlstate 'PT001' then null;
  end;
 end loop;
 return jsonb_build_object('ok',tested=15 and optional_checked=165,
 'variants',tested,'optional_entries_checked',optional_checked,'sealed_reports',submitted,
 'rejected_unauthorized_or_excess_actions',blocked,'temporary_rooms_persisted',false);
end $function$;
revoke all on function igr_private.igr_v286_enabled(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v286_core(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v286_prior_alignment(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v286_choices(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v286_sync_overlay(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function igr_private.igr_v286_five_case_smoke() from public,anon,authenticated;
revoke execute on function public.igr_v286_submit_detail(text,uuid,jsonb) from public;
revoke execute on function public.igr_v286_investigate(text,uuid,text) from public;
grant execute on function public.igr_v286_submit_detail(text,uuid,jsonb) to anon,authenticated;
grant execute on function public.igr_v286_investigate(text,uuid,text) to anon,authenticated;
