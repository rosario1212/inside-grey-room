-- Inside Grey Room v288 — zero-spoiler adaptive evidence rules for 001–006.
-- This migration intentionally contains NO variant manuscripts, answers, character
-- secrets or scenario-specific documents: those are stored privately in Supabase.
-- It is safe for existing pinned rooms. Five-case question axes are taken from
-- a v288 manuscript when present and retain the v286 default as a fallback.
-- Chalet v288 offers use one scored + one neutral lead, while legacy rooms
-- without v288 source provenance retain their v283 behavior.

CREATE OR REPLACE FUNCTION igr_private.igr_v288_006_offered(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m jsonb;prior jsonb;v jsonb;
begin
 if p_cycle not between 1 and 3 then return '[]'::jsonb;end if;
 select manuscript into m from igr_private.igr_v99_room_canons
 where room_code=upper(btrim(p_room)) and scenario_id='006';
 if m is null or not(m ? 'v288_006_source_registry') then return '[]'::jsonb;end if;
 prior:=case when p_cycle>1 then igr_private.igr_v284_006_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 with weighted as (
  select x.item,
  case right(x.item->>'id',2)
   when '10' then 'motif' when '11' then 'parents' when '12' then 'photo'
   when '13' then 'photo' when '14' then 'call'
   when '15' then 'statements' when '16' then 'statements'
   when '17' then 'challenge' when '18' then 'camera'
   when '19' then 'mathis' when '20' then 'rescue'
   else 'other' end as axis,
  case when coalesce((prior->>'ready')::boolean,false) then
    case right(x.item->>'id',2)
      when '13' then -50*coalesce((prior->'wrong'->>'photo')::int,0)
      when '14' then -50*coalesce((prior->'wrong'->>'call')::int,0)
      when '15' then -50*coalesce((prior->'wrong'->>'statements')::int,0)
      when '16' then -25*coalesce((prior->'wrong'->>'statements')::int,0)
      when '17' then -50*coalesce((prior->'wrong'->>'challenge')::int,0)
      when '18' then -50*coalesce((prior->'wrong'->>'camera')::int,0)
      when '19' then -50*coalesce((prior->'wrong'->>'mathis')::int,0)-20*coalesce((prior->'wrong'->>'cause')::int,0)
      else 0 end
   else 0 end as priority,
   md5(upper(btrim(p_room))||':'||p_cycle::text||':target:'||(x.item->>'id')) as tie
  from jsonb_array_elements(m->'v283_adaptive_investigations_draft'->'optional_investigations') x(item)
  where (x.item->>'cycle')::int=p_cycle
    and coalesce((x.item->>'selectable_not_guaranteed')::boolean,false)
 ), targeted as (select * from weighted order by priority,tie limit 1),
 neutral as (select w.* from weighted w
 where w.item->>'id'<>(select t.item->>'id' from targeted t)
 order by case when w.axis=(select t.axis from targeted t) then 1 else 0 end,
 md5(upper(btrim(p_room))||':'||p_cycle::text||':independent:'||(w.item->>'id')) limit 1),
 offered as (select item from targeted union all select item from neutral)
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',regexp_replace(item->>'id','^006_[ABC]_','006_'),
 'title',item->>'title','cycle',p_cycle)
 order by md5(upper(btrim(p_room))||':'||p_cycle::text||':mixed:'||(item->>'id'))),'[]'::jsonb) into v from offered;
 return v;
end
$function$;

revoke all on function igr_private.igr_v288_006_offered(text,integer) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v283_006_offered(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 r public.igr_v4_rooms%rowtype;m jsonb;v_focus text;v_result jsonb;
 detailed boolean;prior jsonb;
begin
 select * into r from public.igr_v4_rooms where code=upper(btrim(p_room));
 if not found or r.scenario_id<>'006' or p_cycle not between 1 and 3 then return '[]'::jsonb;end if;
 select manuscript into m from igr_private.igr_v99_room_canons where room_code=r.code and scenario_id='006';
 if m->'v283_adaptive_investigations_draft' is null then return '[]'::jsonb;end if;
 if m ? 'v288_006_source_registry' then return igr_private.igr_v288_006_offered(r.code,p_cycle);end if;
 detailed:=coalesce((m->'v284_detailed_questionnaire'->>'enabled')::boolean,false);
 v_focus:=coalesce(r.state->'investigation_focus'->>'key','libre');
 prior:=case when detailed and p_cycle>1 then igr_private.igr_v284_006_prior_alignment(r.code,p_cycle-1) else '{}'::jsonb end;
 select coalesce(jsonb_agg(jsonb_build_object('id',regexp_replace(x.item->>'id','^006_[ABC]_','006_'),
   'title',x.item->>'title','cycle',p_cycle) order by x.priority,x.tie),'[]'::jsonb)
 into v_result
 from (
   select i as item,
   case
    when detailed and coalesce((prior->>'ready')::boolean,false) then
     case right(i->>'id',2)
      when '13' then -50*coalesce((prior->'wrong'->>'photo')::integer,0)
      when '14' then -50*coalesce((prior->'wrong'->>'call')::integer,0)
      when '15' then -50*coalesce((prior->'wrong'->>'statements')::integer,0)
      when '16' then -25*coalesce((prior->'wrong'->>'statements')::integer,0)
      when '17' then -50*coalesce((prior->'wrong'->>'challenge')::integer,0)
      when '18' then -50*coalesce((prior->'wrong'->>'camera')::integer,0)
      when '19' then -50*coalesce((prior->'wrong'->>'mathis')::integer,0)-20*coalesce((prior->'wrong'->>'cause')::integer,0)
      else 0 end
    when detailed then 0
    when v_focus='chronologie' and right(i->>'id',2) in ('12','14','20') then 0
    when v_focus='temoignages' and right(i->>'id',2) in ('11','16','19') then 0
    when v_focus='mobile' and right(i->>'id',2) in ('10','13','17') then 0
    when v_focus='materiel' and right(i->>'id',2) in ('12','15','18') then 0
    when v_focus='responsabilite' and right(i->>'id',2) in ('10','16','19') then 0
    when v_focus='acces' and right(i->>'id',2) in ('12','14','18') then 0
    else 1 end as priority,
    md5(r.code||':'||p_cycle::text||':'||case when detailed then 'v284' else v_focus end||':'||(i->>'id')) as tie
   from jsonb_array_elements(coalesce(m->'v283_adaptive_investigations_draft'->'optional_investigations','[]'::jsonb)) i
   where (i->>'cycle')::integer=p_cycle
   order by priority,tie limit 2
 ) x;
 return v_result;
end $function$;

revoke all on function igr_private.igr_v283_006_offered(text,integer) from public,anon,authenticated;

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
   v_axis:=coalesce(v_m->'v288_investigation_policy'->'question_axes'->(p_previous_cycle::text)->>('q'||v_idx::text),
     case v_idx when 1 then 'chronologie' when 2 then 'materiel'
     when 3 then 'temoignages' else 'responsabilite' end);
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

revoke all on function igr_private.igr_v286_prior_alignment(text,integer) from public,anon,authenticated;

-- Regression suites (run in private database after installing its protected QA tables):
-- select igr_private.igr_v288_adaptive_candidate_smoke();
-- select igr_private.igr_v288_six_case_candidate_smoke();
-- select igr_private.igr_v284_006_detail_smoke();
