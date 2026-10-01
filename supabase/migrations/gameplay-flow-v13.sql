-- Inside Grey Room v13 — core gameplay flow candidate
-- Scope: scenarios 001–020 only. DLC 021+ deliberately keep the current v12 flow.
-- IMPORTANT: create a real Supabase migration with `supabase migration new gameplay_flow_v13`
-- and paste this file into it. Do not apply blindly to production before playtest.

-- -----------------------------------------------------------------------------
-- 0. Helpers
-- -----------------------------------------------------------------------------
create or replace function public.igr_v13_is_core_scenario(p_scenario text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_scenario,'') between '001' and '020';
$$;

create or replace function public.igr_v13_has_role(p_room text,p_role text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.igr_v4_players
    where room_code=p_room and public_role=p_role
  );
$$;

create or replace function public.igr_v13_interrogation_limit(p_room text,p_cycle integer)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare has_analyst boolean;
begin
  has_analyst:=public.igr_v13_has_role(p_room,'analyste');
  if p_cycle=1 then return 3; end if;
  if p_cycle=2 then return 2; end if;
  if p_cycle=3 then return case when has_analyst then 1 else 2 end; end if;
  return 0;
end
$$;

revoke all on function public.igr_v13_is_core_scenario(text) from public;
revoke all on function public.igr_v13_has_role(text,text) from public;
revoke all on function public.igr_v13_interrogation_limit(text,integer) from public;
grant execute on function public.igr_v13_is_core_scenario(text) to service_role;
grant execute on function public.igr_v13_has_role(text,text) to service_role;
grant execute on function public.igr_v13_interrogation_limit(text,integer) to service_role;

-- -----------------------------------------------------------------------------
-- 1. Event catalogue computed from public roles only.
--    No private objective or canonical truth is exposed here.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v13_event_options(p_room text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  r public.igr_v4_rooms%rowtype;
  q jsonb:='[]'::jsonb;
  used jsonb;
  suspect_count integer;
  has_analyst boolean;
  has_third boolean;
  interrogation_used integer;
  interrogation_max integer;
  confrontation_used integer;
  can_assembly boolean;
  function_available boolean;
begin
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found or not public.igr_v13_is_core_scenario(r.scenario_id) then return q; end if;

  used:=coalesce(r.state->'event_types_used','[]'::jsonb);
  interrogation_used:=coalesce((r.state->>'event_interrogations')::int,0);
  confrontation_used:=coalesce((r.state->>'confrontations_used')::int,0);
  interrogation_max:=public.igr_v13_interrogation_limit(r.code,3);
  select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
  has_analyst:=public.igr_v13_has_role(r.code,'analyste');
  has_third:=exists(
    select 1 from public.igr_v4_players
    where room_code=r.code and public_role in ('procureur','juge','inspecteur','expert','journaliste')
  );
  can_assembly:=has_analyst and has_third and r.cycle>=2;

  if r.cycle=3 and interrogation_used<interrogation_max then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','interrogation','label','DERNIER INTERROGATOIRE','seconds',480,
      'hint',case when has_analyst then 'Une fenêtre maximum au cycle 3.' else 'Jusqu’à deux fenêtres sans Analyste.' end
    ));
  end if;

  -- Confrontations can repeat with a different pairing. This prevents simple scenarios
  -- from becoming stuck when they have few specialist roles.
  if suspect_count>=2 and confrontation_used<3 then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','confrontation','label','CONFRONTATION','seconds',180,
      'hint','Deux personnes. Trois minutes. La parole reste humaine.'
    ));
  end if;

  if can_assembly and not (used ? 'assembly') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','assembly','label','ASSEMBLÉE','seconds',180,
      'hint',case when r.cycle=3 then 'Cycle 3 : accès restreignable par l’Enquêteur.' else 'Cycle 2 : première mise en commun, sans exclusion.' end
    ));
  end if;

  if public.igr_v13_has_role(r.code,'inspecteur') and not (used ? 'retour_inspecteur') then
    q:=q||jsonb_build_array(jsonb_build_object('key','retour_inspecteur','label','RETOUR INSPECTEUR','seconds',180,'hint','Terrain puis restitution.'));
  end if;
  if public.igr_v13_has_role(r.code,'expert') and not (used ? 'expertise') then
    q:=q||jsonb_build_array(jsonb_build_object('key','expertise','label','EXPERTISE','seconds',180,'hint','Portée technique, jamais verdict.'));
  end if;
  if public.igr_v13_has_role(r.code,'temoin') and not (used ? 'temoin') then
    q:=q||jsonb_build_array(jsonb_build_object('key','temoin','label','TÉMOIN','seconds',240,'hint','Fenêtre globale de quatre minutes.'));
  end if;
  if public.igr_v13_has_role(r.code,'journaliste') and r.cycle>=2 and not (used ? 'enquete_journalistique') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_journalistique','label','ENQUÊTE JOURNALISTIQUE','seconds',180,'hint','Enquêter sur une personne, puis décider quoi en faire.'));
  end if;
  if public.igr_v13_has_role(r.code,'inspecteur') and public.igr_v13_has_role(r.code,'journaliste') and r.cycle>=2 and not (used ? 'enquete_croisee') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_croisee','label','ENQUÊTE CROISÉE','seconds',180,'hint','Inspecteur ↔ Journaliste. Même piste, intérêts différents.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and not (used ? 'procureur') then
    q:=q||jsonb_build_array(jsonb_build_object('key','procureur','label','ENTRETIEN PROCUREUR','seconds',case when r.scenario_id='017' then 360 else 180 end,'hint','Stratégie de poursuite ou entretien ciblé.'));
  end if;
  if public.igr_v13_has_role(r.code,'juge') and not (used ? 'juge') then
    q:=q||jsonb_build_array(jsonb_build_object('key','juge','label','DÉCISION DU JUGE','seconds',180,'hint','Information protégée ou arbitrage.'));
  end if;

  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'procureur') and not (used ? 'negociation') then
    q:=q||jsonb_build_array(jsonb_build_object('key','negociation','label','NÉGOCIATION','seconds',180,'hint','Avocat ↔ Procureur.'));
  end if;
  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'requete') then
    q:=q||jsonb_build_array(jsonb_build_object('key','requete','label','REQUÊTE','seconds',120,'hint','Avocat ↔ Juge.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'saisine') then
    q:=q||jsonb_build_array(jsonb_build_object('key','saisine','label','SAISINE','seconds',120,'hint','Procureur ↔ Juge.'));
  end if;

  return q;
end
$$;

revoke all on function public.igr_v13_event_options(text) from public;
grant execute on function public.igr_v13_event_options(text) to service_role;

create or replace function public.igr_v13_enter_event_select(p_room text,p_slots integer,p_reset boolean default true)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.igr_v4_rooms%rowtype; st jsonb;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;
  st:=coalesce(r.state,'{}'::jsonb);
  if p_reset then
    st:=jsonb_set(st,'{event_slots_total}',to_jsonb(greatest(0,p_slots)),true);
    st:=jsonb_set(st,'{event_slots_used}','0'::jsonb,true);
    st:=jsonb_set(st,'{event_types_used}','[]'::jsonb,true);
    st:=jsonb_set(st,'{event_interrogations}','0'::jsonb,true);
    st:=jsonb_set(st,'{confrontations_used}','0'::jsonb,true);
  end if;
  st:=st-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
  update public.igr_v4_rooms
  set phase='event_select',phase_started_at=now(),phase_ends_at=null,state=st,updated_at=now()
  where code=r.code;
  update public.igr_v4_rooms
  set state=jsonb_set(state,'{event_options}',public.igr_v13_event_options(r.code),true),updated_at=now()
  where code=r.code;
end
$$;

revoke all on function public.igr_v13_enter_event_select(text,integer,boolean) from public;
grant execute on function public.igr_v13_enter_event_select(text,integer,boolean) to service_role;

create or replace function public.igr_v13_complete_event(p_room text,p_event text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  used_count integer;
  total_count integer;
  used_types jsonb;
  history jsonb;
  inter_count integer;
  confront_count integer;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;
  st:=coalesce(r.state,'{}'::jsonb);
  used_count:=coalesce((st->>'event_slots_used')::int,0)+1;
  total_count:=coalesce((st->>'event_slots_total')::int,0);
  used_types:=coalesce(st->'event_types_used','[]'::jsonb);
  history:=coalesce(st->'v13_event_history','[]'::jsonb);
  inter_count:=coalesce((st->>'event_interrogations')::int,0);
  confront_count:=coalesce((st->>'confrontations_used')::int,0);

  if p_event='interrogation' then inter_count:=inter_count+1; end if;
  if p_event='confrontation' then confront_count:=confront_count+1; end if;
  if p_event not in ('interrogation','confrontation') and not (used_types ? p_event) then
    used_types:=used_types||to_jsonb(p_event);
  end if;
  history:=history||jsonb_build_array(jsonb_build_object('cycle',r.cycle,'event',p_event,'ended_at',now()));

  st:=jsonb_set(st,'{event_slots_used}',to_jsonb(used_count),true);
  st:=jsonb_set(st,'{event_types_used}',used_types,true);
  st:=jsonb_set(st,'{event_interrogations}',to_jsonb(inter_count),true);
  st:=jsonb_set(st,'{confrontations_used}',to_jsonb(confront_count),true);
  st:=jsonb_set(st,'{v13_event_history}',history,true);
  st:=st-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';

  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;

  if used_count<total_count then
    perform public.igr_v13_enter_event_select(r.code,total_count,false);
  else
    perform public.igr_v4_emit_trame(r.code);
    update public.igr_v4_rooms
    set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now()
    where code=r.code;
  end if;
end
$$;

revoke all on function public.igr_v13_complete_event(text,text) from public;
grant execute on function public.igr_v13_complete_event(text,text) to service_role;

-- -----------------------------------------------------------------------------
-- 2. Core cycle structure. DLC fallback reproduces the current v12 behaviour.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_start_cycle(p_room text,p_cycle integer)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.igr_v4_rooms%rowtype;
  order_json jsonb;
  st jsonb;
  lim integer;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb)
    into order_json
    from public.igr_v4_players
    where room_code=p_room and public_role='suspect';

    update public.igr_v4_rooms set cycle=p_cycle,phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,
    state=jsonb_set(
            jsonb_set(
             jsonb_set(
              jsonb_set(state,'{heard}','[]'::jsonb,true),
              '{annex_queue}','[]'::jsonb,true),
             '{annex_index}','0'::jsonb,true),
            '{interrogation_order}',order_json,true),
    updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object('title','CYCLE '||p_cycle,'text','Chaque suspect peut être interrogé une fois pendant ce cycle. L’ordre proposé à l’Enquêteur est tiré au sort et ne reflète pas la responsabilité réelle.'));
    return;
  end if;

  select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb)
  into order_json
  from public.igr_v4_players
  where room_code=p_room and public_role='suspect';

  lim:=public.igr_v13_interrogation_limit(r.code,p_cycle);
  st:=coalesce(r.state,'{}'::jsonb);
  st:=jsonb_set(st,'{heard}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_index}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_order}',order_json,true);
  st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true);
  st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true);
  st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';

  update public.igr_v4_rooms set cycle=p_cycle,state=st,updated_at=now() where code=p_room;

  if p_cycle=3 then
    perform public.igr_v13_enter_event_select(p_room,3,true);
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE 3 · RÉSOLUTION',
      'text',case when public.igr_v13_has_role(p_room,'analyste')
        then 'Trois événements. Un interrogatoire de 8 minutes maximum peut en faire partie.'
        else 'Trois événements. Jusqu’à deux interrogatoires de 8 minutes peuvent en faire partie.' end
    ));
  else
    update public.igr_v4_rooms
    set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now()
    where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE '||p_cycle,
      'text',case when p_cycle=1
        then 'Trois convocations de 8 minutes. Établissez les versions.'
        else 'Deux convocations de 8 minutes. Deux événements annexes suivront le débrief.' end
    ));
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 3. Interrogations. Core 001–020 uses rigid 8-minute windows.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_start_interrogation(p_code text,p_player_token uuid,p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  t public.igr_v4_players%rowtype;
  heard jsonb;
  lim integer;
  n integer;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  perform public.igr_v4_tick(r.code);
  select * into r from public.igr_v4_rooms where code=p.room_code for update;

  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    if r.phase<>'interrogation_select' then raise exception 'wrong phase'; end if;
    select * into t from public.igr_v4_players where id=p_target and room_code=r.code and public_role='suspect';
    if not found then raise exception 'invalid target'; end if;
    heard:=coalesce(r.state->'heard','[]'::jsonb);
    if heard ? t.id::text then raise exception 'already heard this cycle'; end if;
    update public.igr_v4_rooms
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '8 minutes',state=jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','INTERROGATOIRE','text',t.pseudo||' entre dans la Grey Room pour 8 minutes.','target_id',t.id,'cycle',r.cycle));
    return jsonb_build_object('ok',true);
  end if;

  if r.phase<>'interrogation_select' then raise exception 'wrong phase'; end if;
  lim:=coalesce((r.state->>'interrogation_limit')::int,public.igr_v13_interrogation_limit(r.code,r.cycle));
  n:=coalesce((r.state->>'interrogation_count')::int,0);
  if n>=lim then raise exception 'interrogation quota reached'; end if;

  select * into t from public.igr_v4_players where id=p_target and room_code=r.code and public_role='suspect';
  if not found then raise exception 'invalid target'; end if;
  heard:=coalesce(r.state->'heard','[]'::jsonb);
  if heard ? t.id::text then raise exception 'already heard this cycle'; end if;

  update public.igr_v4_rooms
  set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '8 minutes',
      state=jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),'{interrogation_mode}',to_jsonb('standard'::text),true),updated_at=now()
  where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',t.pseudo||' est convoqué dans la Grey Room. 08:00.','target_id',t.id,'cycle',r.cycle));
  return jsonb_build_object('ok',true);
end
$$;

create or replace function public.igr_v4_end_interrogation(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.phase<>'interrogation' then raise exception 'wrong phase'; end if;
  if public.igr_v13_is_core_scenario(r.scenario_id) then raise exception 'timer is authoritative'; end if;
  update public.igr_v4_rooms set phase_ends_at=now() where code=r.code;
  perform public.igr_v4_tick(r.code);
  return jsonb_build_object('ok',true);
end
$$;

-- -----------------------------------------------------------------------------
-- 4. Event selection RPC
-- -----------------------------------------------------------------------------
create or replace function public.igr_v13_start_event(
  p_code text,
  p_player_token uuid,
  p_event text,
  p_targets uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  options jsonb;
  opt jsonb;
  secs integer;
  a uuid;
  b uuid;
  participants jsonb:='[]'::jsonb;
  x public.igr_v4_players%rowtype;
  eligible_roles text[]:=array['enqueteur','analyste','procureur','juge','inspecteur','expert','journaliste'];
  target_count integer;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or not public.igr_v13_is_core_scenario(r.scenario_id) then raise exception 'v13 unavailable'; end if;
  if r.phase<>'event_select' then raise exception 'wrong phase'; end if;

  options:=public.igr_v13_event_options(r.code);
  select value into opt from jsonb_array_elements(options) where value->>'key'=p_event limit 1;
  if opt is null then raise exception 'event unavailable'; end if;
  secs:=coalesce((opt->>'seconds')::int,180);

  if p_event='interrogation' then
    if r.cycle<>3 then raise exception 'interrogation event only in cycle 3'; end if;
    if coalesce(array_length(p_targets,1),0)<>1 then raise exception 'one target required'; end if;
    select * into x from public.igr_v4_players where id=p_targets[1] and room_code=r.code and public_role='suspect';
    if not found then raise exception 'invalid target'; end if;
    if coalesce(r.state->'heard','[]'::jsonb) ? x.id::text then raise exception 'already heard this cycle'; end if;
    update public.igr_v4_rooms
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '8 minutes',
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(x.id::text),true),'{interrogation_mode}',to_jsonb('event'::text),true),'{event_active}',to_jsonb('interrogation'::text),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',x.pseudo||' est convoqué dans la Grey Room. 08:00.','target_id',x.id,'cycle',r.cycle,'event_slot',true));
    return jsonb_build_object('ok',true,'phase','interrogation');
  end if;

  if p_event='confrontation' then
    if coalesce(array_length(p_targets,1),0)<>2 or p_targets[1]=p_targets[2] then raise exception 'two distinct targets required'; end if;
    select count(*) into target_count from public.igr_v4_players where room_code=r.code and id=any(p_targets) and public_role in ('suspect','temoin');
    if target_count<>2 then raise exception 'invalid targets'; end if;
    update public.igr_v4_rooms
    set phase='event_confrontation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('confrontation'::text),true),'{event_targets}',to_jsonb(p_targets),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','CONFRONTATION','text','Deux personnes sont convoquées dans la Grey Room. 03:00.'));
    return jsonb_build_object('ok',true,'phase','event_confrontation');
  end if;

  if p_event='assembly' then
    if r.cycle=2 then
      for x in select * from public.igr_v4_players where room_code=r.code and public_role=any(eligible_roles) order by seat_index loop
        participants:=participants||to_jsonb(x.id::text);
      end loop;
    else
      -- Investigator is always present. Analyst, if present, cannot be excluded.
      participants:=participants||to_jsonb(p.id::text);
      for x in select * from public.igr_v4_players where room_code=r.code and public_role='analyste' order by seat_index loop
        if not (participants ? x.id::text) then participants:=participants||to_jsonb(x.id::text); end if;
      end loop;
      if p_targets is not null then
        for x in select * from public.igr_v4_players where room_code=r.code and id=any(p_targets) and public_role=any(eligible_roles) order by seat_index loop
          if not (participants ? x.id::text) then participants:=participants||to_jsonb(x.id::text); end if;
        end loop;
      end if;
    end if;
    update public.igr_v4_rooms
    set phase='event_assembly',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('assembly'::text),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','ASSEMBLÉE','text',case when r.cycle=3 then 'Assemblée restreinte. 03:00.' else 'Première mise en commun. Aucun rôle concerné n’est exclu. 03:00.' end));
    return jsonb_build_object('ok',true,'phase','event_assembly');
  end if;

  -- Existing specialist panels are reused to minimise UI and backend regression.
  if p_event='retour_inspecteur' then
    update public.igr_v4_rooms set phase='annex_inspecteur',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='expertise' then
    update public.igr_v4_rooms set phase='annex_expert',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='temoin' then
    update public.igr_v4_rooms set phase='annex_temoin',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='enquete_journalistique' then
    update public.igr_v4_rooms set phase='annex_journaliste',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='procureur' then
    update public.igr_v4_rooms set phase='annex_procureur',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='juge' then
    update public.igr_v4_rooms set phase='annex_juge',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='enquete_croisee' then
    for x in select * from public.igr_v4_players where room_code=r.code and public_role in ('inspecteur','journaliste') order by seat_index loop participants:=participants||to_jsonb(x.id::text); end loop;
    update public.igr_v4_rooms
    set phase='event_enquete_croisee',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
  elsif p_event in ('negociation','requete','saisine') then
    if p_event='negociation' then
      for x in select * from public.igr_v4_players where room_code=r.code and public_role in ('maitre','procureur') order by seat_index loop participants:=participants||to_jsonb(x.id::text); end loop;
    elsif p_event='requete' then
      for x in select * from public.igr_v4_players where room_code=r.code and public_role in ('maitre','juge') order by seat_index loop participants:=participants||to_jsonb(x.id::text); end loop;
    else
      for x in select * from public.igr_v4_players where room_code=r.code and public_role in ('procureur','juge') order by seat_index loop participants:=participants||to_jsonb(x.id::text); end loop;
    end if;
    update public.igr_v4_rooms
    set phase='event_'||p_event,phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
  else
    raise exception 'unsupported event';
  end if;

  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'phase',jsonb_build_object('title',coalesce(opt->>'label',upper(p_event)),'text','Fenêtre dédiée. Le téléphone organise la scène ; les joueurs la jouent.'));
  return jsonb_build_object('ok',true,'phase',(select phase from public.igr_v4_rooms where code=r.code));
end
$$;

revoke all on function public.igr_v13_start_event(text,uuid,text,uuid[]) from public;
grant execute on function public.igr_v13_start_event(text,uuid,text,uuid[]) to anon,service_role;

-- -----------------------------------------------------------------------------
-- 5. Journalist investigation. Uses only hand-authored canonical leads.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v13_journalist_investigate(
  p_code text,p_player_token uuid,p_target uuid,p_angle text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  t public.igr_v4_players%rowtype;
  pack jsonb;
  lead jsonb;
  slot integer;
  angle text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'journaliste' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not public.igr_v13_is_core_scenario(r.scenario_id) or r.phase not in ('annex_journaliste','event_enquete_croisee') or r.cycle<2 then raise exception 'wrong phase'; end if;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type='journalist_investigation') then raise exception 'already used'; end if;
  select * into t from public.igr_v4_players where id=p_target and room_code=r.code;
  if not found then raise exception 'invalid target'; end if;
  select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
  slot:=t.internal_slot;
  angle:=lower(trim(coalesce(p_angle,'')));

  select x.value into lead
  from jsonb_array_elements(coalesce(pack->'journalist_leads','[]'::jsonb)) x(value)
  where coalesce((x.value->>'min_cycle')::int,2)<=r.cycle
    and (coalesce(x.value->>'angle','')=angle or coalesce(x.value->>'angle','')='any')
    and (
      (t.public_role='suspect' and coalesce((x.value->>'target_slot')::int,-1)=slot)
      or coalesce(x.value->>'target_role','')=t.public_role
    )
  order by random()
  limit 1;

  if lead is null then
    select x.value into lead
    from jsonb_array_elements(coalesce(pack->'journalist_leads','[]'::jsonb)) x(value)
    where coalesce((x.value->>'min_cycle')::int,2)<=r.cycle
      and (
        (t.public_role='suspect' and coalesce((x.value->>'target_slot')::int,-1)=slot)
        or coalesce(x.value->>'target_role','')=t.public_role
      )
    order by random()
    limit 1;
  end if;

  if lead is null then
    lead:=jsonb_build_object('title','AUCUN ÉLÉMENT SUPPLÉMENTAIRE','text','Aucun fait canonique vérifiable supplémentaire n’est disponible sur cet angle.');
  end if;

  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(r.code,p.id,r.cycle,'journalist_investigation',jsonb_build_object('target_id',t.id,'target_role',t.public_role,'angle',angle,'lead',lead));
  return jsonb_build_object('ok',true,'lead',lead);
end
$$;

revoke all on function public.igr_v13_journalist_investigate(text,uuid,uuid,text) from public;
grant execute on function public.igr_v13_journalist_investigate(text,uuid,uuid,text) to anon,service_role;

-- -----------------------------------------------------------------------------
-- 6. Judicial outcome. The talk is human; only the accepted/refused result is stored.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v13_record_judicial_outcome(
  p_code text,p_player_token uuid,p_outcome text,p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; expected text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.phase not in ('event_negociation','event_requete','event_saisine') then raise exception 'wrong phase'; end if;
  if p_outcome not in ('accepted','refused') then raise exception 'invalid outcome'; end if;
  if r.phase='event_negociation' and p.public_role<>'procureur' then raise exception 'forbidden'; end if;
  if r.phase in ('event_requete','event_saisine') and p.public_role<>'juge' then raise exception 'forbidden'; end if;
  expected:='v13_outcome_'||r.phase;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type=expected) then raise exception 'already submitted'; end if;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(r.code,p.id,r.cycle,expected,jsonb_build_object('outcome',p_outcome,'note',left(coalesce(p_note,''),180)));
  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_v13_record_judicial_outcome(text,uuid,text,text) from public;
grant execute on function public.igr_v13_record_judicial_outcome(text,uuid,text,text) to anon,service_role;

-- -----------------------------------------------------------------------------
-- 7. Private cards: two objectives, while keeping all existing canonical fields.
--    Scenario authors may override objective_main/objective_secondary directly in packs.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_build_private_card(p_room text,p_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  base jsonb;
  rel jsonb;
  rels jsonb:='[]'::jsonb;
  q public.igr_v4_players%rowtype;
  widx int;
  role_note jsonb;
  clients jsonb:='[]'::jsonb;
  lrank int;
  lcount int;
  objective_main text;
  objective_secondary text;
begin
  select * into p from public.igr_v4_players where id=p_player_id;
  select * into r from public.igr_v4_rooms where code=p.room_code;
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  if p.public_role='suspect' then
    base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb);
    for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop
      select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int;
      if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if;
    end loop;
    base:=jsonb_set(base,'{relations}',rels,true);
    if public.igr_v13_is_core_scenario(r.scenario_id) then
      objective_main:=coalesce(nullif(base->>'objective_main',''),nullif(base->>'position',''),'Fais reconnaître uniquement ta responsabilité réelle.');
      objective_secondary:=coalesce(nullif(base->>'objective_secondary',''),
        case when nullif(base->>'hide','') is not null then 'Protège cet élément : '||regexp_replace(base->>'hide','^Tu caches[ ]*','',1,1,'i') else 'Préserve ce qui sert ta défense sans inventer de preuve.' end);
      base:=base||jsonb_build_object('objective_main',objective_main,'objective_secondary',objective_secondary);
    end if;
  else
    base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context');
    role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb);
    base:=base||role_note;
    if p.public_role='temoin' then
      select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index;
      base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb);
    elsif p.public_role='maitre' then
      select count(*) into lcount from public.igr_v4_players a where a.room_code=r.code and a.public_role='maitre';
      select count(*) into lrank from public.igr_v4_players a where a.room_code=r.code and a.public_role='maitre' and a.seat_index<=p.seat_index;
      for q in select * from public.igr_v4_players s where s.room_code=r.code and s.public_role='suspect' and (lcount=1 or ((s.internal_slot-1)%lcount)=(lrank-1)) order by s.internal_slot loop clients:=clients||to_jsonb(q.pseudo); end loop;
      base:=base||jsonb_build_object('clients',clients);
    end if;
    if public.igr_v13_is_core_scenario(r.scenario_id) then
      objective_main:=coalesce(nullif(role_note->>'objective_main',''),case p.public_role
        when 'enqueteur' then 'Reconstruis les responsabilités réelles sans suraccuser.'
        when 'analyste' then 'Aide l’Enquêteur à relier les faits et les contradictions.'
        when 'procureur' then 'Soutiens uniquement les responsabilités que le dossier permet d’établir.'
        when 'juge' then 'Rends des décisions cohérentes avec les faits et les protections du dossier.'
        when 'journaliste' then 'Publie des informations exactes qui font progresser la compréhension du dossier.'
        when 'inspecteur' then 'Établis des faits de terrain utiles sans transformer une piste en verdict.'
        when 'expert' then 'Établis la portée exacte des éléments techniques.'
        when 'maitre' then 'Empêche que la responsabilité de tes clients soit surestimée.'
        when 'temoin' then 'Transmets exactement ce que tu sais sans inventer ce que tu n’as pas vu.'
        else 'Remplis ta fonction sans modifier les faits canoniques.' end);
      objective_secondary:=coalesce(nullif(role_note->>'objective_secondary',''),nullif(role_note->>'anchors',''),'Préserve la précision de ton rôle jusqu’au verrouillage final.');
      base:=base||jsonb_build_object('objective_main',objective_main,'objective_secondary',objective_secondary);
    end if;
  end if;
  if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if;
  return base;
end
$$;

-- -----------------------------------------------------------------------------
-- 8. Adaptive MJ answers: record immediately, never shorten the 02:00 debrief.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_submit_debrief(p_code text,p_player_token uuid,p_convergence integer,p_confusion integer,p_axis text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_player public.igr_v4_players%rowtype; v_room public.igr_v4_rooms%rowtype;
begin
  select pp.* into v_player from public.igr_v4_players pp where pp.room_code=upper(trim(p_code)) and pp.player_token=p_player_token;
  if not found or v_player.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
  select rr.* into v_room from public.igr_v4_rooms rr where rr.code=v_player.room_code for update;
  if v_room.phase<>'cycle_debrief' then raise exception 'wrong phase'; end if;
  if exists(select 1 from public.igr_v4_actions a where a.room_code=v_room.code and a.player_id=v_player.id and a.cycle=v_room.cycle and a.action_type='debrief') then raise exception 'already submitted'; end if;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(v_room.code,v_player.id,v_room.cycle,'debrief',jsonb_build_object(
    'convergence',greatest(0,least(2,p_convergence)),
    'confusion',greatest(0,least(2,p_confusion)),
    'axis',left(coalesce(p_axis,''),32)
  ));

  if not public.igr_v13_is_core_scenario(v_room.scenario_id) then
    if not exists(
      select 1 from public.igr_v4_players pp
      where pp.room_code=v_room.code and pp.public_role in ('enqueteur','analyste')
        and not exists(select 1 from public.igr_v4_actions a where a.room_code=v_room.code and a.player_id=pp.id and a.cycle=v_room.cycle and a.action_type='debrief')
    ) then perform public.igr_v4_start_next_annex_or_trame(v_room.code); end if;
  end if;
  return jsonb_build_object('ok',true);
end
$$;

-- Rigid timers for core scenarios: no pause from the host UI or direct RPC.
create or replace function public.igr_v4_timer_toggle(p_code text,p_host_token uuid,p_pause boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.igr_v4_rooms%rowtype; remaining_seconds integer; paused boolean;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if public.igr_v13_is_core_scenario(r.scenario_id) then raise exception 'timer is authoritative'; end if;

  paused:=coalesce((r.state->>'timer_paused')::boolean,false)
          and coalesce(r.state->>'timer_paused_phase','')=r.phase
          and coalesce((r.state->>'timer_paused_started_at')::timestamptz,'epoch'::timestamptz)=r.phase_started_at;
  if p_pause then
    if paused then return jsonb_build_object('ok',true,'paused',true,'remaining_seconds',coalesce((r.state->>'timer_remaining_seconds')::int,0)); end if;
    if r.phase_ends_at is null then raise exception 'no active timer'; end if;
    remaining_seconds:=greatest(1,ceil(extract(epoch from (r.phase_ends_at-now())))::integer);
    update public.igr_v4_rooms set phase_ends_at=null,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{timer_paused}','true'::jsonb,true),'{timer_remaining_seconds}',to_jsonb(remaining_seconds),true),'{timer_paused_phase}',to_jsonb(r.phase),true),'{timer_paused_started_at}',to_jsonb(r.phase_started_at),true),updated_at=now()
    where code=r.code;
    return jsonb_build_object('ok',true,'paused',true,'remaining_seconds',remaining_seconds);
  end if;
  if not paused then
    update public.igr_v4_rooms set state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at') where code=r.code and coalesce((state->>'timer_paused')::boolean,false)=true;
    return jsonb_build_object('ok',true,'paused',false);
  end if;
  remaining_seconds:=greatest(1,coalesce((r.state->>'timer_remaining_seconds')::integer,1));
  update public.igr_v4_rooms set phase_ends_at=now()+make_interval(secs=>remaining_seconds),state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
  return jsonb_build_object('ok',true,'paused',false,'remaining_seconds',remaining_seconds);
end
$$;

-- -----------------------------------------------------------------------------
-- 9. Authoritative server state machine.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_tick(p_room text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.igr_v4_rooms%rowtype;
  heard jsonb;
  target text;
  suspect_count int;
  q jsonb;
  idx int;
  item jsonb;
  next_idx int;
  defq jsonb;
  inter_count int;
  inter_limit int;
  mode text;
  event_name text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found or r.status<>'playing' then return; end if;

  -- ---------------------------------------------------------------------------
  -- Legacy/DLC path: preserve v12.18 behaviour exactly.
  -- ---------------------------------------------------------------------------
  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    if r.phase='cycle_debrief' then
      if r.phase_ends_at is not null then
        update public.igr_v4_rooms set phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
      end if;
      return;
    end if;
    if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;
    if r.phase='briefing' then
      update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'roles_distributed',jsonb_build_object('title','OUVERTURE DU DOSSIER','text','Cartes privées distribuées. Lecture individuelle : 5 minutes.'));
    elsif r.phase='role_reading' then
      update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF INITIAL','text','Enquêteur + Analyste : 3 minutes. Si aucun Analyste n’est présent, l’Enquêteur travaille seul.'));
    elsif r.phase='initial_debrief' then
      perform public.igr_v4_start_cycle(r.code,1);
    elsif r.phase='interrogation' then
      heard:=coalesce(r.state->'heard','[]'::jsonb); target:=r.state->>'current_target';
      if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
      select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
      if jsonb_array_length(heard)>=suspect_count then
        update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=null,state=(jsonb_set(state,'{heard}',heard,true)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','Enquêteur et Analyste répondent chacun librement sur leur téléphone. Le MJ peut passer le débrief manuellement.'));
      else
        update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
      end if;
    elsif r.phase like 'annex_%' then
      perform public.igr_v4_start_next_annex_or_trame(r.code);
    elsif r.phase='trame' then
      if r.cycle<3 then perform public.igr_v4_start_cycle(r.code,r.cycle+1);
      else
        update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Plus aucune trame, expertise, Breaking News ou action de terrain ne peut être déclenchée.'));
      end if;
    elsif r.phase='closed' then
      perform public.igr_v4_start_orals(r.code);
    elsif r.phase='provisional_orals' then
      q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::int,0); next_idx:=idx+1;
      if next_idx<jsonb_array_length(q) then
        item:=q->next_idx;
        update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::int),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
      else
        update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ACCUSATIONS PROVISOIRES','text','L’Enquêteur verrouille maintenant le degré provisoire de responsabilité de chaque suspect.'));
      end if;
    elsif r.phase='defense' then
      defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::int,0); next_idx:=idx+1;
      if next_idx<jsonb_array_length(defq) then
        item:=defq->next_idx;
        update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',state=jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 5 minutes. L’Avocat éventuel partage ce temps.'));
      else
        update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Enquêteur + Analyste, avec Procureur si présent : 3 minutes. Le Juge reste à l’extérieur.'));
      end if;
    elsif r.phase='final_debrief' then
      update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final sur son propre téléphone.'));
    end if;
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- v13 core path 001–020
  -- ---------------------------------------------------------------------------
  if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;

  if r.phase='briefing' then
    update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'roles_distributed',jsonb_build_object('title','OUVERTURE DU DOSSIER','text','Cartes privées distribuées. Lecture individuelle : 5 minutes.'));

  elsif r.phase='role_reading' then
    update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','PRÉ-ENQUÊTE','text','03:00. Enquêteur et Analyste préparent la première convocation. Les Suspects parlent librement en Salle d’attente.'));

  elsif r.phase='initial_debrief' then
    perform public.igr_v4_start_cycle(r.code,1);

  elsif r.phase='interrogation' then
    heard:=coalesce(r.state->'heard','[]'::jsonb);
    target:=r.state->>'current_target';
    if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
    mode:=coalesce(r.state->>'interrogation_mode','standard');

    if mode='event' then
      update public.igr_v4_rooms set state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
      perform public.igr_v13_complete_event(r.code,'interrogation');
    else
      inter_count:=coalesce((r.state->>'interrogation_count')::int,0)+1;
      inter_limit:=coalesce((r.state->>'interrogation_limit')::int,public.igr_v13_interrogation_limit(r.code,r.cycle));
      if inter_count>=inter_limit then
        update public.igr_v4_rooms
        set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',
            state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now()
        where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload)
        values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','02:00. Enquêteur et Analyste répondent séparément aux deux questions du MJ. Le chrono ne se raccourcit pas.'));
      else
        update public.igr_v4_rooms
        set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,
            state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'),updated_at=now()
        where code=r.code;
      end if;
    end if;

  elsif r.phase='cycle_debrief' then
    if r.cycle=1 then
      perform public.igr_v4_emit_trame(r.code);
      update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
    elsif r.cycle=2 then
      perform public.igr_v13_enter_event_select(r.code,2,true);
    else
      perform public.igr_v13_enter_event_select(r.code,3,true);
    end if;

  elsif r.phase in ('event_confrontation','event_assembly','event_negociation','event_requete','event_saisine','event_enquete_croisee') then
    event_name:=coalesce(r.state->>'event_active',replace(r.phase,'event_',''));
    perform public.igr_v13_complete_event(r.code,event_name);

  elsif r.phase like 'annex_%' and coalesce((r.state->>'v13_event_mode')::boolean,false)=true then
    event_name:=coalesce(r.state->>'event_active',replace(r.phase,'annex_',''));
    perform public.igr_v13_complete_event(r.code,event_name);

  elsif r.phase='trame' then
    if r.cycle<3 then
      perform public.igr_v4_start_cycle(r.code,r.cycle+1);
    else
      update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload)
      values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Aucun nouvel élément ne peut être déclenché.'));
    end if;

  elsif r.phase='closed' then
    perform public.igr_v4_start_orals(r.code);

  elsif r.phase='provisional_orals' then
    q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::int,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(q) then
      item:=q->next_idx;
      update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::int),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
    else
      update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ACCUSATIONS PROVISOIRES','text','L’Enquêteur verrouille maintenant le degré provisoire de responsabilité de chaque suspect.'));
    end if;

  elsif r.phase='defense' then
    defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::int,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(defq) then
      item:=defq->next_idx;
      update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',state=jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 5 minutes. L’Avocat éventuel partage ce temps.'));
    else
      update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','03:00. Enquêteur + Analyste, avec Procureur si le dossier le prévoit. Le Juge reste à l’extérieur.'));
    end if;

  elsif r.phase='final_debrief' then
    update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final sur son propre téléphone.'));
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 10. Host advancement: core timed phases cannot be skipped.
-- -----------------------------------------------------------------------------
create or replace function public.igr_v4_advance_phase(p_code text,p_host_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;

  if public.igr_v13_is_core_scenario(r.scenario_id) then
    if r.phase='provisional_lock' then
      update public.igr_v4_rooms
      set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',
          state=jsonb_set((coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),'{provisional}','{}'::jsonb,true),updated_at=now()
      where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload)
      values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','03:00. Dernier échange avant verrouillage.'));
    elsif r.phase='locking' then
      reveal:=public.igr_v4_make_reveal(r.code);
      update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
      perform public.igr_v4_init_continuation(r.code,reveal);
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
    else
      raise exception 'authoritative phase cannot be skipped';
    end if;
    select phase into next_phase from public.igr_v4_rooms where code=r.code;
    return jsonb_build_object('ok',true,'phase',next_phase);
  end if;

  -- Current v12 fallback for DLCs.
  if r.phase='interrogation_select' then
    update public.igr_v4_rooms
    set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=null,
        state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'-'current_target'),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','Passage manuel au débrief. Enquêteur et Analyste répondent indépendamment.'));
  elsif r.phase='cycle_debrief' then
    update public.igr_v4_rooms
    set phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now()
    where code=r.code;
    perform public.igr_v4_start_next_annex_or_trame(r.code);
  elsif r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Passage manuel à l’étape suivante.'));
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
    perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$$;

-- -----------------------------------------------------------------------------
-- 11. Hand-authored journalist leads. They are deliberately incomplete.
--     No objective, secret role or canonical verdict is exposed.
-- -----------------------------------------------------------------------------
update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{journalist_leads}',
'[
 {"target_slot":1,"angle":"interets","min_cycle":2,"title":"FINANCEMENT","text":"Une réunion sur le financement a lieu le jour où la suspension du programme est refusée."},
 {"target_slot":2,"angle":"incoherences","min_cycle":2,"title":"RÉSERVE PUIS SIGNATURE","text":"Le clinicien écrit que la poursuite est dangereuse, puis signe pour continuer."},
 {"target_slot":3,"angle":"passe","min_cycle":2,"title":"DOSSIER MODIFIÉ","text":"Après la mort, une note clinique ne contient plus exactement la même formulation."}
]'::jsonb,true)
where scenario_id='015';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{journalist_leads}',
'[
 {"target_slot":1,"angle":"interets","min_cycle":2,"title":"DISPOSITIF PRÉPARÉ","text":"Le sédatif, la caméra et le lieu ont été organisés avant la séquence filmée."},
 {"target_slot":2,"angle":"incoherences","min_cycle":3,"title":"APRÈS LA COUPURE","text":"Une présence reste seule au dernier étage après le départ d’un autre participant."},
 {"target_slot":3,"angle":"contacts","min_cycle":2,"title":"PAIEMENT DU PRODUIT","text":"Le sédatif est relié à un intermédiaire, pas directement à l’auteur du geste mortel."}
]'::jsonb,true)
where scenario_id='016';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{journalist_leads}',
'[
 {"target_slot":1,"angle":"interets","min_cycle":2,"title":"PRESSION FINANCÉE","text":"Une opération destinée à empêcher la victime de parler a été financée avant le gala."},
 {"target_slot":2,"angle":"contacts","min_cycle":2,"title":"BADGE DE SÉCURITÉ","text":"Un badge de haut niveau ouvre une porte technique pendant la fenêtre critique."},
 {"target_slot":3,"angle":"contacts","min_cycle":2,"title":"TÉMOIN CONTACTÉ","text":"Après la mort, un témoin reçoit un appel lui demandant de ne pas compliquer les choses."}
]'::jsonb,true)
where scenario_id='019';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{journalist_leads}',
'[
 {"target_slot":1,"angle":"passe","min_cycle":2,"title":"EXERCICE ANTÉRIEUR","text":"Un exercice avait déjà révélé un problème d’ouverture simultanée des sorties."},
 {"target_slot":2,"angle":"passe","min_cycle":2,"title":"RÉSERVES OUVERTES","text":"Des réserves techniques sont restées ouvertes avant l’événement."},
 {"target_slot":3,"angle":"incoherences","min_cycle":2,"title":"ALARME RETARDÉE","text":"L’alarme générale suit plusieurs communications hésitantes."},
 {"target_slot":4,"angle":"incoherences","min_cycle":3,"title":"FOYER VOLONTAIRE","text":"Un petit foyer est déclenché volontairement ; les images montrent ensuite une propagation qui surprend son auteur."}
]'::jsonb,true)
where scenario_id='020';

-- -----------------------------------------------------------------------------
-- 12. Permissions for replaced public RPCs are kept explicit.
-- -----------------------------------------------------------------------------
revoke all on function public.igr_v4_start_interrogation(text,uuid,uuid) from public;
revoke all on function public.igr_v4_end_interrogation(text,uuid) from public;
revoke all on function public.igr_v4_submit_debrief(text,uuid,integer,integer,text) from public;
revoke all on function public.igr_v4_timer_toggle(text,uuid,boolean) from public;
revoke all on function public.igr_v4_advance_phase(text,uuid) from public;
grant execute on function public.igr_v4_start_interrogation(text,uuid,uuid) to anon,service_role;
grant execute on function public.igr_v4_end_interrogation(text,uuid) to anon,service_role;
grant execute on function public.igr_v4_submit_debrief(text,uuid,integer,integer,text) to anon,service_role;
grant execute on function public.igr_v4_timer_toggle(text,uuid,boolean) to anon,service_role;
grant execute on function public.igr_v4_advance_phase(text,uuid) to anon,service_role;

-- igr_v4_tick/start_cycle/build_private_card are internal privileged helpers.
revoke all on function public.igr_v4_tick(text) from public;
revoke all on function public.igr_v4_start_cycle(text,integer) from public;
revoke all on function public.igr_v4_build_private_card(text,uuid) from public;
grant execute on function public.igr_v4_tick(text) to service_role;
grant execute on function public.igr_v4_start_cycle(text,integer) to service_role;
grant execute on function public.igr_v4_build_private_card(text,uuid) to service_role;
