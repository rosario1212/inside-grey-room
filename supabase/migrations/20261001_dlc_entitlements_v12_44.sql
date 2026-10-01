-- Inside Grey Room v12.44 — per-player DLC ownership for TERREUR / CARTEL / LE RÉGIME

create table if not exists public.igr_dlc_entitlements (
  profile_id uuid not null references public.igr_social_profiles(id) on delete cascade,
  dlc_key text not null check (dlc_key in ('terror','cartel','regime')),
  access_level text not null check (access_level in ('owner','tester','purchased')),
  status text not null default 'active' check (status in ('active','revoked')),
  granted_by uuid null references public.igr_social_profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, dlc_key)
);

alter table public.igr_dlc_entitlements enable row level security;
revoke all on table public.igr_dlc_entitlements from public, anon, authenticated;

insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level,status,granted_by,expires_at)
select e.profile_id, d.dlc_key, 'owner', 'active', e.profile_id, null
from public.igr_omerta_entitlements e
cross join (values ('terror'),('cartel'),('regime')) as d(dlc_key)
where e.access_level='owner' and e.status='active' and (e.expires_at is null or e.expires_at>now())
on conflict (profile_id,dlc_key) do update set
  access_level=excluded.access_level,status='active',expires_at=null,updated_at=now();

create or replace function public.igr_dlc_key_for_scenario(p_scenario text)
returns text language sql immutable set search_path to 'public' as $$
  select case
    when p_scenario between '021' and '025' then 'omerta'
    when p_scenario between '026' and '028' then 'terror'
    when p_scenario between '029' and '031' then 'cartel'
    when p_scenario between '032' and '034' then 'regime'
    else null end
$$;

create or replace function public.igr_dlc_has_access(p_profile_id uuid, p_dlc_key text)
returns boolean language plpgsql stable security definer set search_path to 'public' as $$
begin
  if p_dlc_key='omerta' then return public.igr_omerta_has_access(p_profile_id); end if;
  if p_dlc_key not in ('terror','cartel','regime') then return false; end if;
  return exists(select 1 from public.igr_dlc_entitlements e where e.profile_id=p_profile_id and e.dlc_key=p_dlc_key and e.status='active' and (e.expires_at is null or e.expires_at>now()));
end
$$;

create or replace function public.igr_dlc_access_status(p_profile_id uuid, p_profile_token text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare o public.igr_omerta_entitlements%rowtype; result jsonb:='{}'::jsonb; k text; e public.igr_dlc_entitlements%rowtype;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  select * into o from public.igr_omerta_entitlements where profile_id=p_profile_id;
  result:=result||jsonb_build_object('omerta',jsonb_build_object('active',found and o.status='active' and (o.expires_at is null or o.expires_at>now()),'level',case when found then o.access_level else 'none' end,'expires_at',case when found then o.expires_at else null end));
  foreach k in array array['terror','cartel','regime'] loop
    select * into e from public.igr_dlc_entitlements where profile_id=p_profile_id and dlc_key=k;
    result:=result||jsonb_build_object(k,jsonb_build_object('active',found and e.status='active' and (e.expires_at is null or e.expires_at>now()),'level',case when found then e.access_level else 'none' end,'expires_at',case when found then e.expires_at else null end));
  end loop;
  return result;
end
$$;

create or replace function public.igr_dlc_profile_access(p_profile_id uuid,p_profile_token text,p_target_profile_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not exists(select 1 from public.igr_social_profiles where id=p_target_profile_id) then raise exception 'profile_not_found'; end if;
  return jsonb_build_object('omerta',public.igr_dlc_has_access(p_target_profile_id,'omerta'),'terror',public.igr_dlc_has_access(p_target_profile_id,'terror'),'cartel',public.igr_dlc_has_access(p_target_profile_id,'cartel'),'regime',public.igr_dlc_has_access(p_target_profile_id,'regime'));
end
$$;

create or replace function public.igr_dlc_room_player_access(p_code text,p_player_token uuid,p_target_player_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare target_profile uuid;
begin
  if not exists(select 1 from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token) then raise exception 'invalid_room_session'; end if;
  select profile_id into target_profile from public.igr_v4_players where room_code=upper(trim(p_code)) and id=p_target_player_id;
  if target_profile is null then return jsonb_build_object('omerta',false,'terror',false,'cartel',false,'regime',false); end if;
  return jsonb_build_object('omerta',public.igr_dlc_has_access(target_profile,'omerta'),'terror',public.igr_dlc_has_access(target_profile,'terror'),'cartel',public.igr_dlc_has_access(target_profile,'cartel'),'regime',public.igr_dlc_has_access(target_profile,'regime'));
end
$$;

create or replace function public.igr_dlc_create_room(p_code text,p_scenario_id text,p_pseudo text,p_profile_id uuid,p_profile_token text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; v_pseudo text; v_key text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  v_key:=public.igr_dlc_key_for_scenario(p_scenario_id);
  if v_key not in ('terror','cartel','regime') then raise exception 'invalid_dlc_scenario'; end if;
  if not public.igr_dlc_has_access(p_profile_id,v_key) then raise exception 'dlc_locked:%',v_key; end if;
  perform igr_private.rate_limit('create_room_global','global',120,60);
  perform igr_private.rate_limit('create_room_code',upper(trim(p_code)),4,300);
  perform public.igr_v4_cleanup();
  if upper(trim(p_code))!~'^[A-Z2-9]{5}$' then raise exception 'invalid room code'; end if;
  if not exists(select 1 from public.igr_v4_scenario_packs where scenario_id=p_scenario_id) then raise exception 'invalid scenario'; end if;
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.assert_ugc(v_pseudo,22,false);
  insert into public.igr_v4_rooms(code,scenario_id) values(upper(trim(p_code)),p_scenario_id) returning * into r;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,profile_id) values(r.code,v_pseudo,0,true,p_profile_id) returning * into p;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'room_created',jsonb_build_object('title','CELLULE DLC OUVERTE','text','Accès DLC vérifié.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'host_token',r.host_token,'dlc_key',v_key);
end
$$;

create or replace function public.igr_dlc_join_room(p_code text,p_pseudo text,p_profile_id uuid,p_profile_token text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; c int; s int; v_pseudo text; v_code text; v_key text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  v_code:=upper(trim(p_code));v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.rate_limit('join_room_global','global',600,60);perform igr_private.rate_limit('join_room_code',v_code,80,60);perform igr_private.rate_limit('join_room_identity',v_code||':'||lower(v_pseudo),10,300);perform igr_private.assert_ugc(v_pseudo,22,false);
  select * into r from public.igr_v4_rooms where code=v_code for update;if not found then raise exception 'room not found'; end if;
  v_key:=public.igr_dlc_key_for_scenario(r.scenario_id);if v_key is null then raise exception 'not_premium_room'; end if;
  if not public.igr_dlc_has_access(p_profile_id,v_key) then raise exception 'dlc_locked:%',v_key; end if;
  if r.status<>'lobby' then raise exception 'already started'; end if;
  select count(*),coalesce(max(seat_index),-1)+1 into c,s from public.igr_v4_players where room_code=r.code;
  if c>=public.igr_v4_max_players(r.scenario_id) then raise exception 'room full'; end if;
  if exists(select 1 from public.igr_v4_players where room_code=r.code and lower(pseudo)=lower(v_pseudo)) then raise exception 'pseudo already used'; end if;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,profile_id) values(r.code,v_pseudo,s,p_profile_id) returning * into p;
  update public.igr_v4_rooms set updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'player_joined',jsonb_build_object('title','ARRIVÉE','text',p.pseudo||' a rejoint la cellule.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'dlc_key',v_key);
end
$$;

create or replace function public.igr_v4_join_room(p_code text,p_pseudo text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; c int; s int; v_pseudo text; v_code text;
begin
  v_code:=upper(trim(p_code));v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.rate_limit('join_room_global','global',600,60);perform igr_private.rate_limit('join_room_code',v_code,80,60);perform igr_private.rate_limit('join_room_identity',v_code||':'||lower(v_pseudo),10,300);perform igr_private.assert_ugc(v_pseudo,22,false);
  select * into r from public.igr_v4_rooms where code=v_code for update;if not found then raise exception 'room not found'; end if;
  if public.igr_dlc_key_for_scenario(r.scenario_id) is not null then raise exception 'premium access required'; end if;
  if r.status<>'lobby' then raise exception 'already started'; end if;
  select count(*),coalesce(max(seat_index),-1)+1 into c,s from public.igr_v4_players where room_code=r.code;
  if c>=public.igr_v4_max_players(r.scenario_id) then raise exception 'room full'; end if;
  if exists(select 1 from public.igr_v4_players where room_code=r.code and lower(pseudo)=lower(v_pseudo)) then raise exception 'pseudo already used'; end if;
  insert into public.igr_v4_players(room_code,pseudo,seat_index) values(r.code,v_pseudo,s) returning * into p;
  update public.igr_v4_rooms set updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'player_joined',jsonb_build_object('title','ARRIVÉE','text',p.pseudo||' a rejoint la cellule.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token);
end
$$;

create or replace function public.igr_dlc_grant_access(p_owner_id uuid,p_owner_token text,p_target_profile_id uuid,p_dlc_key text,p_access_level text default 'tester',p_days integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare exp timestamptz;
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if not exists(select 1 from public.igr_omerta_entitlements where profile_id=p_owner_id and access_level='owner' and status='active' and (expires_at is null or expires_at>now())) then raise exception 'owner_required'; end if;
  if p_dlc_key not in ('terror','cartel','regime') then raise exception 'invalid_dlc_key'; end if;
  if p_access_level not in ('tester','purchased','owner') then raise exception 'invalid_access_level'; end if;
  if not exists(select 1 from public.igr_social_profiles where id=p_target_profile_id) then raise exception 'profile_not_found'; end if;
  exp:=case when p_days is null then null else now()+make_interval(days=>greatest(1,least(p_days,3650))) end;
  insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level,status,granted_by,expires_at) values(p_target_profile_id,p_dlc_key,p_access_level,'active',p_owner_id,exp)
  on conflict(profile_id,dlc_key) do update set access_level=excluded.access_level,status='active',granted_by=p_owner_id,expires_at=exp,updated_at=now();
  return jsonb_build_object('ok',true,'dlc_key',p_dlc_key,'profile_id',p_target_profile_id,'expires_at',exp);
end
$$;

create or replace function public.igr_dlc_revoke_access(p_owner_id uuid,p_owner_token text,p_target_profile_id uuid,p_dlc_key text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if not exists(select 1 from public.igr_omerta_entitlements where profile_id=p_owner_id and access_level='owner' and status='active' and (expires_at is null or expires_at>now())) then raise exception 'owner_required'; end if;
  update public.igr_dlc_entitlements set status='revoked',updated_at=now() where profile_id=p_target_profile_id and dlc_key=p_dlc_key;
  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_dlc_key_for_scenario(text) from public;
revoke all on function public.igr_dlc_has_access(uuid,text) from public;
revoke all on function public.igr_dlc_access_status(uuid,text) from public;
revoke all on function public.igr_dlc_profile_access(uuid,text,uuid) from public;
revoke all on function public.igr_dlc_room_player_access(text,uuid,uuid) from public;
revoke all on function public.igr_dlc_create_room(text,text,text,uuid,text) from public;
revoke all on function public.igr_dlc_join_room(text,text,uuid,text) from public;
revoke all on function public.igr_dlc_grant_access(uuid,text,uuid,text,text,integer) from public;
revoke all on function public.igr_dlc_revoke_access(uuid,text,uuid,text) from public;

grant execute on function public.igr_dlc_access_status(uuid,text) to anon, authenticated;
grant execute on function public.igr_dlc_profile_access(uuid,text,uuid) to anon, authenticated;
grant execute on function public.igr_dlc_room_player_access(text,uuid,uuid) to anon, authenticated;
grant execute on function public.igr_dlc_create_room(text,text,text,uuid,text) to anon, authenticated;
grant execute on function public.igr_dlc_join_room(text,text,uuid,text) to anon, authenticated;
grant execute on function public.igr_dlc_grant_access(uuid,text,uuid,text,text,integer) to anon, authenticated;
grant execute on function public.igr_dlc_revoke_access(uuid,text,uuid,text) to anon, authenticated;
