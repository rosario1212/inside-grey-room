-- Banc de test PostgreSQL local, destiné UNIQUEMENT au service postgres CI.
-- Schéma minimal de compatibilité, sans importer aucune donnée de production.
create extension if not exists pgcrypto;
create role anon nologin;
create role authenticated nologin;
create schema if not exists igr_private;
create table public.igr_v4_rooms(
 code text primary key,scenario_id text,status text,cycle int,phase text,
 state jsonb default '{}'::jsonb,created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create table public.igr_v4_players(
 id uuid primary key default gen_random_uuid(), room_code text, pseudo text,
 seat_index int, public_role text,secret_role text,preferred_role text,
 internal_slot int,player_token uuid default gen_random_uuid(),
 private_state jsonb default '{}'::jsonb
);
create table public.igr_v4_actions(
 id bigserial primary key, room_code text, player_id uuid, cycle integer,
 action_type text,payload jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
create table public.igr_v4_events(
 id bigserial primary key, room_code text,cycle integer,
 event_type text,visibility text default 'public',
 target_player_id uuid,payload jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
create table public.igr_v4_scenario_packs(
 scenario_id text primary key,pack jsonb
);
create table public.igr_omerta_room_campaigns(room_code text,campaign_id uuid);
create table public.igr_omerta_campaigns(
 id uuid primary key,state jsonb default '{}'::jsonb,status text,
 updated_at timestamptz default now()
);
alter table public.igr_v4_actions enable row level security;
alter table public.igr_v4_events enable row level security;
revoke all on public.igr_v4_actions,public.igr_v4_events from public,anon,authenticated;
create function igr_private.rate_limit(text,text,integer,integer) returns void language plpgsql as
$limit$ begin return; end $limit$;
create function public.igr_v4_make_reveal(p_room text) returns jsonb language sql as
$stub$ select jsonb_build_object('results',coalesce(jsonb_agg(jsonb_build_object(
'player_id',p.id,'success',false,'text','')), '[]'::jsonb))
from public.igr_v4_players p where p.room_code=p_room $stub$;
insert into public.igr_v4_scenario_packs(scenario_id,pack)
select lpad(n::text,3,'0'),
 jsonb_build_object('suspects',jsonb_build_array(
 jsonb_build_object('place','Profil A','hide',
 case when n=21 then 'Le cercle Rinaldi doit recevoir une part du paiement.'
 else 'Secret matériel concernant un membre de la Famiglia.' end,
 'chronology','Une réunion a eu lieu avant les faits.',
 'anchors',jsonb_build_array('La chronologie est authentifiée.'),
 'negotiable_facts',jsonb_build_array('Le paiement','Le lieu'),
 'base_sentence',9),
 jsonb_build_object('place','Profil B','hide','Aucune preuve personnelle.',
 'chronology','Une seconde réunion a eu lieu.',
 'anchors',jsonb_build_array('Un événement vérifiable.'),
 'negotiable_facts',jsonb_build_array('Une discussion'),
 'base_sentence',9)))
from generate_series(21,25) n;
