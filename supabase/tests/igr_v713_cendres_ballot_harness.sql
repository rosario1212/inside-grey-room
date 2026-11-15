-- Disposable PostgreSQL 16 fixture. Never run in the real Supabase project.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;

create table public.igr_heritage_online_rooms(
  code text primary key,
  campaign_id text not null,
  chapter integer not null default 3,
  host_token uuid not null default gen_random_uuid(),
  status text not null default 'playing',
  stage text not null default 'decision',
  decision_id text,
  updated_at timestamptz not null default now()
);

create table public.igr_heritage_online_players(
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.igr_heritage_online_rooms(code) on delete cascade,
  pseudo text not null,
  seat_index integer not null,
  role_id text,
  is_host boolean not null default false,
  player_token uuid not null default gen_random_uuid()
);

create function public.igr_heritage_online_decisions(p_campaign text,p_chapter integer)
returns text[] language sql immutable as $$
 select case when p_campaign='cendres' and p_chapter=3
   then array['b','source','audio']::text[]
   when p_campaign='kuroi' then array['police_hand','arakida','internal']::text[]
   else array[]::text[] end
$$;
