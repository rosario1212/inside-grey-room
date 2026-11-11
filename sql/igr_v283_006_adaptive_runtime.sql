-- Inside Grey Room / Scenario 006 / v283 adaptive investigations
-- Reproducible production runtime definitions, no private manuscript or variant truth.
-- Only rooms pinned with a v283 optional-investigation payload activate this feature.

CREATE OR REPLACE FUNCTION igr_private.igr_v283_006_offered(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room public.igr_v4_rooms%rowtype;
  v_manuscript jsonb;
  v_focus text;
  v_result jsonb;
begin
  select * into v_room from public.igr_v4_rooms where code=upper(btrim(p_room));
  if not found or v_room.scenario_id<>'006' or p_cycle not between 1 and 3
  then return '[]'::jsonb; end if;
  select c.manuscript into v_manuscript from igr_private.igr_v99_room_canons c
    where c.room_code=v_room.code and c.scenario_id='006';
  if v_manuscript->'v283_adaptive_investigations_draft' is null
  then return '[]'::jsonb; end if;
  v_focus:=coalesce(v_room.state->'investigation_focus'->>'key','libre');
  select coalesce(jsonb_agg(jsonb_build_object('id',regexp_replace(z.i->>'id','^006_[ABC]_','006_'),'title',z.i->>'title','cycle',p_cycle) order by z.priority,z.rnd),'[]'::jsonb)
    into v_result from (
     select i,
     case
       when v_focus='chronologie' and right(i->>'id',2) in ('12','14','20') then 0
       when v_focus='temoignages' and right(i->>'id',2) in ('11','16','19') then 0
       when v_focus='mobile' and right(i->>'id',2) in ('10','13','17') then 0
       when v_focus='materiel' and right(i->>'id',2) in ('12','15','18') then 0
       when v_focus='responsabilite' and right(i->>'id',2) in ('10','16','19') then 0
       when v_focus='acces' and right(i->>'id',2) in ('12','14','18') then 0
       else 1 end as priority,
     md5(v_room.code||':'||p_cycle::text||':'||v_focus||':'||(i->>'id')) as rnd
     from jsonb_array_elements(coalesce(v_manuscript->'v283_adaptive_investigations_draft'->'optional_investigations','[]'::jsonb)) i
     where (i->>'cycle')::integer=p_cycle
     order by priority,rnd limit 2
    ) z;
  return v_result;
end
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v279_006_render(p jsonb, m jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v jsonb:=m->'v279_cards'; r jsonb:=m->'v279_runtime';
 c jsonb; a jsonb:='[]'; rel jsonb:='{}'; ch jsonb:='[]'; tl jsonb:='[]'; days text; n int; words int; raw text; rr jsonb; levels jsonb;
begin
 if jsonb_array_length(v->'cards')<>3 or jsonb_array_length(r->'investigations')<>9 or jsonb_array_length(r->'trames')<>3 then raise exception '006 draft incomplete'; end if;
 levels:=r->'truth'->'levels';
 for n in 0..2 loop
  c:=v->'cards'->n;rr:=v->'relations'->((n+1)::text);
  if (c->>'victory_level')::int<>(levels->>n)::int or jsonb_array_length(c->'day')<>3 or jsonb_array_length(rr)<>2 then raise exception '006 inconsistent slot %',n;end if;
  select string_agg(d.idx::text||'. '||d.line,E'\n' order by d.idx) into days from jsonb_array_elements_text(c->'day') with ordinality d(line,idx);
  raw:=concat_ws(' ',c->>'identity',c->>'story',days,c->>'known',c->>'secret',c->>'goal',(select string_agg(e->>'known_fact',' ') from jsonb_array_elements(rr) e));
  words:=cardinality(regexp_split_to_array(btrim(regexp_replace(raw,'\s+',' ','g')),' '));
  if words>203 or words<100 or lower(raw) like '%tu ignores %' or lower(raw) like '%sans savoir que%' then raise exception '006 word limit or leak % %',n,words;end if;
  a:=a||jsonb_build_array(jsonb_build_object('place',c->>'identity','story',c->>'story','chronology',days,'anchors',c->>'known','hide',c->>'secret','position',c->>'goal','objective_main',c->>'goal'));
  rel:=jsonb_set(rel,array[(n+1)::text],(select jsonb_agg(jsonb_build_object('slot',(e->>'target_slot')::int,'text',e->>'known_fact')) from jsonb_array_elements(rr) e),true);
  ch:=ch||jsonb_build_array(jsonb_build_object('slot',n+1,'place',c->>'identity','chronology',days,'anchors',c->>'known','hide',c->>'secret'));
  tl:=tl||to_jsonb(days);
 end loop;
 return p||jsonb_build_object('context',r->>'public_context','suspects',a,'relations',rel,'trames',r->'trames','investigation_006',r->'investigations'||coalesce(m->'v283_adaptive_investigations_draft'->'optional_investigations','[]'::jsonb),'protected','[]'::jsonb,'field_actions','[]'::jsonb,'expert_actions','[]'::jsonb,'truth',p->'truth'||jsonb_build_object('summary',r->'truth'->>'summary','levels',levels,'reconstruction_006',r->'truth'->'reconstruction','pact_audit_006',CASE WHEN r->>'version'='v280-006-mountain' THEN r->'truth'->'pact_audit_006' ELSE jsonb_build_object('no_strike',CASE WHEN m->>'id'='A' THEN 'confirmed' ELSE 'contradicted' END,'strike',CASE WHEN m->>'id'='A' THEN 'contradicted' ELSE 'confirmed' END,'signs_alive',CASE WHEN m->>'id'='C' THEN 'confirmed' ELSE 'not_established' END,'help_refused',CASE WHEN m->>'id'='C' THEN 'confirmed' ELSE 'not_established' END,'undetermined','unasserted','finding',r->'truth'->>'summary','boundary','Les déclarations libres ne suffisent pas à prouver un mensonge.') END,'cinematic',jsonb_build_object('turn',r->'truth'->>'turn','reframes',r->'truth'->'audit_beats','final_line',r->'truth'->>'final_line','characters',ch,'timeline',tl)));
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v262_006_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 r public.igr_v4_rooms%rowtype;
 p public.igr_v4_players%rowtype;
 pack jsonb; item jsonb; v_public_id text;
 v_adaptive boolean;v_optional boolean; v_count integer;v_core_count integer;v_opt_count integer;
begin
 perform igr_private.rate_limit('006_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'006' or r.status<>'playing' then raise exception 'unavailable';end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief') or r.phase like 'annex_%')
 or r.cycle not between 1 and 3 then raise exception 'wrong phase';end if;
 pack:=igr_private.igr_v260_006_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable';end if;
 v_adaptive:=coalesce(pack->'truth'->'reconstruction_006'->>'mode','')='mountain_v1'
        and jsonb_array_length(coalesce(pack->'investigation_006','[]'::jsonb))=20;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_006','[]'::jsonb)) x(value)
 where (x.value->>'cycle')::integer=r.cycle
 and (x.value->>'id'=p_choice or (v_adaptive and regexp_replace(x.value->>'id','^006_[ABC]_','006_')=p_choice))
 limit 1;
 if item is null then raise exception 'invalid choice';end if;
 v_optional:=coalesce((item->>'selectable_not_guaranteed')::boolean,false);
 v_public_id:=case when v_adaptive then regexp_replace(item->>'id','^006_[ABC]_','006_') else item->>'id' end;
 select count(*)::integer,
        count(*) filter(where (a.payload->>'choice') ~ '^006_(1[0-9]|20)$')::integer,
        count(*) filter(where (a.payload->>'choice') ~ '^006_([1-9])$')::integer
 into v_count,v_opt_count,v_core_count from public.igr_v4_actions a
 where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_006';
 if exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle
    and a.action_type='investigation_006' and a.payload->>'choice'=v_public_id)
 then raise exception 'camp investigation used';end if;
 if v_adaptive then
   if v_count>=4 then raise exception 'camp investigation used';end if;
   if v_optional then
     if v_opt_count>=1 or not exists(
       select 1 from jsonb_array_elements(igr_private.igr_v283_006_offered(r.code,r.cycle)) z
       where z->>'id'=v_public_id)
     then raise exception 'camp investigation used';end if;
   else
     if v_core_count>=3 then raise exception 'camp investigation used';end if;
   end if;
 elsif coalesce(pack->'truth'->'reconstruction_006'->>'mode','')='mountain_v1' then
   if v_count>=3 then raise exception 'camp investigation used';end if;
 else
   if v_count>=1 then raise exception 'camp investigation used';end if;
 end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_006',jsonb_build_object('choice',v_public_id,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_006','roles',array['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('id',v_public_id,'title',item->>'title','text',item->>'result','author','Enquête de terrain'));
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
 return raw;
end $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v283_006_adaptive_smoke()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v text; c text; rr public.igr_v4_rooms%rowtype;
 seat integer; enq uuid; sus uuid; cy integer; idx integer;
 resp jsonb; options jsonb; core text; opt_id text; forbidden_id text;
 ok_cnt integer:=0;opt_cnt integer:=0; variant_cnt integer:=0;
begin
 for v in select unnest(array['A','B','C']::text[]) loop
  c:='Q'||upper(substr(md5(random()::text||clock_timestamp()::text),1,5));
  begin
    insert into public.igr_v4_rooms(code,scenario_id) values(c,'006') returning * into rr;
    for seat in 0..4 loop
      insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
      values(c,'QA Adaptive '||seat::text,seat,seat=0);
    end loop;
    insert into igr_private.igr_v99_room_canons(room_code,scenario_id,variant_id,manuscript,manuscript_md5)
    select c,'006',v,ca.manuscript||jsonb_build_object('v283_adaptive_investigations_draft',d.manuscript->'v283_adaptive_investigations_draft'),
    md5((ca.manuscript||jsonb_build_object('v283_adaptive_investigations_draft',d.manuscript->'v283_adaptive_investigations_draft'))::text)
    from igr_private.igr_006_mountain_release_candidates_20261111 ca
    join igr_private.igr_006_mountain_rewrite_drafts_20261111 d using (variant_id)
    where ca.variant_id=v;
    perform public.igr_v4_start_game(c,rr.host_token);
    select player_token into enq from public.igr_v4_players
      where room_code=c and public_role='enqueteur' limit 1;
    select player_token into sus from public.igr_v4_players
      where room_code=c and public_role='suspect' limit 1;
    if enq is null or sus is null then raise exception 'QA 006 missing roles variant %',v;end if;
    for cy in 1..3 loop
      update public.igr_v4_rooms set cycle=cy,phase='interrogation_select',
        state=jsonb_set(coalesce(state,'{}'::jsonb),'{investigation_focus}',jsonb_build_object('key',case when cy=1 then 'mobile' when cy=2 then 'chronologie' else 'responsabilite' end),true)
      where code=c;
      resp:=public.igr_v4_sync(c,enq);
      options:=coalesce(resp->'scenario'->'investigation_006','[]'::jsonb);
      if jsonb_array_length(options)<>5 then raise exception 'wrong offered count % c% got %',v,cy,jsonb_array_length(options);end if;
      if exists(select 1 from jsonb_array_elements(options) e where e->>'id' like '006_'||v||'_%') then raise exception 'variant leaked via IDs';end if;
      if (resp->'scenario'->>'investigation_006_limit')::integer<>4 then raise exception 'budget missing';end if;
      select e->>'id' into opt_id from jsonb_array_elements(options) e
        where (e->>'id')~'^006_(1[0-9]|20)$' limit 1;
      if opt_id is null then raise exception 'optional not offered % %',v,cy;end if;
      perform public.igr_v262_006_investigate(c,enq,opt_id);
      opt_cnt:=opt_cnt+1;
      for idx in 1..3 loop
        core:='006_'||(1+(cy-1)*3+idx-1)::text;
        perform public.igr_v262_006_investigate(c,enq,core);
        ok_cnt:=ok_cnt+1;
      end loop;
      select e->>'id' into forbidden_id from jsonb_array_elements(options) e
       where (e->>'id')~'^006_(1[0-9]|20)$' and e->>'id'<>opt_id limit 1;
      if forbidden_id is not null then
        begin
          perform public.igr_v262_006_investigate(c,enq,forbidden_id);
          raise exception 'second optional improperly accepted';
        exception when others then
          if sqlerrm='second optional improperly accepted' then raise;end if;
        end;
      end if;
      resp:=public.igr_v4_sync(c,sus);
      if jsonb_array_length(coalesce(resp->'scenario'->'investigation_006','[]'::jsonb))>0 then raise exception 'suspect sees options';end if;
      if exists(select 1 from jsonb_array_elements(coalesce(resp->'events','[]'::jsonb)) e where e->>'event_type'='investigation_006') then raise exception 'suspect sees restricted evidence';end if;
    end loop;
    variant_cnt:=variant_cnt+1;
    raise exception using errcode='PT001',message='ROLLBACK';
  exception when sqlstate 'PT001' then null;
  end;
 end loop;
 return jsonb_build_object('ok',variant_cnt=3 and ok_cnt=27 and opt_cnt=9,'variants',variant_cnt,
  'canonical_investigations',ok_cnt,'optional_investigations',opt_cnt,'temporary_rooms_persisted',false);
end $function$;

REVOKE ALL ON FUNCTION igr_private.igr_v283_006_offered(text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v283_006_adaptive_smoke() FROM PUBLIC, anon, authenticated;
