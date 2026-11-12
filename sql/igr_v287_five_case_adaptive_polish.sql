-- IGR v287 — generic optional evidence routing only.
-- PRIVATE STORY CONTENT IS NEVER COMMITTED TO THIS PUBLIC REPOSITORY.
-- The 165 scenario- and variant-specific investigation texts live in a
-- privately RLS-protected database table, and each room pins its manuscript.
-- The 15 canonical manuscripts are activated only after editorial review,
-- QA verification, successful Cloudflare deployment, and checksum-matched backup.
-- This SQL does not turn any scenario on or change existing room manuscripts.

CREATE OR REPLACE FUNCTION igr_private.igr_v286_choices(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sid text;m jsonb;core jsonb;primary_choices jsonb;extras jsonb;assessment jsonb;
begin
 if p_cycle not between 1 and 3 or not coalesce(igr_private.igr_v286_enabled(p_room),false)
 then return '[]'::jsonb;end if;
 select scenario_id,manuscript into sid,m from igr_private.igr_v99_room_canons
 where room_code=upper(btrim(p_room)) and scenario_id in('001','002','003','004','005');
 core:=igr_private.igr_v286_core(p_room);
 if jsonb_array_length(core)<>9 then raise exception 'invalid source pack';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',sid||'_'||e.ord::text,
  'title',e.item->>'title','cycle',p_cycle) order by e.ord),'[]'::jsonb)
 into primary_choices from jsonb_array_elements(core) with ordinality as e(item,ord)
 where (e.item->>'cycle')::int=p_cycle;
 assessment:=case when p_cycle>1 then igr_private.igr_v286_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 with ranked as (
  select i.item,
   case when coalesce((assessment->>'ready')::boolean,false) then
    coalesce((select sum(
      -35*coalesce((assessment->'wrong'->>f.axis)::int,0)
      +7*coalesce((assessment->'correct'->>f.axis)::int,0)
    ) from jsonb_array_elements_text(coalesce(i.item->'focus_axes',
        jsonb_build_array(i.item->>'axis'))) f(axis)),0)
    else 0 end as score,
   md5(upper(btrim(p_room))||':'||p_cycle::text||':target:'||(i.item->>'id')) as target_tie
  from jsonb_array_elements(m->'v286_investigations'->'optional_investigations') i(item)
  where (i.item->>'cycle')::int=p_cycle
   and coalesce((i.item->>'optional')::boolean,false)
 ),
 targeted as (select * from ranked order by score,target_tie limit 1),
 neutral as (
  select r.* from ranked r where r.item->>'id'<>
    (select t.item->>'id' from targeted t)
  order by
   case when exists(
     select 1 from jsonb_array_elements_text(coalesce(r.item->'focus_axes',jsonb_build_array(r.item->>'axis'))) x(axis)
     join jsonb_array_elements_text(coalesce((select t.item->'focus_axes' from targeted t),'[]'::jsonb)) y(axis)
     on x.axis=y.axis
   ) then 1 else 0 end,
   md5(upper(btrim(p_room))||':'||p_cycle::text||':neutral:'||(r.item->>'id')) limit 1
 ),
 offered as (select item from targeted union all select item from neutral)
 select coalesce(jsonb_agg(
 jsonb_build_object('id',sid||'_'||right(item->>'id',2),
 'title',item->>'title','cycle',p_cycle)
 order by md5(upper(btrim(p_room))||':'||p_cycle::text||':mixed:'||(item->>'id'))),'[]'::jsonb)
 into extras from offered;
 return primary_choices||extras;
end
$function$
;

CREATE OR REPLACE FUNCTION igr_private.igr_v287_adaptive_candidate_smoke()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 c record;v_live jsonb;m jsonb;code text;enq uuid;ana uuid;
 prev_cycle integer;idx integer;axis text;goal text;wrong text;
 ans jsonb;menu jsonb;tested int:=0;rooms int:=0;v_report jsonb;
begin
 for c in
  select cand.*,v.manuscript live_m from igr_private.igr_v286_investigation_candidates_001_005 cand
  join igr_private.igr_v99_variant_manuscripts v using(scenario_id,variant_id)
  where cand.candidate_status='v287_rewritten_review'
  order by cand.scenario_id,cand.variant_id
 loop
  code:='V'||upper(substr(md5(clock_timestamp()::text||random()::text),1,5));
  begin
   m:=c.live_m||jsonb_build_object('v286_investigations',
    (c.live_m->'v286_investigations')||jsonb_build_object(
      'enabled',true,'optional_investigations',c.optional_investigations,'detail_goals',c.detail_goals));
   insert into public.igr_v4_rooms(code,scenario_id,status,phase,cycle)
   values(code,c.scenario_id,'playing','cycle_debrief',1);
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,public_role)
   values(code,'QA enquêteur',0,true,'enqueteur') returning id into enq;
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,public_role)
   values(code,'QA analyste',1,false,'analyste') returning id into ana;
   insert into igr_private.igr_v99_room_canons(room_code,scenario_id,variant_id,manuscript,manuscript_md5)
   values(code,c.scenario_id,c.variant_id,m,md5(m::text));
   if jsonb_array_length(igr_private.igr_v286_choices(code,1))<>5
     then raise exception 'C1 menu not five % %',c.scenario_id,c.variant_id;end if;
   for prev_cycle in 1..2 loop
    for idx in 1..4 loop
     axis:=case idx when 1 then 'chronologie' when 2 then 'materiel'
       when 3 then 'temoignages' else 'responsabilite' end;
     goal:=c.detail_goals->(prev_cycle::text)->>('q'||idx::text);
     if goal not in('a','b','c') then raise exception 'bad answer key';end if;
     wrong:=case when goal='a' then 'b' else 'a' end;
     ans:=jsonb_build_object('q1','u','q2','u','q3','u','q4','u');
     ans:=jsonb_set(ans,array['q'||idx::text],to_jsonb(wrong),true);
     delete from public.igr_v4_actions where room_code=code and cycle=prev_cycle
       and action_type='v286_detail_report';
     insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
     values(code,enq,prev_cycle,'v286_detail_report',jsonb_build_object('answers',ans)),
       (code,ana,prev_cycle,'v286_detail_report',jsonb_build_object('answers',ans));
     v_report:=igr_private.igr_v286_prior_alignment(code,prev_cycle);
     if not coalesce((v_report->>'ready')::boolean,false)
      or coalesce((v_report->'wrong'->>axis)::int,0)<>2
      then raise exception 'alignment not actionable % % %',c.scenario_id,c.variant_id,axis;end if;
     menu:=igr_private.igr_v286_choices(code,prev_cycle+1);
     if jsonb_array_length(menu)<>5
      or not exists(
       select 1 from jsonb_array_elements(menu) offered
       join jsonb_array_elements(c.optional_investigations) x
        on offered->>'id'=c.scenario_id||'_'||right(x->>'id',2)
       where (x->>'cycle')::int=prev_cycle+1 and x->'focus_axes'?axis)
     then raise exception 'no relevant offer case % % cycle % axis %: %',c.scenario_id,c.variant_id,prev_cycle,axis,menu;end if;
     tested:=tested+1;
    end loop;
   end loop;
   rooms:=rooms+1;
   raise exception using errcode='PT001',message='qa rollback';
  exception when sqlstate 'PT001' then null;
  end;
 end loop;
 return jsonb_build_object('ok',rooms=15 and tested=120,
 'variants',rooms,'error_axis_scenarios_verified',tested,'temporary_rooms_persisted',false);
end
$function$
;

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
 jsonb_build_object('id',p_choice,'title',v_title,'text',case when num<=9 then v_item->>'result' else 'Source : '||coalesce(v_item->'source_origins'->>0,'Document du dossier')||E'\n'||(v_item->>'result') end,
  'author',case when num<=9 then 'Examen des pièces' else 'Pièce complémentaire' end));
 return jsonb_build_object('ok',true,'cycle',r.cycle,'used',v_total+1);
end $function$
;

-- Run only with database-owner privileges; private QA rolls back its test rooms.
select igr_private.igr_v287_adaptive_candidate_smoke();
select igr_private.igr_v286_five_case_smoke();
