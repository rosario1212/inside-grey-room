-- Inside Grey Room v13.6 — HÉRITAGE premium entitlement
-- Adds a dedicated entitlement key without changing existing DLC ownership.

alter table public.igr_dlc_entitlements
  drop constraint if exists igr_dlc_entitlements_dlc_key_check;

alter table public.igr_dlc_entitlements
  add constraint igr_dlc_entitlements_dlc_key_check
  check (dlc_key in ('terror','cartel','regime','heritage'));

-- Preserve creator access: existing OMERTÀ owners receive HÉRITAGE owner access.
insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level,status,granted_by,expires_at)
select profile_id,'heritage','owner','active',profile_id,null
from public.igr_omerta_entitlements
where access_level='owner' and status='active' and (expires_at is null or expires_at>now())
on conflict (profile_id,dlc_key) do update set
  access_level='owner',status='active',granted_by=excluded.profile_id,expires_at=null,updated_at=now();

create or replace function public.igr_dlc_has_access(p_profile_id uuid, p_dlc_key text)
returns boolean
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if p_dlc_key='omerta' then
    return public.igr_omerta_has_access(p_profile_id);
  end if;
  if p_dlc_key not in ('terror','cartel','regime','heritage') then return false; end if;
  return exists(
    select 1 from public.igr_dlc_entitlements e
    where e.profile_id=p_profile_id and e.dlc_key=p_dlc_key
      and e.status='active' and (e.expires_at is null or e.expires_at>now())
  );
end
$$;

create or replace function public.igr_dlc_access_status(p_profile_id uuid, p_profile_token text)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  o public.igr_omerta_entitlements%rowtype;
  result jsonb := '{}'::jsonb;
  k text;
  e public.igr_dlc_entitlements%rowtype;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);

  select * into o from public.igr_omerta_entitlements where profile_id=p_profile_id;
  result := result || jsonb_build_object('omerta', jsonb_build_object(
    'active', found and o.status='active' and (o.expires_at is null or o.expires_at>now()),
    'level', case when found then o.access_level else 'none' end,
    'expires_at', case when found then o.expires_at else null end
  ));

  foreach k in array array['terror','cartel','regime','heritage'] loop
    select * into e from public.igr_dlc_entitlements where profile_id=p_profile_id and dlc_key=k;
    result := result || jsonb_build_object(k, jsonb_build_object(
      'active', found and e.status='active' and (e.expires_at is null or e.expires_at>now()),
      'level', case when found then e.access_level else 'none' end,
      'expires_at', case when found then e.expires_at else null end
    ));
  end loop;
  return result;
end
$$;

create or replace function public.igr_dlc_profile_access(p_profile_id uuid,p_profile_token text,p_target_profile_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not exists(select 1 from public.igr_social_profiles where id=p_target_profile_id) then raise exception 'profile_not_found'; end if;
  return jsonb_build_object(
    'omerta',public.igr_dlc_has_access(p_target_profile_id,'omerta'),
    'terror',public.igr_dlc_has_access(p_target_profile_id,'terror'),
    'cartel',public.igr_dlc_has_access(p_target_profile_id,'cartel'),
    'regime',public.igr_dlc_has_access(p_target_profile_id,'regime'),
    'heritage',public.igr_dlc_has_access(p_target_profile_id,'heritage')
  );
end
$$;

create or replace function public.igr_dlc_room_player_access(p_code text,p_player_token uuid,p_target_player_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare target_profile uuid;
begin
  if not exists(select 1 from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token) then raise exception 'invalid_room_session'; end if;
  select profile_id into target_profile from public.igr_v4_players where room_code=upper(trim(p_code)) and id=p_target_player_id;
  if target_profile is null then return jsonb_build_object('omerta',false,'terror',false,'cartel',false,'regime',false,'heritage',false); end if;
  return jsonb_build_object(
    'omerta',public.igr_dlc_has_access(target_profile,'omerta'),
    'terror',public.igr_dlc_has_access(target_profile,'terror'),
    'cartel',public.igr_dlc_has_access(target_profile,'cartel'),
    'regime',public.igr_dlc_has_access(target_profile,'regime'),
    'heritage',public.igr_dlc_has_access(target_profile,'heritage')
  );
end
$$;

create or replace function public.igr_dlc_grant_access(p_owner_id uuid,p_owner_token text,p_target_profile_id uuid,p_dlc_key text,p_access_level text default 'tester',p_days integer default null)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare exp timestamptz;
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if not exists(
    select 1 from public.igr_omerta_entitlements
    where profile_id=p_owner_id and access_level='owner' and status='active'
      and (expires_at is null or expires_at>now())
  ) then raise exception 'owner_required'; end if;
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  if p_access_level not in ('tester','purchased','owner') then raise exception 'invalid_access_level'; end if;
  if not exists(select 1 from public.igr_social_profiles where id=p_target_profile_id) then raise exception 'profile_not_found'; end if;
  exp:=case when p_days is null then null else now()+make_interval(days=>greatest(1,least(p_days,3650))) end;
  insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level,status,granted_by,expires_at)
  values(p_target_profile_id,p_dlc_key,p_access_level,'active',p_owner_id,exp)
  on conflict(profile_id,dlc_key) do update set access_level=excluded.access_level,status='active',granted_by=p_owner_id,expires_at=exp,updated_at=now();
  return jsonb_build_object('ok',true,'dlc_key',p_dlc_key,'profile_id',p_target_profile_id,'expires_at',exp);
end
$$;

create or replace function public.igr_dlc_revoke_access(p_owner_id uuid,p_owner_token text,p_target_profile_id uuid,p_dlc_key text)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  if not exists(
    select 1 from public.igr_omerta_entitlements
    where profile_id=p_owner_id and access_level='owner' and status='active'
      and (expires_at is null or expires_at>now())
  ) then raise exception 'owner_required'; end if;
  if exists(select 1 from public.igr_dlc_entitlements where profile_id=p_target_profile_id and dlc_key=p_dlc_key and access_level='owner') then raise exception 'cannot_revoke_owner'; end if;
  update public.igr_dlc_entitlements set status='revoked',updated_at=now() where profile_id=p_target_profile_id and dlc_key=p_dlc_key;
  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_dlc_has_access(uuid,text) from public;
revoke all on function public.igr_dlc_access_status(uuid,text) from public;
revoke all on function public.igr_dlc_profile_access(uuid,text,uuid) from public;
revoke all on function public.igr_dlc_room_player_access(text,uuid,uuid) from public;
revoke all on function public.igr_dlc_grant_access(uuid,text,uuid,text,text,integer) from public;
revoke all on function public.igr_dlc_revoke_access(uuid,text,uuid,text) from public;

grant execute on function public.igr_dlc_access_status(uuid,text) to anon, authenticated;
grant execute on function public.igr_dlc_profile_access(uuid,text,uuid) to anon, authenticated;
grant execute on function public.igr_dlc_room_player_access(text,uuid,uuid) to anon, authenticated;
grant execute on function public.igr_dlc_grant_access(uuid,text,uuid,text,text,integer) to anon, authenticated;
grant execute on function public.igr_dlc_revoke_access(uuid,text,uuid,text) to anon, authenticated;
