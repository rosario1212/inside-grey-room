-- Inside Grey Room — directed cycles v34
-- 001–034: C1 = 3 interrogations x 6 min; C2 = 3 actions (max 2 interrogations);
-- C3 = 3 actions (max 1 interrogation). Debriefs 2 min, defenses 3 min,
-- confrontations 4 min, assemblies 4 min.

create or replace function public.igr_v13_is_core_scenario(p_scenario text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_scenario,'') between '001' and '034';
$$;

create or replace function public.igr_v13_has_role(p_room text,p_role text)
returns boolean
language sql
stable
security definer
set search_path to ''
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
set search_path to ''
as $$
begin
  if p_cycle=1 then return 3; end if;
  if p_cycle=2 then return 2; end if;
  if p_cycle=3 then return 1; end if;
  return 0;
end
$$;

revoke all on function public.igr_v13_is_core_scenario(text) from public, anon, authenticated;
revoke all on function public.igr_v13_has_role(text,text) from public, anon, authenticated;
revoke all on function public.igr_v13_interrogation_limit(text,integer) from public, anon, authenticated;
grant execute on function public.igr_v13_is_core_scenario(text) to service_role;
grant execute on function public.igr_v13_has_role(text,text) to service_role;
grant execute on function public.igr_v13_interrogation_limit(text,integer) to service_role;

create or replace function public.igr_v13_event_options(p_room text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  q jsonb:='[]'::jsonb;
  used jsonb;
  suspect_count integer;
  inter_used integer;
  inter_max integer;
  confront_used integer;
  has_analyst boolean;
  has_third boolean;
begin
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found or not public.igr_v13_is_core_scenario(r.scenario_id) or r.cycle not in (2,3) then return q; end if;

  used:=coalesce(r.state->'event_types_used','[]'::jsonb);
  inter_used:=coalesce((r.state->>'event_interrogations')::integer,0);
  confront_used:=coalesce((r.state->>'confrontations_used')::integer,0);
  inter_max:=public.igr_v13_interrogation_limit(r.code,r.cycle);
  select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
  has_analyst:=public.igr_v13_has_role(r.code,'analyste');
  has_third:=exists(select 1 from public.igr_v4_players where room_code=r.code and public_role in ('procureur','juge','inspecteur','expert','journaliste'));

  if inter_used<inter_max then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','interrogation','label','INTERROGATOIRE','seconds',360,
      'hint',case when r.cycle=2 then 'Six minutes. Deux interrogatoires maximum dans ce cycle.' else 'Six minutes. Un seul interrogatoire maximum dans ce cycle.' end
    ));
  end if;

  if suspect_count>=2 and confront_used<3 then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','confrontation','label','CONFRONTATION','seconds',240,
      'hint','Deux personnes. Quatre minutes. Les versions sont mises face à face.'
    ));
  end if;

  if has_analyst and has_third and not (used ? 'assembly') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','assembly','label','ASSEMBLÉE','seconds',240,
      'hint','Quatre minutes de mise en commun. Au cycle 3, l’Enquêteur peut restreindre les participants.'
    ));
  end if;

  if not (used ? 'analyse_dossier') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','analyse_dossier','label','ANALYSE DU DOSSIER','seconds',240,
      'hint','Quatre minutes pour relier la chronologie, les contradictions et les priorités.'
    ));
  end if;

  if r.scenario_id between '021' and '034' and not (used ? 'signature') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','signature',
      'label',case
        when r.scenario_id between '021' and '025' then 'EXPLOITER LA FAMIGLIA'
        when r.scenario_id between '026' and '028' then 'CELLULE DE CRISE'
        when r.scenario_id between '029' and '031' then 'PRESSION DU RÉSEAU'
        else 'CARTE DU POUVOIR'
      end,
      'seconds',240,
      'hint','Utiliser la mécanique propre au DLC. Ce choix consomme une action du cycle.'
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
  if public.igr_v13_has_role(r.code,'journaliste') and not (used ? 'enquete_journalistique') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_journalistique','label','ENQUÊTE JOURNALISTIQUE','seconds',180,'hint','Enquêter sur une personne puis décider quoi en faire.'));
  end if;
  if public.igr_v13_has_role(r.code,'inspecteur') and public.igr_v13_has_role(r.code,'journaliste') and not (used ? 'enquete_croisee') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_croisee','label','ENQUÊTE CROISÉE','seconds',180,'hint','Même piste, intérêts différents.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and not (used ? 'procureur') then
    q:=q||jsonb_build_array(jsonb_build_object('key','procureur','label','ENTRETIEN PROCUREUR','seconds',180,'hint','Stratégie de poursuite ou entretien ciblé.'));
  end if;
  if public.igr_v13_has_role(r.code,'juge') and not (used ? 'juge') then
    q:=q||jsonb_build_array(jsonb_build_object('key','juge','label','DÉCISION DU JUGE','seconds',180,'hint','Information protégée ou arbitrage.'));
  end if;
  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'procureur') and not (used ? 'negociation') then
    q:=q||jsonb_build_array(jsonb_build_object('key','negociation','label','NÉGOCIATION','seconds',180,'hint','Avocat et Procureur.'));
  end if;
  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'requete') then
    q:=q||jsonb_build_array(jsonb_build_object('key','requete','label','REQUÊTE','seconds',120,'hint','Avocat et Juge.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'saisine') then
    q:=q||jsonb_build_array(jsonb_build_object('key','saisine','label','SAISINE','seconds',120,'hint','Procureur et Juge.'));
  end if;

  return q;
end
$$;

revoke all on function public.igr_v13_event_options(text) from public, anon, authenticated;
grant execute on function public.igr_v13_event_options(text) to service_role;

create or replace function public.igr_v13_enter_event_select(p_room text,p_slots integer,p_reset boolean default true)
returns void
language plpgsql
security definer
set search_path to ''
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
  st:=st-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode'-'defense_current_id'-'defense_current_pseudo';
  update public.igr_v4_rooms
  set phase='event_select',phase_started_at=now(),phase_ends_at=null,state=st,updated_at=now()
  where code=r.code;
  update public.igr_v4_rooms
  set state=jsonb_set(state,'{event_options}',public.igr_v13_event_options(r.code),true),updated_at=now()
  where code=r.code;
end
$$;

revoke all on function public.igr_v13_enter_event_select(text,integer,boolean) from public, anon, authenticated;
grant execute on function public.igr_v13_enter_event_select(text,integer,boolean) to service_role;

create or replace function public.igr_v13_complete_event(p_room text,p_event text)
returns void
language plpgsql
security definer
set search_path to ''
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
  used_count:=coalesce((st->>'event_slots_used')::integer,0)+1;
  total_count:=coalesce((st->>'event_slots_total')::integer,0);
  used_types:=coalesce(st->'event_types_used','[]'::jsonb);
  history:=coalesce(st->'v13_event_history','[]'::jsonb);
  inter_count:=coalesce((st->>'event_interrogations')::integer,0);
  confront_count:=coalesce((st->>'confrontations_used')::integer,0);

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
  elsif r.cycle<3 then
    update public.igr_v4_rooms
    set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','02:00. Enquêteur et Analyste répondent séparément. Le chrono reste entier.'));
  else
    perform public.igr_v4_emit_trame(r.code);
    update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
  end if;
end
$$;

revoke all on function public.igr_v13_complete_event(text,text) from public, anon, authenticated;
grant execute on function public.igr_v13_complete_event(text,text) to service_role;

create or replace function public.igr_v4_start_cycle(p_room text,p_cycle integer)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  order_json jsonb;
  st jsonb;
  suspect_count integer;
  lim integer;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb),count(*)
  into order_json,suspect_count
  from public.igr_v4_players where room_code=p_room and public_role='suspect';

  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    update public.igr_v4_rooms set cycle=p_cycle,phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{heard}','[]'::jsonb,true),'{annex_queue}','[]'::jsonb,true),'{annex_index}','0'::jsonb,true),'{interrogation_order}',order_json,true),updated_at=now()
    where code=p_room;
    return;
  end if;

  lim:=least(public.igr_v13_interrogation_limit(r.code,p_cycle),suspect_count);
  st:=coalesce(r.state,'{}'::jsonb);
  st:=jsonb_set(st,'{heard}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_index}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_order}',order_json,true);
  st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true);
  st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true);
  st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
  update public.igr_v4_rooms set cycle=p_cycle,state=st,updated_at=now() where code=p_room;

  if p_cycle=1 then
    update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object('title','CYCLE 1 · PREMIÈRES VERSIONS','text','Trois interrogatoires de 06:00 maximum. L’Enquêteur choisit l’ordre.'));
  else
    perform public.igr_v13_enter_event_select(p_room,3,true);
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE '||p_cycle||case when p_cycle=3 then ' · RÉSOLUTION' else ' · DIRECTION' end,
      'text',case when p_cycle=2 then 'Trois actions au choix. Maximum deux interrogatoires de 06:00.' else 'Trois actions au choix. Maximum un interrogatoire de 06:00.' end
    ));
  end if;
end
$$;

create or replace function public.igr_v4_start_interrogation(p_code text,p_player_token uuid,p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
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
  else
    if r.cycle<>1 or r.phase<>'interrogation_select' then raise exception 'wrong phase'; end if;
  end if;

  select * into t from public.igr_v4_players where id=p_target and room_code=r.code and public_role='suspect';
  if not found then raise exception 'invalid target'; end if;
  heard:=coalesce(r.state->'heard','[]'::jsonb);
  if heard ? t.id::text then raise exception 'already heard this cycle'; end if;

  if public.igr_v13_is_core_scenario(r.scenario_id) then
    lim:=coalesce((r.state->>'interrogation_limit')::integer,3);
    n:=coalesce((r.state->>'interrogation_count')::integer,0);
    if n>=lim then raise exception 'interrogation quota reached'; end if;
    update public.igr_v4_rooms
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '6 minutes',
        state=jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),'{interrogation_mode}',to_jsonb('standard'::text),true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',t.pseudo||' est convoqué dans la Grey Room. 06:00.','target_id',t.id,'cycle',r.cycle));
  else
    update public.igr_v4_rooms set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '6 minutes',state=jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),updated_at=now() where code=r.code;
  end if;
  return jsonb_build_object('ok',true);
end
$$;

create or replace function public.igr_v4_end_interrogation(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
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

create or replace function public.igr_v13_start_event(p_code text,p_player_token uuid,p_event text,p_targets uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  x public.igr_v4_players%rowtype;
  opt jsonb;
  secs integer;
  participants jsonb:='[]'::jsonb;
  target_count integer;
  eligible_roles text[]:=array['enqueteur','analyste','procureur','juge','inspecteur','expert','journaliste'];
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or not public.igr_v13_is_core_scenario(r.scenario_id) or r.phase<>'event_select' then raise exception 'wrong phase'; end if;

  select value into opt from jsonb_array_elements(public.igr_v13_event_options(r.code)) where value->>'key'=p_event limit 1;
  if opt is null then raise exception 'event unavailable'; end if;
  secs:=coalesce((opt->>'seconds')::integer,240);

  if p_event='interrogation' then
    if coalesce(array_length(p_targets,1),0)<>1 then raise exception 'one target required'; end if;
    select * into x from public.igr_v4_players where id=p_targets[1] and room_code=r.code and public_role='suspect';
    if not found then raise exception 'invalid target'; end if;
    if coalesce(r.state->'heard','[]'::jsonb) ? x.id::text then raise exception 'already heard this cycle'; end if;
    update public.igr_v4_rooms
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+interval '6 minutes',
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(x.id::text),true),'{interrogation_mode}',to_jsonb('event'::text),true),'{event_active}',to_jsonb('interrogation'::text),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',x.pseudo||' est convoqué dans la Grey Room. 06:00.','target_id',x.id,'cycle',r.cycle,'event_slot',true));
    return jsonb_build_object('ok',true,'phase','interrogation');
  end if;

  if p_event='confrontation' then
    if coalesce(array_length(p_targets,1),0)<>2 or p_targets[1]=p_targets[2] then raise exception 'two distinct targets required'; end if;
    select count(*) into target_count from public.igr_v4_players where room_code=r.code and id=any(p_targets) and public_role in ('suspect','temoin');
    if target_count<>2 then raise exception 'invalid targets'; end if;
    update public.igr_v4_rooms
    set phase='event_confrontation',phase_started_at=now(),phase_ends_at=now()+interval '4 minutes',
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('confrontation'::text),true),'{event_targets}',to_jsonb(p_targets),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONFRONTATION','text','Deux personnes sont convoquées dans la Grey Room. 04:00.'));
    return jsonb_build_object('ok',true,'phase','event_confrontation');
  end if;

  if p_event='assembly' then
    participants:=participants||to_jsonb(p.id::text);
    for x in select * from public.igr_v4_players where room_code=r.code and public_role='analyste' order by seat_index loop
      if not (participants ? x.id::text) then participants:=participants||to_jsonb(x.id::text); end if;
    end loop;
    if r.cycle=2 then
      for x in select * from public.igr_v4_players where room_code=r.code and public_role=any(eligible_roles) order by seat_index loop
        if not (participants ? x.id::text) then participants:=participants||to_jsonb(x.id::text); end if;
      end loop;
    elsif p_targets is not null then
      for x in select * from public.igr_v4_players where room_code=r.code and id=any(p_targets) and public_role=any(eligible_roles) order by seat_index loop
        if not (participants ? x.id::text) then participants:=participants||to_jsonb(x.id::text); end if;
      end loop;
    end if;
    update public.igr_v4_rooms
    set phase='event_assembly',phase_started_at=now(),phase_ends_at=now()+interval '4 minutes',
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('assembly'::text),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ASSEMBLÉE','text','Mise en commun. 04:00.'));
    return jsonb_build_object('ok',true,'phase','event_assembly');
  end if;

  if p_event in ('analyse_dossier','signature') then
    participants:=participants||to_jsonb(p.id::text);
    for x in select * from public.igr_v4_players where room_code=r.code and public_role='analyste' order by seat_index loop
      participants:=participants||to_jsonb(x.id::text);
    end loop;
    update public.igr_v4_rooms
    set phase=case when p_event='signature' then 'event_signature' else 'event_analysis' end,
        phase_started_at=now(),phase_ends_at=now()+interval '4 minutes',
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title',opt->>'label','text','Fenêtre choisie par l’Enquêteur. 04:00.'));
    return jsonb_build_object('ok',true,'phase',case when p_event='signature' then 'event_signature' else 'event_analysis' end);
  end if;

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
  elsif p_event='negociation' then
    update public.igr_v4_rooms set phase='event_negociation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='requete' then
    update public.igr_v4_rooms set phase='event_requete',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='saisine' then
    update public.igr_v4_rooms set phase='event_saisine',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_event='enquete_croisee' then
    update public.igr_v4_rooms set phase='event_enquete_croisee',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(jsonb_set(state,'{event_active}',to_jsonb(p_event),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now() where code=r.code;
  else
    raise exception 'event unavailable';
  end if;
  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_v13_start_event(text,uuid,text,uuid[]) from public;
grant execute on function public.igr_v13_start_event(text,uuid,text,uuid[]) to anon, authenticated, service_role;

create or replace function public.igr_v4_submit_debrief(p_code text,p_player_token uuid,p_convergence integer,p_confusion integer,p_axis text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_player public.igr_v4_players%rowtype; v_room public.igr_v4_rooms%rowtype;
begin
  select * into v_player from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or v_player.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
  select * into v_room from public.igr_v4_rooms where code=v_player.room_code for update;
  if v_room.phase<>'cycle_debrief' then raise exception 'wrong phase'; end if;
  if exists(select 1 from public.igr_v4_actions where room_code=v_room.code and player_id=v_player.id and cycle=v_room.cycle and action_type='debrief') then raise exception 'already submitted'; end if;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(v_room.code,v_player.id,v_room.cycle,'debrief',jsonb_build_object('convergence',greatest(0,least(2,p_convergence)),'confusion',greatest(0,least(2,p_confusion)),'axis',left(coalesce(p_axis,''),32)));
  -- The 02:00 debrief is authoritative; submissions never shorten it.
  return jsonb_build_object('ok',true);
end
$$;

create or replace function public.igr_v4_set_provisional(p_code text,p_player_token uuid,p_levels jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; s public.igr_v4_players%rowtype; level integer; q jsonb:='[]'::jsonb; first jsonb;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.phase<>'provisional_lock' then raise exception 'wrong phase'; end if;
  for s in select * from public.igr_v4_players where room_code=r.code and public_role='suspect' order by seat_index loop
    if not (p_levels ? s.id::text) then raise exception 'missing suspect'; end if;
    level:=greatest(0,least(3,(p_levels->>s.id::text)::integer));
    if level>=2 then q:=q||jsonb_build_array(jsonb_build_object('id',s.id,'pseudo',s.pseudo,'level',level)); end if;
  end loop;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'provisional',p_levels);
  update public.igr_v4_rooms set state=jsonb_set(jsonb_set(jsonb_set(state,'{provisional}',p_levels,true),'{defense_queue}',q,true),'{defense_index}','0'::jsonb,true),updated_at=now() where code=r.code;
  if jsonb_array_length(q)>0 then
    first:=q->0;
    update public.igr_v4_rooms
    set phase='defense',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',
        state=jsonb_set(jsonb_set(state,'{defense_current_id}',to_jsonb(first->>'id'),true),'{defense_current_pseudo}',to_jsonb(first->>'pseudo'),true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(first->>'pseudo')||' dispose de 03:00. L’Avocat éventuel partage ce temps.','target_id',first->>'id'));
  else
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','AUCUNE ACCUSATION FORMELLE','text','Passage au dernier débrief : 02:00.'));
  end if;
  return jsonb_build_object('ok',true,'accused',jsonb_array_length(q));
end
$$;

create or replace function public.igr_v4_tick(p_room text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  heard jsonb;
  target text;
  q jsonb;
  idx integer;
  item jsonb;
  next_idx integer;
  defq jsonb;
  inter_count integer;
  inter_limit integer;
  active_event text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found or r.status<>'playing' then return; end if;
  if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;

  if r.phase='briefing' then
    update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
  elsif r.phase='role_reading' then
    update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF INITIAL','text','Enquêteur + Analyste : 02:00.'));
  elsif r.phase='initial_debrief' then
    perform public.igr_v4_start_cycle(r.code,1);

  elsif r.phase='interrogation' then
    heard:=coalesce(r.state->'heard','[]'::jsonb);
    target:=r.state->>'current_target';
    if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
    if coalesce((r.state->>'v13_event_mode')::boolean,false) then
      update public.igr_v4_rooms set state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
      perform public.igr_v13_complete_event(r.code,'interrogation');
    elsif public.igr_v13_is_core_scenario(r.scenario_id) then
      inter_count:=coalesce((r.state->>'interrogation_count')::integer,0)+1;
      inter_limit:=coalesce((r.state->>'interrogation_limit')::integer,3);
      if inter_count>=inter_limit then
        update public.igr_v4_rooms
        set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',
            state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'),updated_at=now()
        where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','02:00. Enquêteur et Analyste répondent séparément.'));
      else
        update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'),updated_at=now() where code=r.code;
      end if;
    else
      update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
    end if;

  elsif r.phase='cycle_debrief' then
    perform public.igr_v4_emit_trame(r.code);
    update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;

  elsif r.phase in ('event_confrontation','event_assembly','event_analysis','event_signature','event_negociation','event_requete','event_saisine','event_enquete_croisee') then
    active_event:=coalesce(r.state->>'event_active',case r.phase when 'event_confrontation' then 'confrontation' when 'event_assembly' then 'assembly' when 'event_analysis' then 'analyse_dossier' when 'event_signature' then 'signature' else replace(r.phase,'event_','') end);
    perform public.igr_v13_complete_event(r.code,active_event);

  elsif r.phase like 'annex_%' then
    if coalesce((r.state->>'v13_event_mode')::boolean,false) then
      perform public.igr_v13_complete_event(r.code,coalesce(r.state->>'event_active',replace(r.phase,'annex_','')));
    else
      perform public.igr_v4_start_next_annex_or_trame(r.code);
    end if;

  elsif r.phase='trame' then
    if r.cycle<3 then perform public.igr_v4_start_cycle(r.code,r.cycle+1);
    else
      update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Plus aucune action d’enquête ne peut être ouverte.'));
    end if;
  elsif r.phase='closed' then
    perform public.igr_v4_start_orals(r.code);
  elsif r.phase='provisional_orals' then
    q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::integer,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(q) then
      item:=q->next_idx;
      update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::integer),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
    else
      update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    end if;
  elsif r.phase='defense' then
    defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::integer,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(defq) then
      item:=defq->next_idx;
      update public.igr_v4_rooms
      set phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',
          state=jsonb_set(jsonb_set(jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),'{defense_current_id}',to_jsonb(item->>'id'),true),'{defense_current_pseudo}',to_jsonb(item->>'pseudo'),true),updated_at=now()
      where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 03:00. L’Avocat éventuel partage ce temps.','target_id',item->>'id'));
    else
      update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=(state-'defense_current_id'-'defense_current_pseudo'),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Enquêteur + Analyste, avec Procureur si présent : 02:00.'));
    end if;
  elsif r.phase='final_debrief' then
    update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final.'));
  end if;
end
$$;

create or replace function public.igr_v4_advance_phase(p_code text,p_host_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;

  if r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'defense_current_id'-'defense_current_pseudo'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  elsif r.phase in ('event_select','interrogation_select') then
    raise exception 'choice required';
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',updated_at=now() where code=r.code;
    perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$$;
