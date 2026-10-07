-- Inside Grey Room v67 — simplified final audience
-- Surface simplicity, unchanged canonical truth:
-- 1) Audience des rôles
-- 2) Défenses des suspects (Avocat inclus dans le temps du client)
-- 3) Une seule lecture finale puis révélation
-- No pre-defence responsibility form and no separate lawyer-opinion stage.

create or replace function public.igr_v52_begin_stage(p_room text,p_stage text)
returns void language plpgsql security definer set search_path=''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  p public.igr_v4_players%rowtype;
  q jsonb='[]'::jsonb;
  first jsonb;
  phase_name text;
  next_stage text;
  req int;
  vote_req int;
  speech_seconds int;
  defense_seconds int;
  lawyer_id uuid;
  lawyer_pseudo text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  speech_seconds:=case when r.state->>'duration_mode'='short' then 60 else 120 end;
  defense_seconds:=case when r.state->>'duration_mode'='short' then 120 else 180 end;

  if p_stage='audience' then
    delete from public.igr_v4_actions
    where room_code=p_room
      and action_type in (
        'final_lock','judge_integrity_vote',
        'v52_audience_initial','v52_audience_spoken','v52_audience_skip',
        'v52_defense_spoken','v52_defense_skip',
        'v52_lawyer_spoken','v52_lawyer_skip'
      );

    for p in
      select *
      from public.igr_v4_players
      where room_code=p_room
        and public_role in ('enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste')
      order by case public_role
        when 'enqueteur' then 1 when 'analyste' then 2 when 'inspecteur' then 3
        when 'expert' then 4 when 'procureur' then 5 when 'juge' then 6
        when 'journaliste' then 7 else 99 end,
        seat_index
    loop
      q:=q||jsonb_build_array(jsonb_build_object(
        'player_id',p.id::text,
        'pseudo',p.pseudo,
        'role',p.public_role,
        'seconds',speech_seconds,
        'required',p.public_role='juge'
      ));
    end loop;
    phase_name:='final_audience';
    next_stage:='defenses';

  elsif p_stage='defenses' then
    for p in
      select *
      from public.igr_v4_players
      where room_code=p_room and public_role='suspect'
      order by internal_slot nulls last,seat_index
    loop
      lawyer_id:=null;
      lawyer_pseudo:=null;
      select x.lawyer_id,l.pseudo
      into lawyer_id,lawyer_pseudo
      from public.igr_v43_lawyer_representations x
      join public.igr_v4_players l on l.id=x.lawyer_id
      where x.room_code=p_room and x.client_id=p.id
      limit 1;

      q:=q||jsonb_build_array(jsonb_build_object(
        'player_id',p.id::text,
        'pseudo',p.pseudo,
        'role','suspect',
        'seconds',defense_seconds,
        'required',false,
        'lawyer_id',case when lawyer_id is null then null else lawyer_id::text end,
        'lawyer_pseudo',lawyer_pseudo
      ));
    end loop;
    phase_name:='final_suspect_defenses';
    next_stage:='locking';

  elsif p_stage='lawyers' then
    -- Compatibility with a stale client/server already pointing at the removed stage.
    perform public.igr_v52_begin_stage(p_room,'locking');
    return;

  elsif p_stage='locking' then
    select count(*) into req
    from public.igr_v4_players
    where room_code=p_room and public.igr_v52_investigation_role(public_role);

    select count(*) into vote_req
    from public.igr_v4_players
    where room_code=p_room
      and public_role in ('enqueteur','analyste','procureur')
      and public.igr_v44_judge_present(p_room);

    update public.igr_v4_rooms
    set phase='locking',
        phase_started_at=now(),
        phase_ends_at=null,
        state=jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb('locking'::text),true),
                '{v52_final_reassessment}','true'::jsonb,true
              ),
              '{v52_locks_required}',to_jsonb(req),true
            ),
            '{v52_locks_received}','0'::jsonb,true
          ),
          '{v52_integrity_required}',to_jsonb(vote_req),true
        ),
        updated_at=now()
    where code=p_room;

    insert into public.igr_v4_events(room_code,event_type,visibility,payload)
    values(
      p_room,'phase','public',
      jsonb_build_object(
        'title','DÉCISION FINALE',
        'text','Après toutes les défenses : 0 aucune, 1 secondaire, 2 principale. Chaque rôle du camp Enquête verrouille une seule lecture. Aucun nouvel élément ne peut entrer.'
      )
    );
    return;
  else
    raise exception 'invalid stage';
  end if;

  if jsonb_array_length(q)=0 then
    perform public.igr_v52_begin_stage(p_room,next_stage);
    return;
  end if;

  first:=q->0;
  update public.igr_v4_rooms
  set phase=phase_name,
      phase_started_at=now(),
      phase_ends_at=null,
      state=jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb(p_stage),true),
                '{v52_queue}',q,true
              ),
              '{v52_index}','0'::jsonb,true
            ),
            '{v52_status}',to_jsonb('waiting'::text),true
          ),
          '{v52_current_id}',to_jsonb(first->>'player_id'),true
        ),
        '{v52_current_role}',to_jsonb(first->>'role'),true
      ),
      updated_at=now()
  where code=p_room;

  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
  values(
    p_room,'phase','public',
    case p_stage
      when 'audience' then jsonb_build_object(
        'title','AUDIENCE FINALE',
        'text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.'
      )
      else jsonb_build_object(
        'title','DÉFENSES FINALES',
        'text','Chaque suspect peut parler COURT 02:00 / LONG 03:00 ou passer. Son Avocat officiel partage ce temps ; il n’existe pas de second plaidoyer séparé.'
      )
    end
  );
end$$;

create or replace function public.igr_v52_advance(p_room text,p_reason text default 'manual')
returns void language plpgsql security definer set search_path=''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  q jsonb;
  idx int;
  nxt int;
  item jsonb;
  stage text;
  status text;
  spoken_type text;
  next_stage text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  stage:=r.state->>'v52_stage';
  q:=coalesce(r.state->'v52_queue','[]'::jsonb);
  idx:=coalesce((r.state->>'v52_index')::int,0);
  item:=q->idx;
  status:=coalesce(r.state->>'v52_status','waiting');

  spoken_type:=case
    when stage='audience' then 'v52_audience_spoken'
    else 'v52_defense_spoken'
  end;

  if status='active'
     and item is not null
     and not exists(
       select 1 from public.igr_v4_actions
       where room_code=p_room
         and player_id=(item->>'player_id')::uuid
         and action_type=spoken_type
     )
  then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(
      p_room,(item->>'player_id')::uuid,r.cycle,spoken_type,
      jsonb_build_object('reason',p_reason,'role',item->>'role')
    );
  end if;

  if stage='audience'
     and item->>'role'='journaliste'
     and not exists(
       select 1 from public.igr_v4_actions
       where room_code=p_room
         and player_id=(item->>'player_id')::uuid
         and action_type='final_lock'
     )
  then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(
      p_room,(item->>'player_id')::uuid,r.cycle,'final_lock',
      jsonb_build_object('note','Audience finale v67','version','v67')
    );
  end if;

  nxt:=idx+1;
  if nxt>=jsonb_array_length(q) then
    next_stage:=case
      when stage='audience' then 'defenses'
      else 'locking'
    end;
    perform public.igr_v52_begin_stage(p_room,next_stage);
    return;
  end if;

  item:=q->nxt;
  update public.igr_v4_rooms
  set phase_started_at=now(),
      phase_ends_at=null,
      state=jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(state,'{v52_index}',to_jsonb(nxt),true),
            '{v52_status}',to_jsonb('waiting'::text),true
          ),
          '{v52_current_id}',to_jsonb(item->>'player_id'),true
        ),
        '{v52_current_role}',to_jsonb(item->>'role'),true
      ),
      updated_at=now()
  where code=r.code;
end$$;

create or replace function public.igr_v52_stage_action(
  p_code text,
  p_player_token uuid,
  p_action text,
  p_levels jsonb default null
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  q jsonb;
  idx int;
  item jsonb;
  stage text;
  status text;
  skip_type text;
begin
  perform igr_private.rate_limit('v52_stage',p_player_token::text,30,60);

  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r
  from public.igr_v4_rooms
  where code=me.room_code
  for update;

  stage:=r.state->>'v52_stage';
  if r.phase not in ('final_audience','final_suspect_defenses') then
    raise exception 'wrong phase';
  end if;

  q:=coalesce(r.state->'v52_queue','[]'::jsonb);
  idx:=coalesce((r.state->>'v52_index')::int,0);
  item:=q->idx;
  status:=coalesce(r.state->>'v52_status','waiting');

  if item is null or item->>'player_id'<>me.id::text then
    raise exception 'not your turn';
  end if;

  if p_action='start' then
    if status<>'waiting' then raise exception 'already started'; end if;
    update public.igr_v4_rooms
    set phase_started_at=now(),
        phase_ends_at=now()+make_interval(secs=>coalesce((item->>'seconds')::int,120)),
        state=jsonb_set(state,'{v52_status}',to_jsonb('active'::text),true),
        updated_at=now()
    where code=r.code;

  elsif p_action='skip' then
    if status<>'waiting' then raise exception 'already started'; end if;
    if stage='audience' and me.public_role='juge' then
      raise exception 'judge must speak';
    end if;

    skip_type:=case
      when stage='audience' then 'v52_audience_skip'
      else 'v52_defense_skip'
    end;

    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(r.code,me.id,r.cycle,skip_type,jsonb_build_object('role',me.public_role));

    perform public.igr_v52_advance(r.code,'skip');

  elsif p_action='end' then
    if status<>'active' then raise exception 'not active'; end if;
    perform public.igr_v52_advance(r.code,'manual');

  else
    raise exception 'invalid action';
  end if;

  return jsonb_build_object('ok',true);
end$$;

revoke all on function public.igr_v52_begin_stage(text,text) from public,anon,authenticated;
revoke all on function public.igr_v52_advance(text,text) from public,anon,authenticated;
grant execute on function public.igr_v52_stage_action(text,uuid,text,jsonb) to anon,authenticated,service_role;
