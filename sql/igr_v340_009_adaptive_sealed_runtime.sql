-- Le Sujet 17 (scenario 009) v340 — server-only adaptive workflow.
-- Never store manuscripts, sealed answer keys, variant identities or private evidence
-- as literals in this public repository; these are snapshotted in Supabase private tables.
-- Prior room snapshots remain on their original nine-item path.
-- Both public endpoints authenticate the room-specific player token and role
-- and enforce no more than three mandatory + one optional dossier per cycle.

CREATE OR REPLACE FUNCTION igr_private.igr_v330_009_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; cards jsonb; relations jsonb; lv jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 009 variant' using errcode='P0001';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='009' and variant_id=p_variant;
 if m is null then raise exception '009 private manuscript missing' using errcode='P0001';end if;
 t=m->'v330_runtime_trames';choices=m->'v330_investigations';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>3 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>9 or
   jsonb_typeof(m->'v330_verdict')<>'object' or
   not ((m->'v330_verdict') ?& array['withdrawal','decision','decoy']) or
   (select count(*) from jsonb_object_keys(m->'v330_verdict'))<>3
 then raise exception '009 incomplete private evidence pack' using errcode='P0001';end if;
 for num in 1..3 loop
  if (select count(*) from jsonb_array_elements(t) e where
    (e->>'min_cycle')::int=num and coalesce((e->>'guaranteed')::boolean,false)
     and length(coalesce(e->>'source',''))>20)<>1
    or (select count(*) from jsonb_array_elements(choices) e where
      (e->>'cycle')::int=num and length(coalesce(e->>'result',''))>45)<>3
  then raise exception '009 missing mandatory proof in cycle %',num using errcode='P0001';end if;
 end loop;
 if (select count(distinct e->>'id') from jsonb_array_elements(choices) e)<>9
 then raise exception '009 duplicate investigation IDs' using errcode='P0001';end if;
 select pack into base from public.igr_v4_scenario_packs where scenario_id='009';
 if base is null or jsonb_array_length(base->'suspects')<>3
 then raise exception '009 original pack missing' using errcode='P0001';end if;
 select jsonb_agg(jsonb_build_object(
   'place',e->>'identity','chronology',e->>'your_chronology',
   'hide',e->>'what_you_hide','anchors',e->>'what_you_know',
   'position',e->>'objective','slot',(e->>'slot')::int)
   order by (e->>'slot')::int)
 into cards from jsonb_array_elements(m->'private_cards') e;
 if jsonb_array_length(cards)<>3 then raise exception '009 private suspects incomplete';end if;
 select jsonb_object_agg(k,
   (select jsonb_agg(jsonb_build_object('slot',(a->>'target_slot')::int,
      'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
      order by (a->>'target_slot')::int)
    from jsonb_array_elements(v) a))
 into relations from jsonb_each(m->'relationships') x(k,v);
 if (select count(*) from jsonb_object_keys(relations))<>3
 then raise exception '009 private relationships incomplete';end if;
 lv=jsonb_build_array(
 (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
 (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
 (m#>>'{canonical_truth,responsibility_by_slot,3}')::int);
 if m ? 'v340_optional_investigations'
 and coalesce((m->'v340_detail_questionnaire'->>'enabled')::boolean,false) then
   if jsonb_array_length(m->'v340_optional_investigations')<>11 then
     raise exception '009 v340 incomplete optional bank';
   end if;
   base:=base||jsonb_build_object('v340_private',
     jsonb_build_object('enabled',true,
       'optional',m->'v340_optional_investigations',
       'answer_keys',m->'v340_detail_questionnaire'->'answer_keys',
       'question_axes',m->'v340_detail_questionnaire'->'question_axes'));
 end if;
  return base||jsonb_build_object(
  'context',m->>'public_briefing',
  'expert_actions',igr_private.igr_v495_expert_actions('009',coalesce(base->'expert_actions','[]'::jsonb),m->>'public_briefing',t),
  'suspects',cards,
  'relations',relations,
  'trames',t,
  'investigation_009',choices,
  'truth',(base->'truth')||jsonb_build_object(
   'summary',m->'canonical_truth'->>'summary',
   'levels',lv,
   'reconstruction_009',m->'v330_verdict',
   'cinematic',jsonb_build_object('final_line',m->>'final_reveal')));
end;
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v340_009_enabled(p_room text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select coalesce((s.pack->'v340_private'->>'enabled')::boolean,false)
  and jsonb_array_length(coalesce(s.pack->'v340_private'->'optional','[]'::jsonb))=11
  and jsonb_array_length(coalesce(s.pack->'investigation_009','[]'::jsonb))=9
from igr_private.igr_v331_009_room_snapshots s
where s.room_code=upper(btrim(p_room))
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v340_009_prior_alignment(p_room text, p_previous_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_pack jsonb;v_a jsonb;v_b jsonb;v_answers jsonb;v_goals jsonb;
v_wrong jsonb:='{}'::jsonb;v_right jsonb:='{}'::jsonb;
idx int;n int;ax text;ans text;goal text;
begin
 if p_previous_cycle not in(1,2) then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 select s.pack into v_pack from igr_private.igr_v331_009_room_snapshots s where s.room_code=upper(btrim(p_room));
 if v_pack is null or not coalesce((v_pack->'v340_private'->>'enabled')::boolean,false)
 then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 v_goals:=v_pack->'v340_private'->'answer_keys'->(p_previous_cycle::text);
 select a.payload->'answers' into v_a from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v340_009_detail_report' and p.public_role='enqueteur' order by a.id desc limit 1;
 select a.payload->'answers' into v_b from public.igr_v4_actions a
 join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle
 and a.action_type='v340_009_detail_report' and p.public_role='analyste' order by a.id desc limit 1;
 if v_goals is null or v_a is null or v_b is null
 then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_right);end if;
 for v_answers in select v_a union all select v_b loop
  for idx in 1..4 loop
   ax:=v_pack->'v340_private'->'question_axes'->(p_previous_cycle::text)->>('q'||idx::text);
   ans:=v_answers->>('q'||idx::text);goal:=v_goals->>('q'||idx::text);
   if ax is null or ans is null or ans='u' or goal is null then continue;end if;
   if ans=goal then
    n:=coalesce((v_right->>ax)::int,0)+1;
    v_right:=jsonb_set(v_right,array[ax],to_jsonb(n),true);
   else
    n:=coalesce((v_wrong->>ax)::int,0)+1;
    v_wrong:=jsonb_set(v_wrong,array[ax],to_jsonb(n),true);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('ready',true,'wrong',v_wrong,'correct',v_right);
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v340_009_choices(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_pack jsonb;v_main jsonb;v_side jsonb;v_prior jsonb;
begin
 if p_cycle not between 1 and 3 or not coalesce(igr_private.igr_v340_009_enabled(p_room),false)
 then return '[]'::jsonb;end if;
 select pack into v_pack from igr_private.igr_v331_009_room_snapshots
 where room_code=upper(btrim(p_room));
 select coalesce(jsonb_agg(jsonb_build_object('id','009_'||e.ord::text,
    'title',e.item->>'title','cycle',p_cycle) order by e.ord),'[]'::jsonb)
 into v_main from jsonb_array_elements(v_pack->'investigation_009')
 with ordinality e(item,ord) where (e.item->>'cycle')::int=p_cycle;
 v_prior:=case when p_cycle>1 then igr_private.igr_v340_009_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 with ranked as (
 select i as item,
  case when coalesce((v_prior->>'ready')::boolean,false) then
    coalesce((select sum(-40*coalesce((v_prior->'wrong'->>a.axis)::int,0)
      +9*coalesce((v_prior->'correct'->>a.axis)::int,0))
      from jsonb_array_elements_text(i->'focus_axes') a(axis)),0)
   else 0 end as score,
  md5(upper(btrim(p_room))||':'||p_cycle::text||':target:'||(i->>'id')) as tie
 from jsonb_array_elements(v_pack->'v340_private'->'optional') i
 where (i->>'cycle')::int=p_cycle and (i->>'optional')::boolean
 ),targeted as (
 select * from ranked where not coalesce((item->>'neutral_only')::boolean,false)
 order by score,tie limit 1
 ),neutral as (
 select * from ranked where coalesce((item->>'neutral_only')::boolean,false)
 order by md5(upper(btrim(p_room))||':'||p_cycle::text||':neutral:'||(item->>'id'))
 limit 1
 ),offered as (select item from targeted union all select item from neutral)
 select coalesce(jsonb_agg(jsonb_build_object('id','009_'||right(item->>'id',2),
   'title',item->>'title','cycle',p_cycle)
   order by md5(upper(btrim(p_room))||':'||p_cycle::text||':mix:'||(item->>'id'))),'[]'::jsonb)
 into v_side from offered;
 return v_main||v_side;
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v340_009_sync_overlay(p_code text, p_player_token uuid, p_raw jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
begin
 select * into r from public.igr_v4_rooms where code=upper(btrim(p_code));
 select * into p from public.igr_v4_players where room_code=r.code and player_token=p_player_token;
 if r.code is null or p.id is null or r.scenario_id<>'009'
 or r.status<>'playing' or not coalesce(igr_private.igr_v340_009_enabled(r.code),false)
 then return p_raw;end if;
 p_raw:=jsonb_set(p_raw,'{scenario,investigation_009}','[]'::jsonb,true);
 if p.public_role in('enqueteur','analyste') and r.cycle between 1 and 3 then
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_009}',igr_private.igr_v340_009_choices(r.code,r.cycle),true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_009_used}','false'::jsonb,true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_009_adaptive}','true'::jsonb,true);
  p_raw:=jsonb_set(p_raw,'{scenario,investigation_009_detailed}','true'::jsonb,true);
 end if;
 return p_raw;
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v340_009_submit_detail(p_code text, p_player_token uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;k text;
begin
 perform igr_private.rate_limit('v340_009_detail',p_player_token::text,16,60);
 select * into p from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'009' or r.status<>'playing'
 or r.phase<>'cycle_debrief' or r.cycle not in (1,2)
 or not coalesce(igr_private.igr_v340_009_enabled(r.code),false)
 then raise exception 'unavailable';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object'
 or length(p_answers::text)>300 or (select count(*) from jsonb_object_keys(p_answers))<>4
 then raise exception 'bad answers';end if;
 foreach k in array array['q1','q2','q3','q4'] loop
 if not p_answers?k or jsonb_typeof(p_answers->k)<>'string'
  or p_answers->>k not in('a','b','c','u') then raise exception 'invalid answer';end if;
 end loop;
 if exists(select 1 from public.igr_v4_actions a where a.room_code=r.code
 and a.player_id=p.id and a.cycle=r.cycle and a.action_type in('v340_009_detail_report','debrief'))
 then raise exception 'already sealed';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'v340_009_detail_report',
   jsonb_build_object('answers',p_answers,'version','v340'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v340_009_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;
num int;piece jsonb;v_variant text;total_n int;core_n int;optional_n int;
begin
 perform igr_private.rate_limit('v340_009_investigate',p_player_token::text,28,60);
 select * into p from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'009' or r.status<>'playing'
 or r.cycle not between 1 and 3
 or not coalesce(igr_private.igr_v340_009_enabled(r.code),false)
 or not (r.phase in('investigation_assembly','interrogation_select','interrogation','cycle_debrief') or r.phase like 'annex_%')
 then raise exception 'unavailable';end if;
 if p_choice is null or p_choice !~ '^009_([1-9]|1[0-9]|20)$' then raise exception 'bad identifier';end if;
 num:=split_part(p_choice,'_',2)::int;
 if not exists(select 1 from jsonb_array_elements(igr_private.igr_v340_009_choices(r.code,r.cycle)) x
 where x->>'id'=p_choice) then raise exception 'not offered';end if;
 select s.pack,s.variant_id into pack,v_variant from igr_private.igr_v331_009_room_snapshots s where s.room_code=r.code;
 if num<=9 then piece:=pack->'investigation_009'->(num-1);
 else
 select i into piece from jsonb_array_elements(pack->'v340_private'->'optional') i
 where i->>'id'='009_'||v_variant||'_'||num::text and (i->>'cycle')::int=r.cycle limit 1;
 end if;
 if piece is null or (piece->>'cycle')::int<>r.cycle then raise exception 'invalid cycle';end if;
 select count(*),count(*) filter(where a.payload->>'choice' ~ '^009_[1-9]$'),
 count(*) filter(where a.payload->>'choice' ~ '^009_(1[0-9]|20)$')
 into total_n,core_n,optional_n from public.igr_v4_actions a
 where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_009';
 if total_n>=4 or (num<=9 and core_n>=3) or (num>=10 and optional_n>=1)
 or exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle
 and a.action_type='investigation_009' and a.payload->>'choice'=p_choice)
 then raise exception 'cycle budget exhausted';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_009',
 jsonb_build_object('choice',p_choice,'id',p_choice,'title',piece->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_009','roles',array['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('id',p_choice,'title',piece->>'title',
 'text',case when num<=9 then piece->>'result'
 else 'Source : '||coalesce(piece->'source_origins'->>0,'Pièce complémentaire')||E'\n'||(piece->>'result') end,
 'author',case when num<=9 then 'Constat officiel' else 'Trame complémentaire' end));
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
 if raw->'room'->>'scenario_id'='008'
 and coalesce(igr_private.igr_v310_008_enabled(p_code),false)
 then return igr_private.igr_v310_008_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='009'
 and coalesce(igr_private.igr_v340_009_enabled(p_code),false)
 then return igr_private.igr_v340_009_sync_overlay(p_code,p_player_token,raw);end if;
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

revoke all on function igr_private.igr_v340_009_enabled(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v340_009_prior_alignment(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v340_009_choices(text,integer) from public,anon,authenticated;
revoke all on function igr_private.igr_v340_009_sync_overlay(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.igr_v340_009_investigate(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_v340_009_submit_detail(text,uuid,jsonb) to anon,authenticated;
