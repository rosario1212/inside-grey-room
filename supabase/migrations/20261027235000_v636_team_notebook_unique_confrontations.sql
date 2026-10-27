-- v636: one shared investigation notebook, no same-pair confrontation twice in a cycle.
-- Existing token+role checks remain mandatory and note rows remain RLS protected.
CREATE OR REPLACE FUNCTION public.igr_v87_dossier_notes(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor public.igr_v4_players%rowtype;
begin
 select * into actor from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or actor.public_role not in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then raise exception 'forbidden';end if;
 perform igr_private.rate_limit('v87_read',p_player_token::text,120,60);
 return jsonb_build_object('notes',(
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'suspect_id',n.suspect_id,
  'kind',n.kind,'text',n.content,'author',coalesce(author.pseudo,'Enquête'),'created_at',n.created_at) order by n.id),'[]'::jsonb)
 from public.igr_v87_investigator_notes n left join public.igr_v4_players author on author.id=n.author_id and author.room_code=n.room_code where n.room_code=actor.room_code));
end$function$


CREATE OR REPLACE FUNCTION public.igr_v87_add_dossier_note(p_code text, p_player_token uuid, p_suspect_id uuid, p_kind text, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor public.igr_v4_players%rowtype; clean_text text:=trim(coalesce(p_text,'')); note_id bigint;
begin
 select * into actor from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or actor.public_role not in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then raise exception 'forbidden';end if;
 if not exists(select 1 from public.igr_v4_rooms r where r.code=actor.room_code and r.status='playing')
 then raise exception 'inactive room';end if;
 if p_kind not in ('declaration','hypothese','question') or char_length(clean_text) not between 1 and 800
 then raise exception 'invalid note';end if;
 if p_suspect_id is not null and not exists(select 1 from public.igr_v4_players p
  where p.id=p_suspect_id and p.room_code=actor.room_code and p.public_role='suspect')
 then raise exception 'invalid suspect';end if;
 perform igr_private.rate_limit('v87_note',p_player_token::text,20,60);
 if (select count(*) from public.igr_v87_investigator_notes n
    where n.room_code=actor.room_code and n.author_id=actor.id)>=100
 then raise exception 'note limit';end if;
 insert into public.igr_v87_investigator_notes(room_code,author_id,suspect_id,kind,content)
 values(actor.room_code,actor.id,p_suspect_id,p_kind,clean_text) returning id into note_id;
 return jsonb_build_object('ok',true,'id',note_id);
end$function$


CREATE OR REPLACE FUNCTION public.igr_v13_start_event(p_code text, p_player_token uuid, p_event text, p_targets uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    -- Pair order is irrelevant. Track a room-specific match and cycle.
    if exists (
      select 1 from pg_catalog.jsonb_array_elements(coalesce(r.state->'confrontation_pairs_v636','[]'::jsonb)) as entry
      where entry->>'pair' = least(p_targets[1]::text,p_targets[2]::text)||':'||greatest(p_targets[1]::text,p_targets[2]::text)
        and (entry->>'cycle')::integer=r.cycle
        and coalesce((entry->>'match')::integer,1)=coalesce((r.state->>'match_no')::integer,1)
    ) then raise exception 'Ces deux joueurs ont deja ete confrontes durant ce cycle'; end if;
    update public.igr_v4_rooms
    set phase='event_confrontation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('confrontation'::text),true),'{event_targets}',to_jsonb(p_targets),true),'{v13_event_mode}','true'::jsonb,true),'{confrontation_pairs_v636}',
          coalesce(state->'confrontation_pairs_v636','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
            'cycle',cycle,
            'match',coalesce((state->>'match_no')::integer,1),
            'pair',least(p_targets[1]::text,p_targets[2]::text)||':'||greatest(p_targets[1]::text,p_targets[2]::text)
          )),true),updated_at=now()
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
$function$

