-- Inside Grey Room v14 — one-time HÉRITAGE playtest invite codes
-- Extends the existing DLC invite infrastructure without changing store billing.

alter table public.igr_dlc_invites
  drop constraint if exists igr_dlc_invites_dlc_key_check;

alter table public.igr_dlc_invites
  add constraint igr_dlc_invites_dlc_key_check
  check (dlc_key in ('terror','cartel','regime','heritage'));

create or replace function public.igr_dlc_create_invite(
  p_owner_id uuid,
  p_owner_token text,
  p_dlc_key text,
  p_days integer default 7
)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
declare code text; h text; exp timestamptz; prefix text;
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  if not exists(
    select 1 from public.igr_dlc_entitlements e
    where e.profile_id=p_owner_id and e.dlc_key=p_dlc_key and e.access_level='owner'
      and e.status='active' and (e.expires_at is null or e.expires_at>now())
  ) then raise exception 'owner_required'; end if;

  perform igr_private.rate_limit('dlc_invite:'||p_dlc_key,p_owner_id::text,30,3600);
  p_days:=greatest(0,least(coalesce(p_days,7),90));
  prefix:=case p_dlc_key
    when 'terror' then 'TER'
    when 'cartel' then 'CAR'
    when 'regime' then 'REG'
    when 'heritage' then 'HER'
  end;
  code:=prefix||'-'||upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,4))||'-'||
                  upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,4))||'-'||
                  upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,4))||'-'||
                  upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,4));
  h:=encode(extensions.digest(code,'sha256'),'hex');
  exp:=case when p_days=0 then null else now()+make_interval(days=>p_days) end;

  insert into public.igr_dlc_invites(code_hash,dlc_key,created_by,max_uses,use_count,expires_at)
  values(h,p_dlc_key,p_owner_id,1,0,exp);

  return jsonb_build_object('ok',true,'code',code,'dlc_key',p_dlc_key,'expires_at',exp);
end
$$;

create or replace function public.igr_dlc_redeem_invite(
  p_profile_id uuid,
  p_profile_token text,
  p_code text,
  p_dlc_key text
)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
declare h text; i public.igr_dlc_invites%rowtype; current_level text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  perform igr_private.rate_limit('dlc_redeem:'||p_dlc_key,p_profile_id::text,12,3600);

  h:=encode(extensions.digest(upper(trim(coalesce(p_code,''))),'sha256'),'hex');
  select * into i from public.igr_dlc_invites where code_hash=h for update;
  if not found or i.revoked_at is not null or (i.expires_at is not null and i.expires_at<=now()) or i.use_count>=i.max_uses then raise exception 'invalid_invite'; end if;
  if i.dlc_key<>p_dlc_key then raise exception 'wrong_dlc'; end if;

  update public.igr_dlc_invites set use_count=use_count+1 where id=i.id;
  select access_level into current_level from public.igr_dlc_entitlements where profile_id=p_profile_id and dlc_key=p_dlc_key;

  insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level,status,granted_by,expires_at,updated_at)
  values(p_profile_id,p_dlc_key,'tester','active',i.created_by,i.expires_at,now())
  on conflict(profile_id,dlc_key) do update set
    access_level=case when public.igr_dlc_entitlements.access_level in ('owner','purchased') then public.igr_dlc_entitlements.access_level else 'tester' end,
    status='active',
    granted_by=case when public.igr_dlc_entitlements.access_level in ('owner','purchased') then public.igr_dlc_entitlements.granted_by else i.created_by end,
    expires_at=case when public.igr_dlc_entitlements.access_level in ('owner','purchased') then public.igr_dlc_entitlements.expires_at else i.expires_at end,
    updated_at=now();

  return jsonb_build_object(
    'ok',true,
    'active',true,
    'level',case when current_level in ('owner','purchased') then current_level else 'tester' end,
    'dlc_key',p_dlc_key,
    'expires_at',i.expires_at
  );
end
$$;

create or replace function public.igr_dlc_list_access(
  p_owner_id uuid,
  p_owner_token text,
  p_dlc_key text
)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  if not exists(
    select 1 from public.igr_dlc_entitlements e
    where e.profile_id=p_owner_id and e.dlc_key=p_dlc_key and e.access_level='owner'
      and e.status='active' and (e.expires_at is null or e.expires_at>now())
  ) then raise exception 'owner_required'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'profile_id',e.profile_id,'pseudo',p.pseudo,'friend_code',p.friend_code,
      'access_level',e.access_level,'status',e.status,'expires_at',e.expires_at,'granted_at',e.granted_at
    ) order by case e.access_level when 'owner' then 0 when 'purchased' then 1 else 2 end,p.pseudo)
    from public.igr_dlc_entitlements e
    join public.igr_social_profiles p on p.id=e.profile_id
    where e.dlc_key=p_dlc_key and e.status='active' and (e.expires_at is null or e.expires_at>now())
  ),'[]'::jsonb);
end
$$;

create or replace function public.igr_dlc_revoke_access(
  p_owner_id uuid,
  p_owner_token text,
  p_target_profile_id uuid,
  p_dlc_key text
)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.igr_omerta_auth_profile(p_owner_id,p_owner_token);
  if p_dlc_key not in ('terror','cartel','regime','heritage') then raise exception 'invalid_dlc_key'; end if;
  if not exists(
    select 1 from public.igr_dlc_entitlements
    where profile_id=p_owner_id and dlc_key=p_dlc_key and access_level='owner'
      and status='active' and (expires_at is null or expires_at>now())
  ) then raise exception 'owner_required'; end if;
  if exists(select 1 from public.igr_dlc_entitlements where profile_id=p_target_profile_id and dlc_key=p_dlc_key and access_level='owner') then raise exception 'cannot_revoke_owner'; end if;

  update public.igr_dlc_entitlements
  set status='revoked',updated_at=now()
  where profile_id=p_target_profile_id and dlc_key=p_dlc_key;

  return jsonb_build_object('ok',true);
end
$$;

revoke all on function public.igr_dlc_create_invite(uuid,text,text,integer) from public;
revoke all on function public.igr_dlc_redeem_invite(uuid,text,text,text) from public;
revoke all on function public.igr_dlc_list_access(uuid,text,text) from public;
revoke all on function public.igr_dlc_revoke_access(uuid,text,uuid,text) from public;

grant execute on function public.igr_dlc_create_invite(uuid,text,text,integer) to anon, authenticated;
grant execute on function public.igr_dlc_redeem_invite(uuid,text,text,text) to anon, authenticated;
grant execute on function public.igr_dlc_list_access(uuid,text,text) to anon, authenticated;
grant execute on function public.igr_dlc_revoke_access(uuid,text,uuid,text) to anon, authenticated;
