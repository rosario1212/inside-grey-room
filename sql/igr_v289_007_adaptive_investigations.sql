-- IGR scenario 007 v289: adaptive, sealed investigation runtime.
-- The three alternate truths, cards, clues and answer keys are NOT in GitHub.
-- Private manuscripts and room snapshots remain stored in Supabase.
-- Existing pinned 007 sessions without v289_detail_questionnaire.enabled
-- retain their previous, single-investigation RPC.
-- The auth boundary uses player capability tokens and role checks.
-- Do not grant execution of private read/scoring helpers to public API roles.

CREATE OR REPLACE FUNCTION igr_private.igr_v289_007_enabled(p_room text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce((c.manuscript #>>'{v289_detail_questionnaire,enabled}')::boolean,false)
 and jsonb_array_length(coalesce(c.manuscript->'v289_optional_investigations','[]'::jsonb))=11
 and jsonb_array_length(coalesce(c.manuscript->'v280_investigations','[]'::jsonb))=9
 from igr_private.igr_v99_room_canons c
 where c.room_code=upper(btrim(p_room)) and c.scenario_id='007'
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v289_007_prior_alignment(p_room text, p_previous_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m jsonb;v_a jsonb;v_b jsonb;goals jsonb;axis text;value text;g text;aa jsonb;
wrong jsonb:='{}'::jsonb;correct jsonb:='{}'::jsonb;idx int;n int;
begin
 if p_previous_cycle not in (1,2) then return jsonb_build_object('ready',false,'wrong',wrong,'correct',correct);end if;
 select c.manuscript into m from igr_private.igr_v99_room_canons c
 where c.room_code=upper(btrim(p_room)) and c.scenario_id='007';
 if m is null or not coalesce((m->'v289_detail_questionnaire'->>'enabled')::boolean,false)
 then return jsonb_build_object('ready',false,'wrong',wrong,'correct',correct);end if;
 goals:=m->'v289_detail_questionnaire'->'answer_keys'->(p_previous_cycle::text);
 select a.payload->'answers' into v_a from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v289_detail_report' and p.public_role='enqueteur' order by a.id desc limit 1;
 select a.payload->'answers' into v_b from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v289_detail_report' and p.public_role='analyste' order by a.id desc limit 1;
 if v_a is null or v_b is null or goals is null then return jsonb_build_object('ready',false,'wrong',wrong,'correct',correct);end if;
 for aa in select v_a union all select v_b loop
  for idx in 1..4 loop
   axis:=m->'v289_detail_questionnaire'->'axes_by_question'->(p_previous_cycle::text)->>('q'||idx::text);
   g:=goals->>('q'||idx::text);value:=aa->>('q'||idx::text);
   if axis is null or g is null or value is null or value='u' then continue;end if;
   if value=g then
    n:=coalesce((correct->>axis)::int,0)+1;correct:=jsonb_set(correct,array[axis],to_jsonb(n),true);
   else
    n:=coalesce((wrong->>axis)::int,0)+1;wrong:=jsonb_set(wrong,array[axis],to_jsonb(n),true);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('ready',true,'wrong',wrong,'correct',correct);
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v289_007_choices(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m jsonb;core jsonb;main jsonb;side jsonb;prev jsonb;
begin
 if p_cycle not between 1 and 3 or not coalesce(igr_private.igr_v289_007_enabled(p_room),false)
 then return '[]'::jsonb;end if;
 select manuscript into m from igr_private.igr_v99_room_canons where room_code=upper(btrim(p_room)) and scenario_id='007';
 core:=m->'v280_investigations';
 select coalesce(jsonb_agg(jsonb_build_object('id','007_'||ord::text,'title',e->>'title','cycle',p_cycle) order by ord),'[]'::jsonb)
 into main from jsonb_array_elements(core) with ordinality z(e,ord) where (e->>'cycle')::int=p_cycle;
 prev:=case when p_cycle>1 then igr_private.igr_v289_007_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 with choices as (
 select i as item,
  case when coalesce((prev->>'ready')::boolean,false) then
   coalesce((select sum(-40*coalesce((prev->'wrong'->>ax.axis)::int,0)
       +9*coalesce((prev->'correct'->>ax.axis)::int,0))
       from jsonb_array_elements_text(i->'focus_axes') ax(axis)),0)
   else 0 end score,
  md5(upper(btrim(p_room))||':'||p_cycle::text||':target:'||(i->>'id')) tie
 from jsonb_array_elements(m->'v289_optional_investigations') i
 where (i->>'cycle')::int=p_cycle and coalesce((i->>'optional')::boolean,false)
 ),selected as (
 select * from choices order by score,tie limit 1
 ),independent as (
 select c.* from choices c where c.item->>'id'<>(select s.item->>'id' from selected s)
 order by case when exists (
   select 1 from jsonb_array_elements_text(c.item->'focus_axes') f(axis)
   join jsonb_array_elements_text((select s.item->'focus_axes' from selected s)) g(axis) on f.axis=g.axis
 ) then 1 else 0 end,
 md5(upper(btrim(p_room))||':'||p_cycle::text||':independent:'||(c.item->>'id'))
 limit 1
 ), offered as (select item from selected union all select item from independent)
 select coalesce(jsonb_agg(jsonb_build_object('id','007_'||right(item->>'id',2),
 'title',item->>'title','cycle',p_cycle)
 order by md5(upper(btrim(p_room))||':'||p_cycle::text||':mixed:'||(item->>'id'))),'[]'::jsonb)
 into side from offered;
 return main||side;
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v289_007_sync_overlay(p_code text, p_player_token uuid, p_raw jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
begin
 select * into a from public.igr_v4_players
 where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 select * into r from public.igr_v4_rooms where code=upper(btrim(p_code));
 if a.id is null or r.scenario_id<>'007' or r.status<>'playing'
 or not coalesce(igr_private.igr_v289_007_enabled(r.code),false) then return p_raw;end if;
 -- Do not expose result text, unselected choices, private scoring or variant ID to any client.
 p_raw:=jsonb_set(p_raw,'{scenario,investigation_007}','[]'::jsonb,true);
 if a.public_role in ('enqueteur','analyste') and r.cycle between 1 and 3 then
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_007}',igr_private.igr_v289_007_choices(r.code,r.cycle),true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_007_used}','false'::jsonb,true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_007_adaptive}','true'::jsonb,true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_007_limit}',to_jsonb(4),true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_007_detailed}','true'::jsonb,true);
 end if;
 return p_raw;
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v289_007_submit_detail(p_code text, p_player_token uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;k text;
begin
 perform igr_private.rate_limit('v289_detail',p_player_token::text,16,60);
 select * into p from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'007' or r.status<>'playing' or r.phase<>'cycle_debrief'
 or r.cycle not in (1,2) or not coalesce(igr_private.igr_v289_007_enabled(r.code),false) then raise exception 'unavailable';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or length(p_answers::text)>300
 or (select count(*) from jsonb_object_keys(p_answers))<>4 then raise exception 'invalid structure';end if;
 foreach k in array array['q1','q2','q3','q4'] loop
  if not p_answers ? k or jsonb_typeof(p_answers->k)<>'string'
  or p_answers->>k not in('a','b','c','u') then raise exception 'invalid answers';end if;
 end loop;
 if exists(select 1 from public.igr_v4_actions a where a.room_code=r.code
 and a.cycle=r.cycle and a.player_id=p.id and a.action_type in('v289_detail_report','debrief'))
 then raise exception 'already sealed';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'v289_detail_report',jsonb_build_object('answers',p_answers,'version','v289'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v289_007_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;m jsonb;item jsonb;
n int;total_n int;core_n int;extra_n int;
begin
 perform igr_private.rate_limit('v289_investigation',p_player_token::text,28,60);
 select * into p from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'007' or r.status<>'playing'
 or r.cycle not between 1 and 3
 or not coalesce(igr_private.igr_v289_007_enabled(r.code),false)
 or not (r.phase in('investigation_assembly','interrogation_select','interrogation','cycle_debrief') or r.phase like 'annex_%')
 then raise exception 'unavailable';end if;
 if p_choice is null or p_choice !~ '^007_([1-9]|1[0-9]|20)$' then raise exception 'invalid choice';end if;
 n:=split_part(p_choice,'_',2)::integer;
 if not exists(select 1 from jsonb_array_elements(igr_private.igr_v289_007_choices(r.code,r.cycle)) e where e->>'id'=p_choice)
 then raise exception 'not offered';end if;
 select manuscript into m from igr_private.igr_v99_room_canons where room_code=r.code and scenario_id='007';
 if n<=9 then item:=m->'v280_investigations'->(n-1);
 else
  select i into item from jsonb_array_elements(m->'v289_optional_investigations') i
  where i->>'id'='007_'||(m->>'id')||'_'||n::text and (i->>'cycle')::int=r.cycle limit 1;
 end if;
 if item is null or (item->>'cycle')::int<>r.cycle then raise exception 'invalid item';end if;
 select count(*),count(*) filter(where a.payload->>'choice' ~ '^007_[1-9]$'),
 count(*) filter(where a.payload->>'choice' ~ '^007_(1[0-9]|20)$')
 into total_n,core_n,extra_n from public.igr_v4_actions a
 where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_007';
 if total_n>=4 or (n<=9 and core_n>=3) or (n>9 and extra_n>=1)
 or exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_007' and a.payload->>'choice'=p_choice)
 then raise exception 'cycle budget exhausted';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_007',jsonb_build_object('choice',p_choice,'id',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_007','roles',array['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('id',p_choice,'title',item->>'title',
 'text',case when n<=9 then item->>'result' else 'Source : '||coalesce(item->'source_origins'->>0,'Pièce du dossier')||E'\n'||(item->>'result') end,
 'author',case when n<=9 then 'Constat officiel' else 'Investigation complémentaire' end));
 return jsonb_build_object('ok',true,'cycle',r.cycle,'used',total_n+1);
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
 if raw->'room'->>'scenario_id'='007'
 and coalesce(igr_private.igr_v289_007_enabled(p_code),false)
 then return igr_private.igr_v289_007_sync_overlay(p_code,p_player_token,raw);end if;
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

revoke all on function igr_private.igr_v289_007_enabled(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v289_007_prior_alignment(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v289_007_choices(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v289_007_sync_overlay(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.igr_v289_007_investigate(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_v289_007_submit_detail(text,uuid,jsonb) to anon,authenticated;

-- Post-activation QA (private, rollback-only):
-- select igr_private.igr_v289_007_candidate_smoke();
