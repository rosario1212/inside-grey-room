-- Inside Grey Room v772 — server-side investigation quota and neutral 60 s cadence.
-- Apply together with the frontend and reviewed cycle transitions, not independently.

create or replace function igr_private.igr_v772_one_investigation()
returns trigger language plpgsql security definer set search_path to ''
as $v772$
begin
 if new.action_type ~ '^investigation_[0-9]{3}$'
    and new.cycle between 1 and 3
    and exists(select 1 from public.igr_v4_actions a
       where a.room_code=new.room_code and a.cycle=new.cycle
         and a.action_type ~ '^investigation_[0-9]{3}$') then
   raise exception 'Une seule pièce d’investigation peut être choisie par cycle.';
 end if;
 return new;
end;
$v772$;
revoke all on function igr_private.igr_v772_one_investigation() from public,anon,authenticated;
drop trigger if exists igr_v772_one_investigation on public.igr_v4_actions;
create trigger igr_v772_one_investigation before insert on public.igr_v4_actions
for each row execute function igr_private.igr_v772_one_investigation();

create or replace function igr_private.igr_v772_set_choice_timeout()
returns trigger language plpgsql security definer set search_path to ''
as $v772$
begin
 if new.status='playing'
    and new.phase in ('interrogation_select','event_select')
    and (new.phase is distinct from old.phase
      or new.phase_started_at is distinct from old.phase_started_at)
    and new.phase_ends_at is null then
    new.phase_ends_at:=now()+interval '60 seconds';
 end if;
 return new;
end;
$v772$;
revoke all on function igr_private.igr_v772_set_choice_timeout() from public,anon,authenticated;
drop trigger if exists igr_v772_set_choice_timeout on public.igr_v4_rooms;
create trigger igr_v772_set_choice_timeout before update of phase,phase_started_at,phase_ends_at
on public.igr_v4_rooms for each row
execute function igr_private.igr_v772_set_choice_timeout();

create or replace function igr_private.igr_v772_auto_choice(p_room text)
returns void language plpgsql security definer set search_path to ''
as $v772$
declare
 r public.igr_v4_rooms%rowtype;
 investigator uuid;
 target_id uuid;
 target_ids uuid[];
 opts jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if not found or r.status<>'playing' or r.phase not in ('interrogation_select','event_select')
    or r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;
 select player_token into investigator from public.igr_v4_players
 where room_code=r.code and public_role='enqueteur' order by seat_index limit 1;
 if investigator is null then
   update public.igr_v4_rooms set phase_ends_at=now()+interval '60 seconds' where code=r.code;
   return;
 end if;
 select id into target_id from public.igr_v4_players
 where room_code=r.code and public_role='suspect'
   and not (coalesce(r.state->'heard','[]'::jsonb) ? id::text)
 order by md5(id::text||r.code||r.cycle::text) limit 1;
 if r.phase='interrogation_select' then
   if target_id is null then
     update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),
       phase_ends_at=now()+interval '2 minutes' where code=r.code;
   else
     -- Prevent the nested start RPC's own tick from re-entering this timeout.
     update public.igr_v4_rooms set phase_ends_at=null where code=r.code;
     perform public.igr_v4_start_interrogation(r.code,investigator,target_id);
   end if;
   return;
 end if;
 opts:=public.igr_v13_event_options(r.code);
 if target_id is not null and exists(
   select 1 from jsonb_array_elements(opts) x where x->>'key'='interrogation') then
   perform public.igr_v13_start_event(r.code,investigator,'interrogation',array[target_id]);
   return;
 end if;
 if exists(select 1 from jsonb_array_elements(opts) x where x->>'key'='assembly') then
   perform public.igr_v13_start_event(r.code,investigator,'assembly',null);
   return;
 end if;
 select array_agg(id) into target_ids from (
   select id from public.igr_v4_players where room_code=r.code and public_role='suspect'
   order by md5(id::text||r.code||r.cycle::text) limit 2
 ) t;
 if coalesce(array_length(target_ids,1),0)=2
    and exists(select 1 from jsonb_array_elements(opts) x where x->>'key'='confrontation')
    and not exists(select 1 from jsonb_array_elements(
      coalesce(r.state->'confrontation_pairs_v636','[]'::jsonb)) q
      where q->>'pair'=least(target_ids[1]::text,target_ids[2]::text)
        ||':'||greatest(target_ids[1]::text,target_ids[2]::text)
        and (q->>'cycle')::integer=r.cycle
        and coalesce((q->>'match')::integer,1)=coalesce((r.state->>'match_no')::integer,1)) then
   perform public.igr_v13_start_event(r.code,investigator,'confrontation',target_ids);
   return;
 end if;
 -- Never invent an event, a person's testimony or a decision. Consume only
 -- the empty official event slot, with the full state machine as authority.
 perform public.igr_v13_complete_event(r.code,'no_eligible_event');
end;
$v772$;
revoke all on function igr_private.igr_v772_auto_choice(text) from public,anon,authenticated;
grant execute on function igr_private.igr_v772_auto_choice(text) to service_role;

-- Safe, authorized mapping of public suspect aliases to real player pseudos.
-- It reveals no secret role, culprit, variant or private card content.
create or replace function public.igr_v772_public_cast(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $v772$
declare v_room text; v_map jsonb;
begin
 select p.room_code into v_room from public.igr_v4_players p
 join public.igr_v4_rooms r on r.code=p.room_code
 where p.room_code=upper(btrim(p_code)) and p.player_token=p_player_token
   and r.status in ('playing','finished');
 if v_room is null then raise exception 'forbidden'; end if;
 select coalesce(jsonb_object_agg('S'||p.internal_slot::text,p.pseudo),'{}'::jsonb)
 into v_map from public.igr_v4_players p
 where p.room_code=v_room and p.public_role='suspect'
   and p.internal_slot between 1 and 9;
 return v_map;
end;
$v772$;
revoke all on function public.igr_v772_public_cast(text,uuid) from public;
grant execute on function public.igr_v772_public_cast(text,uuid) to anon,authenticated;

-- Stop automatically publishing nearly identical numerical cycle summaries.
-- Keep prior events in history; the client filters only redundant notices.
drop trigger if exists igr_v771_cycle_public_notice on public.igr_v4_rooms;
