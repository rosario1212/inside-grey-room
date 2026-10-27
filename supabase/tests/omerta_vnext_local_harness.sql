-- Banc de test PostgreSQL local, destiné UNIQUEMENT au service postgres CI.
-- Schéma minimal de compatibilité, sans importer aucune donnée de production.
create extension if not exists pgcrypto;
create role anon nologin;
create role authenticated nologin;
create schema if not exists igr_private;
create table public.igr_v4_rooms(
 code text primary key,scenario_id text,status text,cycle int,phase text,
 state jsonb default '{}'::jsonb,host_token uuid default gen_random_uuid(),created_at timestamptz default now(),
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

-- Fake legacy starter used ONLY by disposable CI PostgreSQL to exercise the
-- transactional contract of the new opt-in starter (not a production source).
create function public.igr_omerta_start_game(p_code text,p_host_token uuid)
returns jsonb language plpgsql security definer set search_path=''
as $old_start$
declare r public.igr_v4_rooms%rowtype; n integer;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_code)) and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if;
 if r.status<>'lobby' then raise exception 'already_started';end if;
 select count(*) into n from public.igr_v4_players where room_code=r.code;
 if n not between 4 and 8 then raise exception 'invalid_party';end if;
 update public.igr_v4_rooms set status='playing',cycle=0,phase='briefing'
 where code=r.code;
 insert into public.igr_v4_events(room_code,cycle,event_type,visibility,payload)
 values(r.code,0,'context','public',
   '{"title":"Old context","text":"LEGACY STORY MUST BE REPLACED"}'::jsonb);
 return '{"ok":true,"auto_assigned_roles":0}'::jsonb;
end;
$old_start$;

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


-- Fake sync to emulate dangerous old Verri metadata in a disposable database.
-- Real Supabase sync already filters visibility by participant; this stub
-- reproduces that property. It is NEVER applied to production.
create function public.igr_v4_sync(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path=''
as $mock_sync$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype;
 events_json jsonb;
begin
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'event_type',e.event_type,
   'payload',e.payload,'visibility',e.visibility,
   'target_player_id',e.target_player_id) order by e.id),'[]'::jsonb)
 into events_json from public.igr_v4_events e
 where e.room_code=r.code
   and (e.visibility='public' or e.target_player_id=p.id);
 return jsonb_build_object(
  'server_now',clock_timestamp(),
  'room',jsonb_build_object('code',r.code,'status',r.status,
     'scenario_id',r.scenario_id,'cycle',r.cycle,'phase',r.phase,
     'state',r.state),
  'player',jsonb_build_object('id',p.id,'public_role',p.public_role,
      'private_state',p.private_state||jsonb_build_object('legacy_private','LEGACY VERRI HIDDEN ROLE')),
  'events',events_json,'my_actions','[]'::jsonb,
  'scenario',jsonb_build_object(
    'context','LEGACY VERRI PRIVATE CAMPAIGN',
    'truth','LEGACY VERRI HIDDEN FINAL',
    'trames',jsonb_build_array('LEGACY VERRI TRAME'))
 );
end;
$mock_sync$;
