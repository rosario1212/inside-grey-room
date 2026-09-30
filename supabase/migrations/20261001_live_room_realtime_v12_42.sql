-- Inside Grey Room v12.42 — near-instant room updates without exposing room state.
-- A public Realtime table carries only opaque signal tokens + revisions.
-- The mapping from room code to signal token stays private.

create table if not exists public.igr_v4_room_realtime (
  signal_token uuid primary key default gen_random_uuid(),
  revision bigint not null default 1,
  updated_at timestamptz not null default clock_timestamp(),
  closed boolean not null default false
);

alter table public.igr_v4_room_realtime enable row level security;
revoke all on table public.igr_v4_room_realtime from public;
grant select on table public.igr_v4_room_realtime to anon, authenticated;

drop policy if exists igr_v4_room_realtime_read on public.igr_v4_room_realtime;
create policy igr_v4_room_realtime_read
on public.igr_v4_room_realtime
for select
to anon, authenticated
using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='igr_v4_room_realtime'
  ) then
    alter publication supabase_realtime add table public.igr_v4_room_realtime;
  end if;
end $$;

create table if not exists igr_private.igr_v4_room_realtime_map (
  room_code text primary key references public.igr_v4_rooms(code) on delete cascade,
  signal_token uuid unique not null references public.igr_v4_room_realtime(signal_token) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on table igr_private.igr_v4_room_realtime_map from public, anon, authenticated;

create or replace function igr_private.igr_v4_ensure_room_realtime(p_room_code text)
returns uuid
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare
  v_code text:=upper(trim(p_room_code));
  v_token uuid;
begin
  select m.signal_token into v_token
  from igr_private.igr_v4_room_realtime_map m
  where m.room_code=v_code;
  if v_token is not null then return v_token; end if;

  if not exists(select 1 from public.igr_v4_rooms r where r.code=v_code) then
    return null;
  end if;

  v_token:=gen_random_uuid();
  insert into public.igr_v4_room_realtime(signal_token,revision,updated_at,closed)
  values(v_token,1,clock_timestamp(),false);

  insert into igr_private.igr_v4_room_realtime_map(room_code,signal_token)
  values(v_code,v_token)
  on conflict (room_code) do nothing;

  if not exists(select 1 from igr_private.igr_v4_room_realtime_map m where m.room_code=v_code and m.signal_token=v_token) then
    delete from public.igr_v4_room_realtime where signal_token=v_token;
    select m.signal_token into v_token from igr_private.igr_v4_room_realtime_map m where m.room_code=v_code;
  end if;
  return v_token;
end;
$$;

create or replace function igr_private.igr_v4_bump_room_realtime(p_room_code text)
returns void
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare v_token uuid;
begin
  select m.signal_token into v_token
  from igr_private.igr_v4_room_realtime_map m
  where m.room_code=upper(trim(p_room_code));
  if v_token is null then return; end if;
  update public.igr_v4_room_realtime
  set revision=revision+1,updated_at=clock_timestamp(),closed=false
  where signal_token=v_token;
end;
$$;

create or replace function igr_private.igr_v4_room_realtime_insert_trigger()
returns trigger
language plpgsql
security definer
set search_path='public','igr_private'
as $$
begin
  perform igr_private.igr_v4_ensure_room_realtime(new.code);
  return new;
end;
$$;

create or replace function igr_private.igr_v4_room_realtime_update_trigger()
returns trigger
language plpgsql
security definer
set search_path='public','igr_private'
as $$
begin
  perform igr_private.igr_v4_bump_room_realtime(new.code);
  return new;
end;
$$;

create or replace function igr_private.igr_v4_child_realtime_trigger()
returns trigger
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare v_code text;
begin
  if tg_op='DELETE' then v_code:=old.room_code; else v_code:=new.room_code; end if;
  perform igr_private.igr_v4_bump_room_realtime(v_code);
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

create or replace function igr_private.igr_v4_room_realtime_map_cleanup_trigger()
returns trigger
language plpgsql
security definer
set search_path='public','igr_private'
as $$
begin
  update public.igr_v4_room_realtime
  set revision=revision+1,updated_at=clock_timestamp(),closed=true
  where signal_token=old.signal_token;
  return old;
end;
$$;

drop trigger if exists igr_v4_room_realtime_insert on public.igr_v4_rooms;
create trigger igr_v4_room_realtime_insert
after insert on public.igr_v4_rooms
for each row execute function igr_private.igr_v4_room_realtime_insert_trigger();

drop trigger if exists igr_v4_room_realtime_update on public.igr_v4_rooms;
create trigger igr_v4_room_realtime_update
after update on public.igr_v4_rooms
for each row execute function igr_private.igr_v4_room_realtime_update_trigger();

drop trigger if exists igr_v4_players_realtime on public.igr_v4_players;
create trigger igr_v4_players_realtime
after insert or update or delete on public.igr_v4_players
for each row execute function igr_private.igr_v4_child_realtime_trigger();

drop trigger if exists igr_v4_events_realtime on public.igr_v4_events;
create trigger igr_v4_events_realtime
after insert or update or delete on public.igr_v4_events
for each row execute function igr_private.igr_v4_child_realtime_trigger();

drop trigger if exists igr_v4_actions_realtime on public.igr_v4_actions;
create trigger igr_v4_actions_realtime
after insert or update or delete on public.igr_v4_actions
for each row execute function igr_private.igr_v4_child_realtime_trigger();

drop trigger if exists igr_v4_room_realtime_map_cleanup on igr_private.igr_v4_room_realtime_map;
create trigger igr_v4_room_realtime_map_cleanup
after delete on igr_private.igr_v4_room_realtime_map
for each row execute function igr_private.igr_v4_room_realtime_map_cleanup_trigger();

-- Backfill live tokens for rooms that already exist.
do $$
declare r record;
begin
  for r in select code from public.igr_v4_rooms loop
    perform igr_private.igr_v4_ensure_room_realtime(r.code);
  end loop;
end $$;

create or replace function public.igr_v4_realtime_token(p_code text,p_player_token uuid)
returns uuid
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare v_code text:=upper(trim(p_code));v_token uuid;
begin
  if not exists(
    select 1 from public.igr_v4_players p
    where p.room_code=v_code and p.player_token=p_player_token
  ) then raise exception 'unauthorized'; end if;
  v_token:=igr_private.igr_v4_ensure_room_realtime(v_code);
  return v_token;
end;
$$;
revoke all on function public.igr_v4_realtime_token(text,uuid) from public;
grant execute on function public.igr_v4_realtime_token(text,uuid) to anon, authenticated;

create or replace function public.igr_v4_leave_room(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','igr_private'
as $$
declare
  v_code text:=upper(trim(p_code));
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  v_count int;
begin
  select * into p from public.igr_v4_players
  where room_code=v_code and player_token=p_player_token
  for update;
  if not found then return jsonb_build_object('ok',true,'already_left',true); end if;

  select * into r from public.igr_v4_rooms where code=v_code for update;
  if not found then return jsonb_build_object('ok',true,'room_closed',true); end if;
  if r.status<>'lobby' then
    return jsonb_build_object('ok',false,'reason','game_started');
  end if;

  if p.is_host then
    delete from public.igr_v4_rooms where code=v_code;
    return jsonb_build_object('ok',true,'room_closed',true,'host_left',true);
  end if;

  delete from public.igr_v4_players where id=p.id;
  select count(*) into v_count from public.igr_v4_players where room_code=v_code;
  return jsonb_build_object('ok',true,'left',true,'remaining',v_count);
end;
$$;
revoke all on function public.igr_v4_leave_room(text,uuid) from public;
grant execute on function public.igr_v4_leave_room(text,uuid) to anon, authenticated;
