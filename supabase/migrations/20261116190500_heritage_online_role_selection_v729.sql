-- Multiplayer Heritage v729 — consensual role selection, atomic reservations
alter table public.igr_heritage_online_players add column if not exists preferred_role text;
create unique index if not exists igr_heritage_online_preferred_role_unique
 on public.igr_heritage_online_players(room_code,preferred_role) where preferred_role is not null;

create or replace function igr_private.igr_heritage_online_role_pool(p_campaign text,p_chapter integer,p_players integer)
returns text[] language plpgsql immutable security invoker set search_path = '' as $pool$
begin
 if p_players not between 5 and 7 then return null; end if;
 if p_campaign='cendres' then
  return case p_players when 5 then array['chef','sigint','terrain','source','liaison']
   when 6 then array['chef','sigint','terrain','source','liaison','legal']
   else array['chef','sigint','terrain','source','liaison','legal','archive'] end;
 elsif p_campaign='kuroi' then
  return case p_players when 5 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur']
   when 6 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur','bengoshi']
   else array['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'] end;
 elsif p_campaign='maitre' then
  if p_chapter=3 then
   return case p_players when 5 then array['avocat','client','associe','enqueteur','juge']
    when 6 then array['avocat','client','associe','enqueteur','procureur','juge']
    else array['avocat','client','associe','enqueteur','procureur','juge','temoin'] end;
  end if;
  return case p_players when 5 then array['avocat','client','enqueteur','procureur','juge']
   when 6 then array['avocat','client','enqueteur','procureur','juge','associe']
   else array['avocat','client','enqueteur','procureur','juge','associe','temoin'] end;
 end if;
 return null;
end;
$pool$;
revoke all on function igr_private.igr_heritage_online_role_pool(text,integer,integer) from public;

create or replace function public.igr_heritage_online_choose_role(p_code text,p_player_token uuid,p_role_id text)
returns jsonb language plpgsql security definer set search_path = '' as $choose$
declare v_room public.igr_heritage_online_rooms%rowtype;
 v_player public.igr_heritage_online_players%rowtype;
 v_role text:=nullif(btrim(coalesce(p_role_id,'')),'');
 v_count integer;v_roles text[];
begin
 p_code:=upper(btrim(coalesce(p_code,'')));
 select * into v_room from public.igr_heritage_online_rooms where code=p_code for update;
 if not found then raise exception 'room_not_found'; end if;
 if v_room.status<>'lobby' or v_room.stage<>'lobby' then raise exception 'role_selection_closed'; end if;
 select * into v_player from public.igr_heritage_online_players
 where room_code=p_code and player_token=p_player_token for update;
 if not found then raise exception 'unauthorized'; end if;
 perform igr_private.rate_limit('heritage_role_selection',p_code||':'||v_player.id::text,50,60);
 select count(*) into v_count from public.igr_heritage_online_players where room_code=p_code;
 v_roles:=igr_private.igr_heritage_online_role_pool(v_room.campaign_id,v_room.chapter,greatest(5,v_count));
 if v_role is not null and not (v_role=any(v_roles)) then raise exception 'role_not_available'; end if;
 if v_role is not null and exists(
   select 1 from public.igr_heritage_online_players
   where room_code=p_code and id<>v_player.id and preferred_role=v_role
 ) then raise exception 'role_already_taken'; end if;
 update public.igr_heritage_online_players set preferred_role=v_role
 where id=v_player.id and room_code=p_code;
 update public.igr_heritage_online_rooms set updated_at=now() where code=p_code;
 return jsonb_build_object('ok',true,'preferred_role',v_role);
end;
$choose$;
revoke all on function public.igr_heritage_online_choose_role(text,uuid,text) from public;
grant execute on function public.igr_heritage_online_choose_role(text,uuid,text) to anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.igr_heritage_online_start(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Preserve chosen roles. Only undecided seats are drawn server-side at start.
  v_roles:=igr_private.igr_heritage_online_role_pool(v_room.campaign_id,v_room.chapter,v_count);
  if v_roles is null then raise exception 'invalid_campaign_roster'; end if;
  if exists(select 1 from public.igr_heritage_online_players p
    where p.room_code=p_code and p.preferred_role is not null
      and not (p.preferred_role=any(v_roles))
  ) then raise exception 'selected_role_not_available_for_player_count'; end if;
  if exists(select 1 from public.igr_heritage_online_players p
    where p.room_code=p_code and p.preferred_role is not null
    group by p.preferred_role having count(*)>1
  ) then raise exception 'role_already_taken'; end if;
  update public.igr_heritage_online_players
    set role_id=preferred_role,ready=false where room_code=p_code;
  with unclaimed as (
    select roles.role_id,row_number() over(order by pg_catalog.gen_random_uuid()) rn
    from pg_catalog.unnest(v_roles) roles(role_id)
    where not exists(select 1 from public.igr_heritage_online_players p
      where p.room_code=p_code and p.preferred_role=roles.role_id)
  ), undecided as (
    select id,row_number() over(order by pg_catalog.gen_random_uuid()) rn
    from public.igr_heritage_online_players where room_code=p_code and preferred_role is null
  )
  update public.igr_heritage_online_players p
    set role_id=unclaimed.role_id
    from undecided join unclaimed on undecided.rn=unclaimed.rn
    where p.id=undecided.id and p.room_code=p_code;
  if exists(select 1 from public.igr_heritage_online_players
    where room_code=p_code and role_id is null) then raise exception 'unassigned_role'; end if;

  update public.igr_heritage_online_rooms
  set status='playing',stage='role_reading',phase_index=0,decision_id=null,
      maitre_angle=null,maitre_demonstration=null,updated_at=now()
  where code=p_code;
  return jsonb_build_object('ok',true);
end
$function$;
CREATE OR REPLACE FUNCTION public.igr_heritage_online_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'role_id',case when v_room.status='playing' then role_id else null end,
    'preferred_role',case when v_room.status='lobby' then preferred_role else null end
  ) order by seat_index),'[]'::jsonb)
  into v_players
  from public.igr_heritage_online_players
  where room_code=p_code;

  return jsonb_build_object(
    'room',jsonb_build_object(
      'code',v_room.code,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter,
      'status',v_room.status,'stage',v_room.stage,'phase_index',v_room.phase_index,
      'decision_id',v_room.decision_id,'updated_at',v_room.updated_at,'campaign_carry',v_room.campaign_carry,
      'maitre_angle',case when v_room.campaign_id='maitre' and (v_player.role_id='avocat' or v_room.phase_index>=2 or v_room.stage in ('reveal','finished')) then v_room.maitre_angle else null end,
      'maitre_demonstration',case when v_room.campaign_id='maitre' and (v_player.role_id='avocat' or v_room.phase_index>=2 or v_room.stage in ('reveal','finished')) then v_room.maitre_demonstration else null end,
      'maitre_variant',case
        when v_room.campaign_id='maitre' and v_player.role_id in ('client','enqueteur','temoin')
          then v_room.maitre_variant
        else null
      end
    ),
    'player',jsonb_build_object(
      'id',v_player.id,'pseudo',v_player.pseudo,'is_host',v_player.is_host,'ready',v_player.ready,
      'role_id',case when v_room.status='playing' then v_player.role_id else null end,
      'preferred_role',case when v_room.status='lobby' then v_player.preferred_role else null end
    ),
    'players',v_players
  );
end
$function$;
