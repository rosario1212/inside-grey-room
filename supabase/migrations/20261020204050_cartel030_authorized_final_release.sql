-- CARTEL 030: author explicitly requested final publication on 2026-10-20.
-- This is author release authorization, not an invented independent review.
-- No private manuscript or solution is included in the public repository.

alter table igr_private.igr_v110_030_room_variants
  add column if not exists manuscript jsonb,
  add column if not exists match_no integer not null default 1,
  add column if not exists event_floor_id bigint not null default 0;
alter table igr_private.igr_v110_030_room_variants enable row level security;
revoke all on igr_private.igr_v110_030_room_variants from public,anon,authenticated;

do $release$
begin
  if (select count(*) from igr_private.igr_v99_variant_manuscripts
      where scenario_id='030' and variant_id in ('A','B','C')
        and jsonb_array_length(manuscript->'private_cards')=3
        and jsonb_array_length(manuscript->'revelations')=23
        and length(manuscript->>'final_reveal')>40)<>3 then
    raise exception '030 private release incomplete';
  end if;
  update igr_private.igr_v99_variant_manuscripts
  set editorial_status='ready',approved_by='Author: explicit final publication request 2026-10-20',
      approved_at=now(),updated_at=now(),
      manuscript=manuscript||jsonb_build_object('status','ready','author_release_approved',true,
        'editorial_review_flags','[]'::jsonb)
  where scenario_id='030';
end; $release$;

-- Preserve games already in progress when upgrading the runtime.
update igr_private.igr_v110_030_room_variants v
set manuscript=m.manuscript
from igr_private.igr_v99_variant_manuscripts m
where m.scenario_id='030' and m.variant_id=v.variant_id and v.manuscript is null;

create or replace function igr_private.igr_v110_030_after_start()
returns trigger language plpgsql security definer set search_path='' as $start$
declare
  n integer; expected integer; chosen record; actor record; card jsonb; vc jsonb;
  floor_id bigint; current_match integer;
begin
  if not (old.status='lobby' and new.status='playing' and new.scenario_id='030') then return new; end if;
  select count(*) into n from public.igr_v4_players where room_code=new.code;
  if n not in (7,8,9) then raise exception '030 requires 7-9 players'; end if;
  if (select count(*) from public.igr_v4_players where room_code=new.code and public_role='suspect')<>3 then
    raise exception '030 requires exactly three suspects';
  end if;
  expected:=case when n=9 then 2 else 1 end;
  if (select count(*) from igr_private.igr_v99_variant_manuscripts
      where scenario_id='030' and editorial_status='ready'
        and manuscript->>'author_release_approved'='true')<>3 then
    raise exception '030 release not authorized';
  end if;
  select variant_id,manuscript into chosen
  from igr_private.igr_v99_variant_manuscripts
  where scenario_id='030' and editorial_status='ready'
    and manuscript->>'author_release_approved'='true'
  order by gen_random_uuid() limit 1;
  select coalesce(max(id),0) into floor_id from public.igr_v4_events where room_code=new.code;
  current_match:=greatest(1,coalesce((new.state->>'match_no')::integer,1));
  insert into igr_private.igr_v110_030_room_variants(room_code,variant_id,manuscript,match_no,event_floor_id)
  values(new.code,chosen.variant_id,chosen.manuscript,current_match,floor_id)
  on conflict(room_code) do update set variant_id=excluded.variant_id,manuscript=excluded.manuscript,
    match_no=excluded.match_no,event_floor_id=excluded.event_floor_id,assigned_at=clock_timestamp();

  -- Uniform draw among compatible cover roles, including the host when eligible.
  -- The canonical start already resets secret_role to the selected public role.
  with candidates as (
    select id from public.igr_v4_players where room_code=new.code
      and public_role in ('analyste','procureur','maitre','journaliste')
    order by gen_random_uuid() limit expected
  ) update public.igr_v4_players p set secret_role='espion' from candidates c where p.id=c.id;
  if (select count(*) from public.igr_v4_players where room_code=new.code and secret_role='espion')<>expected then
    raise exception '030 mole count mismatch';
  end if;
  for actor in select * from public.igr_v4_players where room_code=new.code loop
    card:=public.igr_v4_build_private_card(new.code,actor.id);
    if actor.public_role='suspect' then
      select value into vc from jsonb_array_elements(chosen.manuscript->'private_cards')
      where (value->>'slot')::integer=actor.internal_slot;
      if vc is null then raise exception '030 private card missing'; end if;
      card:=card||jsonb_build_object('variant_card',vc);
    elsif actor.secret_role='espion' then
      card:=card||jsonb_build_object('secret_mission',
        'Tu es une taupe sous ta couverture habituelle. Ton motif : '
        ||(chosen.manuscript->'canonical_truth'->>'mole_motive')
        ||'. Tu sais que la copie I-14 comporte une falsification du champ « '
        ||(chosen.manuscript->'canonical_truth'->>'forged_I14_field')
        ||' ». Oriente les soupçons et protège le réseau. Tu peux mentir oralement, sans modifier les documents authentiques, inventer une preuve ou obtenir de pouvoir supplémentaire.');
    end if;
    update public.igr_v4_players set private_state=card where id=actor.id;
  end loop;
  return new;
end; $start$;
revoke all on function igr_private.igr_v110_030_after_start() from public,anon,authenticated;

create or replace function igr_private.igr_v111_030_cycle_evidence()
returns trigger language plpgsql security definer set search_path='' as $evidence$
declare snapshot igr_private.igr_v110_030_room_variants%rowtype; piece jsonb;
begin
  if new.scenario_id<>'030' or new.status<>'playing' or new.cycle not between 1 and 3 or new.cycle<=old.cycle then return new; end if;
  select * into snapshot from igr_private.igr_v110_030_room_variants where room_code=new.code;
  if snapshot.manuscript is null then raise exception '030 private snapshot missing'; end if;
  for piece in select value from jsonb_array_elements(snapshot.manuscript->'revelations') loop
    if (piece->>'min_cycle')::integer<=new.cycle and not exists(
      select 1 from public.igr_v4_events where room_code=new.code and id>snapshot.event_floor_id
      and event_type='trame' and payload->>'evidence_id'=piece->>'id'
    ) then
      insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload,cycle)
      values(new.code,'trame','roles',array['enqueteur','analyste','procureur','juge'],
        jsonb_build_object('title',piece->>'title','text',piece->>'text','evidence_id',piece->>'id',
          'source','CARTEL 030 — Enquête','match_no',snapshot.match_no),new.cycle);
    end if;
  end loop;
  return new;
end; $evidence$;
revoke all on function igr_private.igr_v111_030_cycle_evidence() from public,anon,authenticated;

-- Only the normal final-revelation event exposes the selected narrative ending.
create or replace function igr_private.igr_v165_030_final_reveal()
returns trigger language plpgsql security definer set search_path='' as $reveal$
declare r public.igr_v4_rooms%rowtype; snapshot igr_private.igr_v110_030_room_variants%rowtype;
begin
  select * into r from public.igr_v4_rooms where code=new.room_code;
  if r.scenario_id<>'030' then return new; end if;
  if r.status<>'finished' or r.phase<>'reveal' then raise exception '030 reveal is not final'; end if;
  select * into snapshot from igr_private.igr_v110_030_room_variants where room_code=r.code;
  if snapshot.manuscript is null then raise exception '030 final snapshot missing'; end if;
  new.payload:=new.payload||jsonb_build_object('summary',snapshot.manuscript->>'final_reveal');
  return new;
end; $reveal$;
revoke all on function igr_private.igr_v165_030_final_reveal() from public,anon,authenticated;
drop trigger if exists igr_v165_030_final_reveal on public.igr_v4_events;
create trigger igr_v165_030_final_reveal before insert on public.igr_v4_events
for each row when (new.event_type='reveal') execute function igr_private.igr_v165_030_final_reveal();

-- Extend existing rematch isolation to 030 without altering 029 behavior.
do $visibility$
declare definition text;
begin
  select pg_get_functiondef('public.igr_v4_visible_events(text,public.igr_v4_players)'::regprocedure) into definition;
  if position('030 snapshot event floor' in definition)=0 then
    definition:=replace(definition,'where e.room_code=p_room',
      'where e.room_code=p_room
   -- 030 snapshot event floor prevents previous-game solutions from leaking.
   and e.id>coalesce((select v.event_floor_id from igr_private.igr_v110_030_room_variants v
     join public.igr_v4_rooms r on r.code=v.room_code where v.room_code=p_room and r.scenario_id=''030''),-1)');
    execute definition;
  end if;
end; $visibility$;
-- Internal composite-row helper; browser clients use the token-authenticated sync RPC.
revoke all on function public.igr_v4_visible_events(text,public.igr_v4_players) from public,anon,authenticated;

-- Atomic release self-test. Every fixture is rolled back in a subtransaction;
-- any real failure aborts the entire migration and preserves the prior release.
do $qa$
declare
  n integer; mode text; round_no integer; seat integer; cycle_no integer; expected_count integer;
  qa_room text; host uuid; actor public.igr_v4_players%rowtype; snapshot jsonb;
  response jsonb; events jsonb; reveal jsonb; levels jsonb; variant text; expected_card jsonb;
  tested integer:=0; evidence_count integer; m record;
begin
  begin
    for m in select * from igr_private.igr_v99_variant_manuscripts where scenario_id='030' loop
      for seat in 1..3 loop
        select value into expected_card from jsonb_array_elements(m.manuscript->'private_cards') where (value->>'slot')::integer=seat;
        if length(expected_card->>'variant_secret')<20 or length(expected_card->>'what_you_know')<80 then
          raise exception '030 incomplete variant card';
        end if;
      end loop;
      for cycle_no in 1..3 loop
        select count(*) into evidence_count from jsonb_array_elements(m.manuscript->'revelations') where (value->>'min_cycle')::integer=cycle_no;
        if evidence_count<>(array[6,7,10])[cycle_no] then raise exception '030 evidence schedule invalid'; end if;
      end loop;
    end loop;
    foreach n in array array[7,8,9] loop
      foreach mode in array array['short','long'] loop
        loop
          qa_room:='Z3'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
          exit when not exists(select 1 from public.igr_v4_rooms where igr_v4_rooms.code=qa_room);
        end loop;
        insert into public.igr_v4_rooms(code,scenario_id,state)
        values(qa_room,'030',jsonb_build_object('duration_mode',mode)) returning host_token into host;
        for seat in 0..n-1 loop
          insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
          values(qa_room,'QA participant '||seat,seat,seat=0);
        end loop;
        for round_no in 1..2 loop
          if round_no=2 then
            delete from public.igr_v4_actions where room_code=qa_room;
            update public.igr_v4_rooms set status='lobby',phase='lobby',cycle=0,
              state=jsonb_build_object('match_no',2,'duration_mode',mode),phase_ends_at=null where igr_v4_rooms.code=qa_room;
          end if;
          perform public.igr_v4_start_game(qa_room,host);
          tested:=tested+1;
          select manuscript,variant_id into snapshot,variant from igr_private.igr_v110_030_room_variants where room_code=qa_room;
          if snapshot is null or variant not in ('A','B','C') then raise exception '030 snapshot invalid'; end if;
          if (select count(*) from public.igr_v4_players where room_code=qa_room and secret_role='espion')<>(case when n=9 then 2 else 1 end) then
            raise exception '030 mole distribution invalid';
          end if;
          if exists(select 1 from public.igr_v4_players where room_code=qa_room and secret_role='espion'
                    and public_role not in ('analyste','procureur','maitre','journaliste')) then
            raise exception '030 invalid cover role';
          end if;
          update public.igr_v4_rooms set phase='role_reading',phase_ends_at=now()+interval '1 hour' where igr_v4_rooms.code=qa_room;
          for actor in select * from public.igr_v4_players where room_code=qa_room loop
            response:=public.igr_v4_sync(qa_room,actor.player_token);
            if response->'players' @? '$[*].secret_role' or response->'players' @? '$[*].private_state' then
              raise exception '030 other-player secrets leaked';
            end if;
            if response->'room'->'state' ?| array['variant_id','manuscript','canonical_truth','v21_author_master'] then
              raise exception '030 public state leaked';
            end if;
            if actor.public_role='suspect' then
              select value into expected_card from jsonb_array_elements(snapshot->'private_cards') where (value->>'slot')::integer=actor.internal_slot;
              if response#>'{player,private_state,variant_card}' is distinct from expected_card then raise exception '030 wrong private card'; end if;
            end if;
            if exists(select 1 from jsonb_array_elements(response->'events') e where e->>'event_type'='reveal') then
              raise exception '030 previous ending leaked into new game';
            end if;
          end loop;
          for cycle_no in 1..3 loop
            update public.igr_v4_rooms set cycle=cycle_no,phase='cycle_debrief',phase_ends_at=now()+interval '1 hour' where igr_v4_rooms.code=qa_room;
            expected_count:=(array[6,13,23])[cycle_no];
            for actor in select * from public.igr_v4_players where room_code=qa_room loop
              response:=public.igr_v4_sync(qa_room,actor.player_token);
              select count(*) into evidence_count from jsonb_array_elements(response->'events') e where e->'payload' ? 'evidence_id';
              if evidence_count<>(case when actor.public_role in ('enqueteur','analyste','procureur','juge') then expected_count else 0 end) then
                raise exception '030 cycle % evidence visibility failed for %',cycle_no,actor.public_role;
              end if;
            end loop;
          end loop;
          -- Retry an already delivered cycle: never duplicate evidence.
          update public.igr_v4_rooms set cycle=2 where igr_v4_rooms.code=qa_room;
          update public.igr_v4_rooms set cycle=3 where igr_v4_rooms.code=qa_room;
          select count(*) into evidence_count from public.igr_v4_events e
          join igr_private.igr_v110_030_room_variants v on v.room_code=e.room_code
          where e.room_code=qa_room and e.id>v.event_floor_id and e.payload ? 'evidence_id';
          if evidence_count<>23 then raise exception '030 duplicate evidence'; end if;
          update public.igr_v4_rooms set phase='locking',phase_ends_at=null,
            state=state||jsonb_build_object('v52_final_reassessment',true) where igr_v4_rooms.code=qa_room;
          select jsonb_object_agg(id::text,2) into levels from public.igr_v4_players where room_code=qa_room and public_role='suspect';
          insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
          select qa_room,id,3,'final_lock',jsonb_build_object('levels',levels,'note','Conclusion finale de vérification')
          from public.igr_v4_players where room_code=qa_room and public_role in ('enqueteur','analyste','procureur','juge','journaliste');
          insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
          select qa_room,id,3,'judge_integrity_vote','{}'::jsonb from public.igr_v4_players where room_code=qa_room and public_role in ('enqueteur','analyste','procureur');
          response:=public.igr_v52_maybe_finish(qa_room);
          if response->>'finished'<>'true' then raise exception '030 finalization did not complete'; end if;
          select payload into reveal from public.igr_v4_events where room_code=qa_room and event_type='reveal' order by id desc limit 1;
          if reveal->>'summary' is distinct from snapshot->>'final_reveal' then raise exception '030 wrong variant ending'; end if;
        end loop;
      end loop;
    end loop;
    raise exception sqlstate 'P0300' using message='030 fixtures passed';
  exception when sqlstate 'P0300' then null;
  end;
  if tested<>12 then raise exception '030 test matrix incomplete'; end if;
  update igr_private.igr_v99_variant_manuscripts set manuscript=manuscript||jsonb_build_object(
    'technical_release_checks',jsonb_build_object('starts',tested,'player_counts',array[7,8,9],
      'duration_modes',array['short','long'],'replay_isolation',true,'private_cards',true,
      'evidence_access',true,'final_reveal',true,'checked_at',now())) where scenario_id='030';
end; $qa$;
