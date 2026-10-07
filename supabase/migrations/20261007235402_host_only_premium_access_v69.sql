-- Inside Grey Room v69 — host-only premium access.
-- The permanent entitlement belongs to the host. Guests may join for free,
-- while the server verifies that the room's host licence is still active.

create or replace function public.igr_dlc_join_room(
  p_code text, p_pseudo text, p_profile_id uuid, p_profile_token text
)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  r public.igr_v4_rooms%rowtype;
  p public.igr_v4_players%rowtype;
  c int; s int; v_pseudo text; v_code text; v_key text; v_host_profile uuid;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  v_code:=upper(trim(p_code));
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.rate_limit('join_room_global','global',600,60);
  perform igr_private.rate_limit('join_room_code',v_code,80,60);
  perform igr_private.rate_limit('join_room_identity',v_code||':'||lower(v_pseudo),10,300);
  perform igr_private.assert_ugc(v_pseudo,22,false);
  select * into r from public.igr_v4_rooms where code=v_code for update;
  if not found then raise exception 'room not found'; end if;
  v_key:=public.igr_dlc_key_for_scenario(r.scenario_id);
  if v_key not in ('terror','cartel','regime') then raise exception 'not_premium_room'; end if;
  select profile_id into v_host_profile
  from public.igr_v4_players where room_code=r.code and is_host order by seat_index limit 1;
  if v_host_profile is null or not public.igr_dlc_has_access(v_host_profile,v_key) then
    raise exception 'host_licence_inactive:%',v_key;
  end if;
  if r.status<>'lobby' then raise exception 'already started'; end if;
  select count(*),coalesce(max(seat_index),-1)+1 into c,s
  from public.igr_v4_players where room_code=r.code;
  if c>=public.igr_v4_max_players(r.scenario_id) then raise exception 'room full'; end if;
  if exists(select 1 from public.igr_v4_players where room_code=r.code and lower(pseudo)=lower(v_pseudo)) then
    raise exception 'pseudo already used';
  end if;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,profile_id)
  values(r.code,v_pseudo,s,p_profile_id) returning * into p;
  update public.igr_v4_rooms set updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'player_joined',jsonb_build_object('title','ARRIVÉE','text',p.pseudo||' a rejoint la cellule.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'dlc_key',v_key,'host_licensed',true);
end
$function$;

revoke all on function public.igr_dlc_join_room(text,text,uuid,text) from public;
grant execute on function public.igr_dlc_join_room(text,text,uuid,text) to anon, authenticated;

create or replace function public.igr_omerta_join_room(
  p_code text, p_pseudo text, p_profile_id uuid, p_profile_token text
)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  r public.igr_v4_rooms%rowtype;
  p public.igr_v4_players%rowtype;
  c int; s int; v_pseudo text; v_code text; v_host_profile uuid;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  v_code:=upper(trim(p_code));
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.rate_limit('join_room_global','global',600,60);
  perform igr_private.rate_limit('join_room_code',v_code,80,60);
  perform igr_private.rate_limit('join_room_identity',v_code||':'||lower(v_pseudo),10,300);
  perform igr_private.assert_ugc(v_pseudo,22,false);
  select * into r from public.igr_v4_rooms where code=v_code for update;
  if not found then raise exception 'room not found'; end if;
  if r.scenario_id not in ('021','022','023','024','025') then raise exception 'not_omerta_room'; end if;
  select profile_id into v_host_profile
  from public.igr_v4_players where room_code=r.code and is_host order by seat_index limit 1;
  if v_host_profile is null or not public.igr_omerta_has_access(v_host_profile) then
    raise exception 'host_licence_inactive:omerta';
  end if;
  if r.status<>'lobby' then raise exception 'already started'; end if;
  select count(*),coalesce(max(seat_index),-1)+1 into c,s
  from public.igr_v4_players where room_code=r.code;
  if c>=public.igr_v4_max_players(r.scenario_id) then raise exception 'room full'; end if;
  if exists(select 1 from public.igr_v4_players where room_code=r.code and lower(pseudo)=lower(v_pseudo)) then
    raise exception 'pseudo already used';
  end if;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,profile_id)
  values(r.code,v_pseudo,s,p_profile_id) returning * into p;
  update public.igr_v4_rooms set updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'player_joined',jsonb_build_object('title','ARRIVÉE','text',p.pseudo||' a rejoint la cellule OMERTÀ.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'host_licensed',true);
end
$function$;

revoke all on function public.igr_omerta_join_room(text,text,uuid,text) from public;
grant execute on function public.igr_omerta_join_room(text,text,uuid,text) to anon, authenticated;

create or replace function public.igr_heritage_online_join(p_code text,p_pseudo text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_count int; v_seat int; v_pseudo text;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.rate_limit('heritage_join_global','global',300,60);
  perform igr_private.rate_limit('heritage_join_code',p_code,40,60);
  perform igr_private.rate_limit('heritage_join_identity',p_code||':'||lower(v_pseudo),8,300);
  select * into v_room from public.igr_heritage_online_rooms where code=p_code for update;
  if not found then raise exception 'heritage room not found'; end if;
  if v_room.status<>'lobby' then raise exception 'room already started'; end if;
  if v_room.owner_profile_id is null or not public.igr_dlc_has_access(v_room.owner_profile_id,'heritage') then
    raise exception 'host_licence_inactive:heritage';
  end if;
  perform igr_private.assert_ugc(v_pseudo,22,false);
  if exists(select 1 from public.igr_heritage_online_players where room_code=p_code and lower(pseudo)=lower(v_pseudo)) then
    raise exception 'pseudo already used';
  end if;
  select count(*),coalesce(max(seat_index),-1)+1 into v_count,v_seat
  from public.igr_heritage_online_players where room_code=p_code;
  if v_count>=7 then raise exception 'room full'; end if;
  insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host)
  values(p_code,v_pseudo,v_seat,false) returning * into v_player;
  update public.igr_heritage_online_rooms set updated_at=now() where code=p_code;
  return jsonb_build_object('room_code',p_code,'player_id',v_player.id,'player_token',v_player.player_token,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter,'host_licensed',true);
end
$function$;

revoke all on function public.igr_heritage_online_join(text,text) from public;
grant execute on function public.igr_heritage_online_join(text,text) to anon, authenticated, service_role;
