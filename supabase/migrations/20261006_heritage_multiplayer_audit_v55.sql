-- Inside Grey Room v55 — HÉRITAGE multiplayer audit
-- MAÎTRE is the Avocat's persistent campaign: the campaign owner/host is
-- therefore always the Avocat online. The Juge, not the host, locks the
-- judicial conclusion through a player-token-authorized RPC.

create or replace function public.igr_heritage_online_start(p_code text,p_host_token uuid)
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
    v_roles:=case v_count
      when 5 then array['chef','sigint','terrain','source','liaison']
      when 6 then array['chef','sigint','terrain','source','liaison','legal']
      else array['chef','sigint','terrain','source','liaison','legal','archive'] end;
  elsif v_room.campaign_id='kuroi' then
    v_roles:=case v_count
      when 5 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur']
      when 6 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur','bengoshi']
      else array['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'] end;
  elsif v_room.campaign_id='maitre' then
    if v_room.chapter=3 then
      v_roles:=case v_count
        when 5 then array['avocat','client','associe','enqueteur','juge']
        when 6 then array['avocat','client','associe','enqueteur','procureur','juge']
        else array['avocat','client','associe','enqueteur','procureur','juge','temoin'] end;
    else
      v_roles:=case v_count
        when 5 then array['avocat','client','enqueteur','procureur','juge']
        when 6 then array['avocat','client','enqueteur','procureur','juge','associe']
        else array['avocat','client','enqueteur','procureur','juge','associe','temoin'] end;
    end if;
  else
    raise exception 'invalid campaign';
  end if;

  update public.igr_heritage_online_players
  set role_id=null,ready=false
  where room_code=p_code;

  if v_room.campaign_id='maitre' then
    update public.igr_heritage_online_players
    set role_id='avocat',ready=false
    where room_code=p_code and is_host;

    with ranked as (
      select id,row_number() over(order by gen_random_uuid())::integer as rn
      from public.igr_heritage_online_players
      where room_code=p_code and not is_host
    )
    update public.igr_heritage_online_players p
    set role_id=v_roles[ranked.rn+1],ready=false
    from ranked where p.id=ranked.id;
  else
    with ranked as (
      select id,row_number() over(order by gen_random_uuid())::integer as rn
      from public.igr_heritage_online_players where room_code=p_code
    )
    update public.igr_heritage_online_players p
    set role_id=v_roles[ranked.rn],ready=false
    from ranked where p.id=ranked.id;
  end if;

  update public.igr_heritage_online_rooms
  set status='playing',stage='role_reading',phase_index=0,decision_id=null,
      maitre_angle=null,maitre_demonstration=null,updated_at=now()
  where code=p_code;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_heritage_online_decide_v55(
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
  v_has_judge boolean;
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

  select exists(
    select 1 from public.igr_heritage_online_players
    where room_code=p_code and role_id='juge'
  ) into v_has_judge;

  if v_has_judge and v_player.role_id<>'juge' then raise exception 'judge only'; end if;
  if not v_has_judge and not v_player.is_host then raise exception 'host fallback only'; end if;

  v_allowed:=public.igr_heritage_online_decisions(v_room.campaign_id,v_room.chapter);
  if not (trim(coalesce(p_option_id,''))=any(v_allowed)) then raise exception 'invalid option'; end if;

  update public.igr_heritage_online_rooms
  set decision_id=trim(p_option_id),stage='reveal',updated_at=now()
  where code=p_code;

  return jsonb_build_object('ok',true,'decision_id',trim(p_option_id));
end
$function$;

revoke all on function public.igr_heritage_online_decide_v55(text,uuid,text) from public;
grant execute on function public.igr_heritage_online_decide_v55(text,uuid,text) to anon,authenticated;
