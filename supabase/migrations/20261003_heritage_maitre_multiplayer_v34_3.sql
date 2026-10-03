alter table public.igr_heritage_online_rooms
  add column if not exists maitre_angle text,
  add column if not exists maitre_demonstration text;

create or replace function public.igr_heritage_online_create(
  p_code text,
  p_campaign_id text,
  p_chapter integer,
  p_pseudo text,
  p_profile_id uuid,
  p_profile_token text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_pseudo text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not public.igr_dlc_has_access(p_profile_id,'heritage') then raise exception 'premium access required'; end if;
  if lower(trim(coalesce(p_campaign_id,''))) not in ('cendres','kuroi','maitre') then raise exception 'invalid campaign'; end if;
  if p_chapter not between 1 and 5 then raise exception 'invalid chapter'; end if;
  p_code:=upper(trim(coalesce(p_code,'')));
  if p_code!~'^H[A-Z2-9]{4}$' then raise exception 'invalid room code'; end if;
  if exists(select 1 from public.igr_v4_rooms where code=p_code) then raise exception 'code collision'; end if;
  delete from public.igr_heritage_online_rooms where updated_at<now()-interval '12 hours';
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.assert_ugc(v_pseudo,22,false);
  insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,owner_profile_id)
  values(p_code,lower(trim(p_campaign_id)),p_chapter,p_profile_id) returning * into v_room;
  insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host)
  values(v_room.code,v_pseudo,0,true) returning * into v_player;
  return jsonb_build_object('room_code',v_room.code,'player_id',v_player.id,'player_token',v_player.player_token,'host_token',v_room.host_token,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter);
end
$function$;

create or replace function public.igr_heritage_online_start(p_code text, p_host_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_count integer;
  v_roles text[];
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.status<>'lobby' then raise exception 'already started'; end if;
  select count(*) into v_count from public.igr_heritage_online_players where room_code=p_code;
  if v_count<5 or v_count>7 then raise exception 'need 5 to 7 players'; end if;

  if v_room.campaign_id='cendres' then
    v_roles:=case v_count when 5 then array['chef','sigint','terrain','source','liaison'] when 6 then array['chef','sigint','terrain','source','liaison','legal'] else array['chef','sigint','terrain','source','liaison','legal','archive'] end;
  elsif v_room.campaign_id='kuroi' then
    v_roles:=case v_count when 5 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur'] when 6 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur','bengoshi'] else array['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'] end;
  elsif v_room.campaign_id='maitre' then
    if v_room.chapter=3 then
      v_roles:=case v_count
        when 5 then array['avocat','client','associe','enqueteur','juge']
        when 6 then array['avocat','client','associe','enqueteur','procureur','juge']
        else array['avocat','client','associe','enqueteur','procureur','juge','temoin'] end;
    else
      v_roles:=case v_count
        when 5 then array['avocat','client','enqueteur','procureur','juge']
        when 6 then array['avocat','client','enqueteur','procureur','juge','temoin']
        else array['avocat','client','enqueteur','procureur','juge','temoin','associe'] end;
    end if;
  else
    raise exception 'invalid campaign';
  end if;

  with ranked as (
    select id,row_number() over(order by gen_random_uuid())::integer as rn
    from public.igr_heritage_online_players where room_code=p_code
  )
  update public.igr_heritage_online_players p
    set role_id=v_roles[ranked.rn],ready=false
    from ranked where p.id=ranked.id;

  update public.igr_heritage_online_rooms
    set status='playing',stage='role_reading',phase_index=0,decision_id=null,
        maitre_angle=null,maitre_demonstration=null,updated_at=now()
    where code=p_code;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_heritage_online_advance(p_code text, p_host_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_room public.igr_heritage_online_rooms%rowtype; v_last integer;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.stage<>'play' then raise exception 'wrong stage'; end if;
  v_last:=case when v_room.campaign_id='maitre' then 2 else 3 end;
  if v_room.phase_index<v_last then
    update public.igr_heritage_online_rooms set phase_index=phase_index+1,updated_at=now() where code=p_code;
  else
    update public.igr_heritage_online_rooms set stage='decision',updated_at=now() where code=p_code;
  end if;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_heritage_online_decisions(p_campaign text, p_chapter integer)
returns text[]
language sql
immutable
set search_path to 'public'
as $function$
  select case
    when p_campaign='cendres' and p_chapter=1 then array['alias','agent','victim']::text[]
    when p_campaign='cendres' and p_chapter=2 then array['transfer','border','terror']::text[]
    when p_campaign='cendres' and p_chapter=3 then array['b','source','audio']::text[]
    when p_campaign='cendres' and p_chapter=4 then array['kern','prisoner','minister']::text[]
    when p_campaign='cendres' and p_chapter=5 then array['nadir','airbase','depot']::text[]
    when p_campaign='kuroi' and p_chapter=1 then array['police_hand','arakida','internal']::text[]
    when p_campaign='kuroi' and p_chapter=2 then array['mori_ren','arakida_k','oyabun_police']::text[]
    when p_campaign='kuroi' and p_chapter=3 then array['copy','police','clan']::text[]
    when p_campaign='kuroi' and p_chapter=4 then array['chain','ren','mori']::text[]
    when p_campaign='kuroi' and p_chapter=5 then array['public','internal','scapegoat']::text[]
    when p_campaign='maitre' and p_chapter=1 then array['fiscal_only','blindness','active_link']::text[]
    when p_campaign='maitre' and p_chapter=2 then array['deliver','protect','targeted']::text[]
    when p_campaign='maitre' and p_chapter=3 then array['separate','common','fracture']::text[]
    when p_campaign='maitre' and p_chapter=4 then array['narrow','network','insufficient']::text[]
    when p_campaign='maitre' and p_chapter=5 then array['defender','negotiator','name']::text[]
    else array[]::text[] end
$function$;

create or replace function public.igr_heritage_online_maitre_strategy(
  p_code text,
  p_player_token uuid,
  p_angle text,
  p_demonstration text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_angle text;
  v_demo text;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_player from public.igr_heritage_online_players where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into v_room from public.igr_heritage_online_rooms where code=p_code for update;
  if not found or v_room.campaign_id<>'maitre' then raise exception 'wrong campaign'; end if;
  if v_player.role_id<>'avocat' then raise exception 'lawyer only'; end if;
  if v_room.stage<>'play' or v_room.phase_index<>1 then raise exception 'strategy only during cycle II'; end if;
  v_angle:=trim(coalesce(p_angle,''));
  v_demo:=trim(coalesce(p_demonstration,''));
  if length(v_angle)>600 or length(v_demo)>600 then raise exception 'strategy too long'; end if;
  if v_angle<>'' then perform igr_private.assert_ugc(v_angle,600,true); end if;
  if v_demo<>'' then perform igr_private.assert_ugc(v_demo,600,true); end if;
  update public.igr_heritage_online_rooms
    set maitre_angle=nullif(v_angle,''),maitre_demonstration=nullif(v_demo,''),updated_at=now()
    where code=p_code;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_heritage_online_sync(p_code text, p_player_token uuid)
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
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'ready',ready,'role_id',case when v_room.status='playing' then role_id else null end) order by seat_index),'[]'::jsonb)
    into v_players from public.igr_heritage_online_players where room_code=p_code;
  return jsonb_build_object(
    'room',jsonb_build_object(
      'code',v_room.code,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter,
      'status',v_room.status,'stage',v_room.stage,'phase_index',v_room.phase_index,
      'decision_id',v_room.decision_id,'updated_at',v_room.updated_at,
      'maitre_angle',case when v_room.campaign_id='maitre' then v_room.maitre_angle else null end,
      'maitre_demonstration',case when v_room.campaign_id='maitre' then v_room.maitre_demonstration else null end
    ),
    'player',jsonb_build_object('id',v_player.id,'pseudo',v_player.pseudo,'is_host',v_player.is_host,'ready',v_player.ready,'role_id',case when v_room.status='playing' then v_player.role_id else null end),
    'players',v_players
  );
end
$function$;

revoke all on function public.igr_heritage_online_maitre_strategy(text,uuid,text,text) from public;
grant execute on function public.igr_heritage_online_maitre_strategy(text,uuid,text,text) to anon, authenticated;
