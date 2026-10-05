-- Inside Grey Room — timer audit hardening.
-- The v35 duration trigger remains authoritative, but these direct start paths now
-- consume the same duration helpers instead of carrying stale 06:00 / 04:00 literals.

create or replace function public.igr_v13_start_event(
  p_code text,
  p_player_token uuid,
  p_event text,
  p_targets uuid[] default null::uuid[]
)
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
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(x.id::text),true),'{interrogation_mode}',to_jsonb('event'::text),true),'{event_active}',to_jsonb('interrogation'::text),true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',x.pseudo||' est convoqué dans la Grey Room. '||public.igr_v35_seconds_label(secs)||'.','target_id',x.id,'cycle',r.cycle,'event_slot',true));
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
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONFRONTATION','text','Deux personnes sont convoquées dans la Grey Room. '||public.igr_v35_seconds_label(secs)||'.'));
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
    set phase='event_assembly',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('assembly'::text),true),'{event_participants}',participants,true),'{v13_event_mode}','true'::jsonb,true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ASSEMBLÉE','text','Mise en commun. '||public.igr_v35_seconds_label(secs)||'.'));
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

create or replace function public.igr_v4_start_interrogation(
  p_code text,
  p_player_token uuid,
  p_target uuid
)
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
  secs integer;
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
  secs:=coalesce(public.igr_v35_room_seconds(r.code,'interrogation'),360);

  if public.igr_v13_is_core_scenario(r.scenario_id) then
    lim:=coalesce((r.state->>'interrogation_limit')::integer,3);
    n:=coalesce((r.state->>'interrogation_count')::integer,0);
    if n>=lim then raise exception 'interrogation quota reached'; end if;
    update public.igr_v4_rooms
    set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),'{interrogation_mode}',to_jsonb('standard'::text),true),updated_at=now()
    where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'interrogation',jsonb_build_object('title','CONVOCATION','text',t.pseudo||' est convoqué dans la Grey Room. '||public.igr_v35_seconds_label(secs)||'.','target_id',t.id,'cycle',r.cycle));
  else
    update public.igr_v4_rooms set phase='interrogation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(state,'{current_target}',to_jsonb(t.id::text),true),updated_at=now() where code=r.code;
  end if;
  return jsonb_build_object('ok',true);
end
$$;
