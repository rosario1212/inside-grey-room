-- IGR scenario 006 / v284 detailed evidence-alignment runtime
-- Live PostgreSQL function definitions; no private A/B/C manuscript content.
-- Reads two independently sealed investigator/analyst debriefs from the previous cycle.
-- "unsure" is neutral; no accuracy counts enter player sync or narrative scoring.
-- Scenario gating: v284_detailed_questionnaire.enabled in a room-pinned manuscript.

CREATE OR REPLACE FUNCTION public.igr_v284_006_submit_detail(p_code text, p_player_token uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;m jsonb;k text;allowed text[];v text;
begin
 perform igr_private.rate_limit('006_detail',p_player_token::text,10,60);
 select * into p from public.igr_v4_players where room_code=upper(btrim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'006' or r.status<>'playing' or r.phase<>'cycle_debrief' or r.cycle not in (1,2) then raise exception 'wrong phase';end if;
 select manuscript into m from igr_private.igr_v99_room_canons where room_code=r.code and scenario_id='006';
 if coalesce((m->'v284_detailed_questionnaire'->>'enabled')::boolean,false) is not true then raise exception 'unavailable';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or length(p_answers::text)>700
 or (select count(*) from jsonb_object_keys(p_answers))<>4 then raise exception 'invalid answers';end if;
 allowed:=case when r.cycle=1 then array['photo','call','statements','cause'] else array['challenge','camera','mathis','cause'] end;
 foreach k in array allowed loop
   if not p_answers?k or jsonb_typeof(p_answers->k)<>'string' then raise exception 'invalid answers';end if;
   v:=p_answers->>k;
   if not (case k
    when 'photo' then v=any(array['only_timestamp','proves_peace','unsure'])
    when 'call' then v=any(array['fixed_1617','no_call','unsure'])
    when 'statements' then v=any(array['claims_not_proof','prove_accident','unsure'])
    when 'challenge' then v=any(array['targeted_after_success','voluntary_second','unsure'])
    when 'camera' then v=any(array['cuts_before_fall','films_fall','unsure'])
    when 'mathis' then v=any(array['partial_view','saw_final_contact','unsure'])
    when 'cause' then v=any(array['slip','hugo_push','eliott_jacket','unsure'])
    else false end) then raise exception 'invalid answers';end if;
 end loop;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type='006_detail_report')
 then raise exception 'already submitted';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'006_detail_report',jsonb_build_object('answers',p_answers,'version','v284'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v284_006_prior_alignment(p_room text, p_previous_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_variant text;v_enq jsonb;v_ana jsonb;
 v_expected jsonb;v_wrong jsonb:='{}'::jsonb;v_correct jsonb:='{}'::jsonb;
 v_ans jsonb;v_key text;v_val text;v_goal text;n integer;
begin
 if p_previous_cycle not in (1,2) then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_correct);end if;
 select variant_id into v_variant from igr_private.igr_v99_room_canons where room_code=upper(btrim(p_room)) and scenario_id='006';
 if v_variant not in ('A','B','C') then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_correct);end if;
 select a.payload->'answers' into v_enq from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle and a.action_type='006_detail_report' and p.public_role='enqueteur' order by a.id desc limit 1;
 select a.payload->'answers' into v_ana from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id and p.room_code=a.room_code
 where a.room_code=upper(btrim(p_room)) and a.cycle=p_previous_cycle and a.action_type='006_detail_report' and p.public_role='analyste' order by a.id desc limit 1;
 if v_enq is null or v_ana is null then return jsonb_build_object('ready',false,'wrong',v_wrong,'correct',v_correct);end if;
 v_expected:=case when p_previous_cycle=1 then
 jsonb_build_object('photo','only_timestamp','call','fixed_1617','statements','claims_not_proof')
 else jsonb_build_object('challenge','targeted_after_success','camera','cuts_before_fall','mathis','partial_view',
 'cause',case v_variant when 'A' then 'slip' when 'B' then 'hugo_push' else 'eliott_jacket' end) end;
 for v_ans in select v_enq union all select v_ana loop
  for v_key,v_goal in select key,value from jsonb_each_text(v_expected) loop
   v_val:=coalesce(v_ans->>v_key,'unsure');
   if v_val='unsure' then continue;end if;
   if v_val=v_goal then
    n:=coalesce((v_correct->>v_key)::integer,0)+1;
    v_correct:=jsonb_set(v_correct,array[v_key],to_jsonb(n),true);
   else
    n:=coalesce((v_wrong->>v_key)::integer,0)+1;
    v_wrong:=jsonb_set(v_wrong,array[v_key],to_jsonb(n),true);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('ready',true,'wrong',v_wrong,'correct',v_correct);
end $function$;

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

CREATE OR REPLACE FUNCTION igr_private.igr_v284_006_detail_smoke()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v text;c text;r public.igr_v4_rooms%rowtype; seat int;
 enq uuid;ana uuid;sus uuid; m jsonb; response jsonb; offered jsonb; accuracy jsonb;
 tested integer:=0; records integer:=0; data1 jsonb; data2 jsonb;
begin
 for v in select unnest(array['A','B','C']::text[]) loop
  c:='Q'||upper(substr(md5(clock_timestamp()::text||random()::text),1,5));
  begin
   insert into public.igr_v4_rooms(code,scenario_id) values(c,'006') returning * into r;
   for seat in 0..4 loop
    insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
    values(c,'QA Accuracy '||seat,seat,seat=0);
   end loop;
   insert into igr_private.igr_v99_room_canons(room_code,scenario_id,variant_id,manuscript,manuscript_md5)
   select c,'006',v,
       ca.manuscript||jsonb_build_object(
        'v283_adaptive_investigations_draft',dr.manuscript->'v283_adaptive_investigations_draft',
        'v284_detailed_questionnaire',jsonb_build_object('enabled',true,'version','v284')),
       md5((ca.manuscript||jsonb_build_object(
        'v283_adaptive_investigations_draft',dr.manuscript->'v283_adaptive_investigations_draft',
        'v284_detailed_questionnaire',jsonb_build_object('enabled',true,'version','v284')))::text)
   from igr_private.igr_006_mountain_release_candidates_20261111 ca
   join igr_private.igr_006_mountain_rewrite_drafts_20261111 dr using(variant_id)
   where ca.variant_id=v;
   perform public.igr_v4_start_game(c,r.host_token);
   select player_token into enq from public.igr_v4_players where room_code=c and public_role='enqueteur' limit 1;
   select player_token into ana from public.igr_v4_players where room_code=c and public_role='analyste' limit 1;
   select player_token into sus from public.igr_v4_players where room_code=c and public_role='suspect' limit 1;
   if enq is null or ana is null or sus is null then raise exception 'missing QA roles';end if;
   update public.igr_v4_rooms set phase='cycle_debrief',cycle=1 where code=c;
   data1:='{"photo":"proves_peace","call":"fixed_1617","statements":"claims_not_proof","cause":"unsure"}'::jsonb;
   perform public.igr_v284_006_submit_detail(c,enq,data1);
   accuracy:=igr_private.igr_v284_006_prior_alignment(c,1);
   if coalesce((accuracy->>'ready')::boolean,false) then raise exception 'must need two independent reports';end if;
   perform public.igr_v284_006_submit_detail(c,ana,data1);
   accuracy:=igr_private.igr_v284_006_prior_alignment(c,1);
   if (accuracy->>'ready')::boolean is not true or (accuracy->'wrong'->>'photo')::int<>2
     or (accuracy->'correct'->>'call')::int<>2
   then raise exception 'C1 detailed scoring failed %',accuracy;end if;
   update public.igr_v4_rooms set phase='interrogation_select',cycle=2 where code=c;
   offered:=igr_private.igr_v283_006_offered(c,2);
   if jsonb_array_length(offered)<>2 or not exists(select 1 from jsonb_array_elements(offered) e where e->>'id'='006_13')
   then raise exception 'C2 did not prioritize photographic contradiction %',offered;end if;
   update public.igr_v4_rooms set phase='cycle_debrief' where code=c;
   data2:='{"challenge":"voluntary_second","camera":"cuts_before_fall","mathis":"partial_view","cause":"unsure"}'::jsonb;
   perform public.igr_v284_006_submit_detail(c,enq,data2);
   perform public.igr_v284_006_submit_detail(c,ana,data2);
   accuracy:=igr_private.igr_v284_006_prior_alignment(c,2);
   if (accuracy->'wrong'->>'challenge')::int<>2 or (accuracy->'correct'->>'camera')::int<>2
     or accuracy->'wrong' ? 'cause'
   then raise exception 'C2 detailed scoring failed %',accuracy;end if;
   update public.igr_v4_rooms set phase='interrogation_select',cycle=3 where code=c;
   offered:=igr_private.igr_v283_006_offered(c,3);
   if jsonb_array_length(offered)<>2 or not exists(select 1 from jsonb_array_elements(offered) e where e->>'id'='006_17')
   then raise exception 'C3 failed to prioritize challenge cross-check %',offered;end if;
   response:=public.igr_v4_sync(c,enq);
   if response->'scenario'->>'investigation_006_detailed'<>'true'
   or jsonb_array_length(response->'scenario'->'investigation_006')<>5
   or response::text like '%v284_006_prior_alignment%'
   then raise exception 'Investigator sync mismatch';end if;
   response:=public.igr_v4_sync(c,sus);
   if response->'scenario' ? 'investigation_006_detailed'
   or jsonb_array_length(coalesce(response->'scenario'->'investigation_006','[]'::jsonb))<>0
   then raise exception 'suspect leak';end if;
   tested:=tested+1;records:=records+4;
   raise exception using errcode='PT001',message='ROLLBACK';
  exception when sqlstate 'PT001' then null;
  end;
 end loop;
 return jsonb_build_object('ok',tested=3 and records=12,'variants',tested,'sealed_reports',records,'temporary_rooms_persisted',false);
end $function$;
REVOKE EXECUTE ON FUNCTION public.igr_v284_006_submit_detail(text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.igr_v284_006_submit_detail(text,uuid,jsonb) TO anon, authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v284_006_prior_alignment(text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v283_006_offered(text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v284_006_detail_smoke() FROM PUBLIC, anon, authenticated;
