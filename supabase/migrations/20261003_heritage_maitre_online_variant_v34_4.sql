-- Inside Grey Room v34.4 — MAÎTRE online canonical variant
-- The campaign owner chooses the campaign's already-persisted canon once.
-- The server stores it for the room, but only roles entitled to variant-specific
-- private intel receive the variant identifier through sync.

alter table public.igr_heritage_online_rooms
  add column if not exists maitre_variant text;

alter table public.igr_heritage_online_rooms
  drop constraint if exists igr_heritage_online_rooms_maitre_variant_check;

alter table public.igr_heritage_online_rooms
  add constraint igr_heritage_online_rooms_maitre_variant_check
  check (maitre_variant is null or maitre_variant in ('fiscal','blind','link'));

create or replace function public.igr_heritage_online_create_maitre(
  p_code text,
  p_chapter integer,
  p_pseudo text,
  p_profile_id uuid,
  p_profile_token text,
  p_variant text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_pseudo text;
  v_variant text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not public.igr_dlc_has_access(p_profile_id,'heritage') then raise exception 'premium access required'; end if;
  if p_chapter not between 1 and 5 then raise exception 'invalid chapter'; end if;
  v_variant:=lower(trim(coalesce(p_variant,'')));
  if v_variant not in ('fiscal','blind','link') then raise exception 'invalid maitre variant'; end if;
  p_code:=upper(trim(coalesce(p_code,'')));
  if p_code!~'^H[A-Z2-9]{4}$' then raise exception 'invalid room code'; end if;
  if exists(select 1 from public.igr_v4_rooms where code=p_code) then raise exception 'code collision'; end if;
  delete from public.igr_heritage_online_rooms where updated_at<now()-interval '12 hours';
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.assert_ugc(v_pseudo,22,false);

  insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,owner_profile_id,maitre_variant)
  values(p_code,'maitre',p_chapter,p_profile_id,v_variant)
  returning * into v_room;

  insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host)
  values(v_room.code,v_pseudo,0,true)
  returning * into v_player;

  return jsonb_build_object(
    'room_code',v_room.code,'player_id',v_player.id,'player_token',v_player.player_token,
    'host_token',v_room.host_token,'campaign_id','maitre','chapter',v_room.chapter
  );
end
$function$;

create or replace function public.igr_heritage_online_sync(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_players jsonb;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_player from public.igr_heritage_online_players where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into v_room from public.igr_heritage_online_rooms where code=p_code;
  if not found then raise exception 'room not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'ready',ready,
    'role_id',case when v_room.status='playing' then role_id else null end
  ) order by seat_index),'[]'::jsonb)
  into v_players
  from public.igr_heritage_online_players
  where room_code=p_code;

  return jsonb_build_object(
    'room',jsonb_build_object(
      'code',v_room.code,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter,
      'status',v_room.status,'stage',v_room.stage,'phase_index',v_room.phase_index,
      'decision_id',v_room.decision_id,'updated_at',v_room.updated_at,
      'maitre_angle',case when v_room.campaign_id='maitre' then v_room.maitre_angle else null end,
      'maitre_demonstration',case when v_room.campaign_id='maitre' then v_room.maitre_demonstration else null end,
      'maitre_variant',case
        when v_room.campaign_id='maitre' and v_player.role_id in ('client','enqueteur','temoin')
          then v_room.maitre_variant
        else null
      end
    ),
    'player',jsonb_build_object(
      'id',v_player.id,'pseudo',v_player.pseudo,'is_host',v_player.is_host,'ready',v_player.ready,
      'role_id',case when v_room.status='playing' then v_player.role_id else null end
    ),
    'players',v_players
  );
end
$function$;

revoke all on function public.igr_heritage_online_create_maitre(text,integer,text,uuid,text,text) from public;
grant execute on function public.igr_heritage_online_create_maitre(text,integer,text,uuid,text,text) to anon,authenticated;
