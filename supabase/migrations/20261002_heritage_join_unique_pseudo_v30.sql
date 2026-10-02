-- Inside Grey Room v30 — HÉRITAGE duplicate-join hardening.
-- Prevents one room from accepting the same pseudo more than once, including case variants.
create unique index if not exists igr_heritage_online_players_room_pseudo_ci_uidx
on public.igr_heritage_online_players (room_code, lower(pseudo));

create or replace function public.igr_heritage_online_join(p_code text, p_pseudo text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_count int;
  v_seat int;
  v_pseudo text;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');

  perform igr_private.rate_limit('heritage_join_global','global',300,60);
  perform igr_private.rate_limit('heritage_join_code',p_code,40,60);
  perform igr_private.rate_limit('heritage_join_identity',p_code||':'||lower(v_pseudo),8,300);

  select * into v_room
  from public.igr_heritage_online_rooms
  where code=p_code
  for update;
  if not found then raise exception 'heritage room not found'; end if;
  if v_room.status<>'lobby' then raise exception 'room already started'; end if;

  perform igr_private.assert_ugc(v_pseudo,22,false);
  if exists(
    select 1 from public.igr_heritage_online_players
    where room_code=p_code and lower(pseudo)=lower(v_pseudo)
  ) then
    raise exception 'pseudo already used';
  end if;

  select count(*),coalesce(max(seat_index),-1)+1
  into v_count,v_seat
  from public.igr_heritage_online_players
  where room_code=p_code;
  if v_count>=7 then raise exception 'room full'; end if;

  insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host)
  values(p_code,v_pseudo,v_seat,false)
  returning * into v_player;

  update public.igr_heritage_online_rooms
  set updated_at=now()
  where code=p_code;

  return jsonb_build_object(
    'room_code',p_code,
    'player_id',v_player.id,
    'player_token',v_player.player_token,
    'campaign_id',v_room.campaign_id,
    'chapter',v_room.chapter
  );
end
$function$;

revoke execute on function public.igr_heritage_online_join(text,text) from public;
grant execute on function public.igr_heritage_online_join(text,text) to anon, authenticated, service_role;
