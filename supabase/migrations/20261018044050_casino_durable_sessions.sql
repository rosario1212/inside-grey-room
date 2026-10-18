-- CASINO storage API. No biography, solution or canonical variant belongs here.
-- Additive: existing modes, policies, packs and narrative gates are untouched.
create schema if not exists igr_casino_private;
revoke all on schema igr_casino_private from public,anon,authenticated;
grant usage on schema igr_casino_private to service_role;
create table if not exists igr_casino_private.casino_releases (
  id text primary key,
  variant text not null check (variant in ('A','B','C')),
  revision integer not null check (revision > 0),
  status text not null default 'draft' check (status in ('draft','approved','retired')),
  approved_by text,
  approved_at timestamptz,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (variant,revision),
  check (status <> 'approved' or (length(approved_by) > 0 and approved_at is not null))
);
create table if not exists igr_casino_private.casino_rooms (
  id uuid primary key,
  invite_code text not null unique check (invite_code ~ '^C[A-Z2-9]{9}$'),
  owner_profile_id uuid not null references public.igr_social_profiles(id),
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  initial_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists igr_casino_private.casino_journal (
  room_id uuid not null references igr_casino_private.casino_rooms(id) on delete cascade,
  request_id uuid not null,
  actor_id text not null,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  revision bigint not null,
  command jsonb not null,
  committed_at timestamptz not null default now(),
  primary key (room_id,request_id),
  unique (room_id,revision)
);
alter table igr_casino_private.casino_releases enable row level security;
alter table igr_casino_private.casino_rooms enable row level security;
alter table igr_casino_private.casino_journal enable row level security;
revoke all on table igr_casino_private.casino_releases,igr_casino_private.casino_rooms,igr_casino_private.casino_journal from public,anon,authenticated;
grant select on igr_casino_private.casino_releases to service_role;
grant select,insert,update on igr_casino_private.casino_rooms to service_role;
grant select,insert on igr_casino_private.casino_journal to service_role;
-- Intentionally no client policy, no Realtime publication of private state,
-- and no EXECUTE for client roles. Edge Functions use SECURITY INVOKER.
create or replace function public.igr_casino_storage_read(p_id uuid default null,p_invite text default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id',id,'inviteCode',invite_code,'revision',revision,'state',state)
  from igr_casino_private.casino_rooms
  where (p_id is not null and id=p_id) or (p_id is null and invite_code=p_invite)
$$;
create or replace function public.igr_casino_storage_create(
  p_id uuid,p_invite text,p_profile_id uuid,p_profile_token text,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not public.igr_dlc_has_access(p_profile_id,'heritage') then raise exception 'premium_access_required'; end if;
  if octet_length(p_state::text)>2000000 or p_state->>'status'<>'lobby' then raise exception 'invalid_initial_state'; end if;
  insert into igr_casino_private.casino_rooms(id,invite_code,owner_profile_id,state,initial_state)
    values(p_id,p_invite,p_profile_id,p_state,p_state);
  return public.igr_casino_storage_read(p_id,null);
end $$;
create or replace function public.igr_casino_storage_commit(
  p_id uuid,p_expected_revision bigint,p_request_id uuid,p_actor text,
  p_fingerprint text,p_command jsonb,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r igr_casino_private.casino_rooms%rowtype; j igr_casino_private.casino_journal%rowtype;
begin
  select * into r from igr_casino_private.casino_rooms where id=p_id for update;
  if not found then raise exception 'room_not_found'; end if;
  select * into j from igr_casino_private.casino_journal where room_id=p_id and request_id=p_request_id;
  if found then
    if j.actor_id<>p_actor or j.fingerprint<>p_fingerprint then raise exception 'idempotency_key_conflict'; end if;
    return public.igr_casino_storage_read(p_id,null) || '{"replayed":true}'::jsonb;
  end if;
  if r.revision<>p_expected_revision then raise exception 'revision_conflict'; end if;
  if jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>2000000
    or (p_state->>'revision')::bigint<>r.revision+1 then raise exception 'invalid_snapshot'; end if;
  if r.revision>=10000 then raise exception 'campaign_action_limit'; end if;
  insert into igr_casino_private.casino_journal(room_id,request_id,actor_id,fingerprint,revision,command)
    values(p_id,p_request_id,p_actor,p_fingerprint,r.revision+1,p_command);
  update igr_casino_private.casino_rooms set state=p_state,revision=revision+1,updated_at=now() where id=p_id;
  return public.igr_casino_storage_read(p_id,null) || '{"replayed":false}'::jsonb;
end $$;
create or replace function public.igr_casino_storage_receipt(p_id uuid,p_request_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('actor',actor_id,'fingerprint',fingerprint,'revision',revision)
  from igr_casino_private.casino_journal where room_id=p_id and request_id=p_request_id
$$;
create or replace function public.igr_casino_approved_releases()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'variant',variant,'revision',revision,'content',content)), '[]'::jsonb)
  from (select distinct on (variant) * from igr_casino_private.casino_releases
    where status='approved' order by variant,revision desc) r
$$;
revoke all on function public.igr_casino_storage_read(uuid,text) from public,anon,authenticated;
revoke all on function public.igr_casino_storage_create(uuid,text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.igr_casino_storage_commit(uuid,bigint,uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.igr_casino_storage_receipt(uuid,uuid) from public,anon,authenticated;
revoke all on function public.igr_casino_approved_releases() from public,anon,authenticated;
grant execute on function public.igr_casino_storage_read(uuid,text) to service_role;
grant execute on function public.igr_casino_storage_create(uuid,text,uuid,text,jsonb) to service_role;
grant execute on function public.igr_casino_storage_commit(uuid,bigint,uuid,text,text,jsonb,jsonb) to service_role;
grant execute on function public.igr_casino_storage_receipt(uuid,uuid) to service_role;
grant execute on function public.igr_casino_approved_releases() to service_role;
