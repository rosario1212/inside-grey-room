-- Lawyer conduct v20261106: one private 60s pause, then attendance
-- for the remainder of the existing 6-minute interrogation.
-- Non-clients: one call per game; official clients: one per interrogation/cycle.
-- Official Lawyers are also seated in confrontations involving their client.
-- All durations are authoritative server state, with no extra 90s added.
CREATE OR REPLACE FUNCTION public.igr_v44_request_lawyer_consultation(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 me public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 l public.igr_v4_players%rowtype;
 oldc public.igr_v44_lawyer_consultations%rowtype;
 remain integer;
 official boolean:=false;
BEGIN
 SELECT * INTO me FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR me.public_role<>'suspect' THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=me.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.phase<>'interrogation'
   OR r.state->>'current_target' IS DISTINCT FROM me.id::text
 THEN RAISE EXCEPTION 'consultation only during your interrogation'; END IF;
 IF r.phase_ends_at IS NULL OR r.phase_ends_at<=now()
   OR coalesce((r.state->>'timer_paused')::boolean,false)
 THEN RAISE EXCEPTION 'interrogation timer unavailable'; END IF;
 SELECT lp.* INTO l FROM public.igr_v43_lawyer_representations rep
 JOIN public.igr_v4_players lp ON lp.id=rep.lawyer_id
 WHERE rep.room_code=r.code AND rep.client_id=me.id AND lp.public_role='maitre' LIMIT 1;
 official:=FOUND;
 SELECT * INTO oldc FROM public.igr_v44_lawyer_consultations
 WHERE room_code=r.code AND suspect_id=me.id FOR UPDATE;
 IF FOUND AND (NOT official OR oldc.cycle=r.cycle) THEN
   RAISE EXCEPTION 'consultation already used';
 END IF;
 IF NOT official THEN
   SELECT * INTO l FROM public.igr_v4_players x
   WHERE x.room_code=r.code AND x.public_role='maitre'
     AND public.igr_v44_player_is_free(r.code,x.id)
   ORDER BY x.seat_index LIMIT 1;
 END IF;
 IF l.id IS NULL THEN RAISE EXCEPTION 'lawyer unavailable'; END IF;
 remain:=greatest(1,ceil(extract(epoch from (r.phase_ends_at-now())))::integer);
 IF oldc.room_code IS NOT NULL THEN
   UPDATE public.igr_v44_lawyer_consultations
   SET lawyer_id=l.id,cycle=r.cycle,status='pending',remaining_seconds=remain,
       requested_at=now(),started_at=null,ends_at=now()+interval '45 seconds',ended_at=null
   WHERE room_code=r.code AND suspect_id=me.id;
 ELSE
   INSERT INTO public.igr_v44_lawyer_consultations
     (room_code,suspect_id,lawyer_id,cycle,remaining_seconds,ends_at)
   VALUES(r.code,me.id,l.id,r.cycle,remain,now()+interval '45 seconds');
 END IF;
 UPDATE public.igr_v4_rooms
 SET phase_ends_at=null,
 state=jsonb_set(jsonb_set(
      jsonb_set((coalesce(state,'{}'::jsonb)-'video_session'-'video_started_at'),
        '{video_active}','false'::jsonb,true),
      '{lawyer_consultation_suspect}',to_jsonb(me.id::text),true),
      '{lawyer_consultation_remaining}',to_jsonb(remain),true),
 updated_at=now() WHERE code=r.code;
 -- A confidential side conversation cannot be observed through the room feed.
 DELETE FROM public.igr_v4_signals WHERE room_code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
 VALUES(r.code,'lawyer_consultation','private',l.id,
 jsonb_build_object('title','CONSULTATION PRIVÉE · 01:00',
 'text',me.pseudo||' vous demande une consultation pendant son interrogatoire. Vous avez 45 secondes pour répondre.',
 'cycle',r.cycle,'consultation_seconds',60,'assistance','remainder_of_interrogation'));
 RETURN jsonb_build_object('ok',true,'lawyer_id',l.id,'lawyer_pseudo',l.pseudo,
 'remaining_seconds',remain,'seconds',60,'response_window_seconds',45,
 'consultation_scope',case when official then 'per_cycle' else 'once_per_game' end,
 'cycle',r.cycle);
END
$function$;

CREATE OR REPLACE FUNCTION public.igr_v44_start_lawyer_consultation(p_code text, p_player_token uuid, p_suspect uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; c public.igr_v44_lawyer_consultations%rowtype;
begin select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'maitre' then raise exception 'forbidden'; end if; select * into c from public.igr_v44_lawyer_consultations where room_code=me.room_code and suspect_id=p_suspect and lawyer_id=me.id for update; if not found or c.status<>'pending' or c.ends_at<=now() then raise exception 'consultation unavailable'; end if; update public.igr_v44_lawyer_consultations set status='active',started_at=now(),ends_at=now()+interval '60 seconds' where room_code=c.room_code and suspect_id=c.suspect_id; return jsonb_build_object('ok',true,'status','active','seconds',60); end $function$;

CREATE OR REPLACE FUNCTION public.igr_v4_video_set(p_code text, p_player_token uuid, p_active boolean, p_confidential_cut boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  cut_until timestamptz;
  newstate jsonb;
  session_id text;
begin
  perform igr_private.rate_limit('video_set',p_player_token::text,30,60);

  select * into p
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'enqueteur' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or r.status<>'playing' then raise exception 'closed'; end if;
  if r.phase<>'interrogation' then raise exception 'video only during interrogation'; end if;

  newstate:=coalesce(r.state,'{}'::jsonb);
  -- Neither the public feed nor the Enquêteur may reactivate video while the
  -- Lawyer and suspect are away during the one-minute private pause.
  if p_active and newstate ? 'lawyer_consultation_suspect' then
    raise exception 'camera blocked during confidential lawyer minute';
  end if;

  if p_confidential_cut then
    if coalesce((newstate->>'video_active')::boolean,false)=false then
      raise exception 'video inactive';
    end if;
    if exists(
      select 1 from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type='video_cut'
    ) then raise exception 'cycle limit'; end if;

    cut_until:=least(
      now()+interval '60 seconds',
      coalesce(r.phase_ends_at,now()+interval '60 seconds')
    );
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(r.code,p.id,r.cycle,'video_cut','{}');

    newstate:=newstate-'video_session'-'video_started_at';
    newstate:=jsonb_set(newstate,'{video_active}','false'::jsonb,true);
    newstate:=jsonb_set(newstate,'{video_cut_until}',to_jsonb(cut_until::text),true);
    delete from public.igr_v4_signals where room_code=r.code;

  elsif p_active then
    session_id:=gen_random_uuid()::text;
    newstate:=newstate-'video_session'-'video_started_at';
    newstate:=jsonb_set(newstate,'{video_active}','true'::jsonb,true);
    newstate:=jsonb_set(newstate,'{video_cut_until}','null'::jsonb,true);
    newstate:=jsonb_set(newstate,'{video_session}',to_jsonb(session_id),true);
    newstate:=jsonb_set(newstate,'{video_started_at}',to_jsonb(now()::text),true);
    delete from public.igr_v4_signals where room_code=r.code;

  else
    newstate:=newstate-'video_session'-'video_started_at';
    newstate:=jsonb_set(newstate,'{video_active}','false'::jsonb,true);
    newstate:=jsonb_set(newstate,'{video_cut_until}','null'::jsonb,true);
    delete from public.igr_v4_signals where room_code=r.code;
  end if;

  update public.igr_v4_rooms
  set state=newstate,updated_at=now()
  where code=r.code;

  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
  values(
    r.code,'video','roles',
    array['enqueteur','analyste','procureur','juge','inspecteur'],
    jsonb_build_object(
      'title','FLUX VIDÉO',
      'text',
      case
        when p_confidential_cut then 'Coupure confidentielle : vidéo et audio suspendus jusqu’à 60 secondes.'
        when p_active then 'Flux vidéo + audio direct activé pendant l’interrogatoire. Aucun enregistrement ni replay.'
        else 'Flux vidéo + audio arrêté.'
      end
    )
  );

  return jsonb_build_object('ok',true,'cut_until',cut_until,'session',session_id);
end
$function$;

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
    -- The official Lawyer accompanies a represented suspect automatically.
    -- Ad-hoc consultations never create a representation.
    participants:=to_jsonb(p_targets);
    for x in
      select lp.* from public.igr_v43_lawyer_representations rep
      join public.igr_v4_players lp
        on lp.id=rep.lawyer_id and lp.room_code=r.code and lp.public_role='maitre'
      where rep.room_code=r.code and rep.client_id=any(p_targets)
    loop
      if not (participants ? x.id::text) then
        participants:=participants||to_jsonb(x.id::text);
      end if;
    end loop;
    update public.igr_v4_rooms
    set phase='event_confrontation',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{event_active}',to_jsonb('confrontation'::text),true),'{event_targets}',to_jsonb(p_targets),true),'{v13_event_mode}','true'::jsonb,true),'{confrontation_pairs_v636}',
          coalesce(state->'confrontation_pairs_v636','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
            'cycle',cycle,
            'match',coalesce((state->>'match_no')::integer,1),
            'pair',least(p_targets[1]::text,p_targets[2]::text)||':'||greatest(p_targets[1]::text,p_targets[2]::text)
          )),true),updated_at=now()
    where code=r.code;
    update public.igr_v4_rooms
       set state=jsonb_set(state,'{event_participants}',participants,true),
           updated_at=now()
     where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(
      r.code,'phase',jsonb_build_object('title','CONFRONTATION',
      'text','Deux personnes sont convoquées dans la Grey Room. '
        ||public.igr_v35_seconds_label(secs)||'.'
        ||case when jsonb_array_length(participants)>2
               then ' Leur Avocat officiel les accompagne.'
               else '' end,
      'participants',participants));
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
$function$;

CREATE OR REPLACE FUNCTION public.igr_v44_role_state(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s jsonb;
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  can_consult boolean:=false;
  used integer:=0;
  integrity jsonb:=null;
  attendance jsonb:=null;
  counsel public.igr_v4_players%rowtype;
  target public.igr_v4_players%rowtype;
  completed_call public.igr_v44_lawyer_consultations%rowtype;
begin
  s:=public.igr_v50_judge_state_legacy(p_code,p_player_token);

  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;

  if me.public_role='juge' then
    used:=public.igr_v44_protection_count(r.code);
    integrity:=coalesce(s->'judge_integrity','{}'::jsonb)
      ||jsonb_build_object(
        'personal_objective_failed',used>=3,
        'protections_used',used,
        'protections_limit',3
      );
  end if;

  if me.public_role='suspect'
     and r.phase='interrogation'
     and r.state->>'current_target'=me.id::text
     and not exists(
       select 1
       from public.igr_v44_lawyer_consultations c
       where c.room_code=r.code and c.suspect_id=me.id and (c.cycle=r.cycle or not exists (select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id))
     )
  then
    can_consult:=exists(
      select 1 from public.igr_v4_players l
      where l.room_code=r.code and l.public_role='maitre'
    );
  end if;

  -- Lawyer stays until the interrogation ends. Official representation
  -- applies from the start; an ad-hoc Lawyer joins after the private minute.
  if r.phase='interrogation'
    and not (coalesce(r.state,'{}'::jsonb) ? 'lawyer_consultation_suspect') then
    select * into target from public.igr_v4_players
      where room_code=r.code and id::text=r.state->>'current_target';
    if found then
      select lp.* into counsel from public.igr_v43_lawyer_representations rep
        join public.igr_v4_players lp on lp.id=rep.lawyer_id
        where rep.room_code=r.code and rep.client_id=target.id
          and lp.room_code=r.code and lp.public_role='maitre' limit 1;
      if found then
        attendance:=jsonb_build_object('suspect_id',target.id,'suspect',target.pseudo,
             'lawyer_id',counsel.id,'lawyer',counsel.pseudo,'scope','official');
      else
        select * into completed_call from public.igr_v44_lawyer_consultations c
         where c.room_code=r.code and c.suspect_id=target.id and c.cycle=r.cycle
           and c.status='completed' and c.started_at is not null limit 1;
        if found then
          select * into counsel from public.igr_v4_players
            where room_code=r.code and id=completed_call.lawyer_id and public_role='maitre';
          if found then
            attendance:=jsonb_build_object('suspect_id',target.id,'suspect',target.pseudo,
              'lawyer_id',counsel.id,'lawyer',counsel.pseudo,'scope','ad_hoc');
          end if;
        end if;
      end if;
    end if;
  end if;

  return s||jsonb_build_object(
    'version','v65',
    'summon',null,
    'review',null,
    'free_players','[]'::jsonb,
    'consultation_used',exists(
      select 1
      from public.igr_v44_lawyer_consultations c
      where c.room_code=r.code and c.suspect_id=me.id and (c.cycle=r.cycle or not exists (select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id))
    ),
    'can_request_lawyer_consultation',can_consult,
    'consultation_seconds',60,
    'lawyer_attendance',attendance,
    'consultation_scope',case when exists(select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id) then 'per_cycle' else 'once_per_game' end,
    'natural_interactions',true,
    'protections_used',case when me.public_role='juge' then used else null end,
    'protections_limit',3,
    'protections_remaining',case when me.public_role='juge' then greatest(0,3-used) else null end,
    'judge_integrity',integrity
  );
end
$function$;
