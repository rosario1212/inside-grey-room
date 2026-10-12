-- HÉRITAGE v71: chapter-specific MAÎTRE authority + mandatory strategy gate.
-- New versioned RPCs are additive so the currently deployed runtime keeps using v55 safely.

create or replace function public.igr_heritage_online_decide_v71(
  p_code text,
  p_player_token uuid,
  p_option_id text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_allowed text[];
  v_owner_role text;
  v_has_owner boolean;
begin
  p_code:=upper(trim(coalesce(p_code,'')));

  select * into v_player
  from public.igr_heritage_online_players
  where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into v_room
  from public.igr_heritage_online_rooms
  where code=p_code
  for update;
  if not found then raise exception 'room not found'; end if;
  if v_room.campaign_id<>'maitre' then raise exception 'maitre only'; end if;
  if v_room.stage<>'decision' then raise exception 'wrong stage'; end if;

  v_owner_role:=case
    when v_room.chapter in (1,4) then 'juge'
    when v_room.chapter=2 then 'client'
    when v_room.chapter in (3,5) then 'avocat'
    else null
  end;
  if v_owner_role is null then raise exception 'invalid chapter'; end if;

  select exists(
    select 1 from public.igr_heritage_online_players
    where room_code=p_code and role_id=v_owner_role
  ) into v_has_owner;

  if v_has_owner and v_player.role_id<>v_owner_role then
    raise exception 'decision owner only';
  end if;
  if not v_has_owner and not v_player.is_host then
    raise exception 'host fallback only';
  end if;

  v_allowed:=public.igr_heritage_online_decisions(v_room.campaign_id,v_room.chapter);
  if not (trim(coalesce(p_option_id,''))=any(v_allowed)) then
    raise exception 'invalid option';
  end if;

  update public.igr_heritage_online_rooms
  set decision_id=trim(p_option_id),stage='reveal',updated_at=now()
  where code=p_code;

  return jsonb_build_object('ok',true,'decision_id',trim(p_option_id),'owner_role',v_owner_role);
end
$function$;

revoke all on function public.igr_heritage_online_decide_v71(text,uuid,text) from public;
grant execute on function public.igr_heritage_online_decide_v71(text,uuid,text) to anon, authenticated;

create or replace function public.igr_heritage_online_advance_v71(
  p_code text,
  p_host_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_last integer;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room
  from public.igr_heritage_online_rooms
  where code=p_code and host_token=p_host_token
  for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.stage<>'play' then raise exception 'wrong stage'; end if;

  if v_room.campaign_id='maitre'
     and v_room.phase_index=1
     and nullif(trim(coalesce(v_room.maitre_angle,'')),'') is null then
    raise exception 'maitre angle required';
  end if;

  v_last:=case when v_room.campaign_id='maitre' then 2 else 3 end;
  if v_room.phase_index<v_last then
    update public.igr_heritage_online_rooms
    set phase_index=phase_index+1,updated_at=now()
    where code=p_code;
  else
    update public.igr_heritage_online_rooms
    set stage='decision',updated_at=now()
    where code=p_code;
  end if;

  return jsonb_build_object('ok',true);
end
$function$;

revoke all on function public.igr_heritage_online_advance_v71(text,uuid) from public;
grant execute on function public.igr_heritage_online_advance_v71(text,uuid) to anon, authenticated;
