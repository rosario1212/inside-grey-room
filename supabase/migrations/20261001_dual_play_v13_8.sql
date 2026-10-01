-- Inside Grey Room v13.8 — dual play modes
-- Existing HÉRITAGE online tables/functions are preserved and tightened.
-- Adds the local scenario-pack RPC for 001–034 and a clean leave action.

create unique index if not exists igr_heritage_online_players_room_pseudo_ci
  on public.igr_heritage_online_players(room_code, lower(pseudo));

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
    else array[]::text[]
  end
$function$;

-- Server-authoritative role assignment. Randomized with gen_random_uuid ordering,
-- avoiding client-side or Math.random role assignment for online HÉRITAGE.
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
  else
    v_roles:=case v_count
      when 5 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur']
      when 6 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur','bengoshi']
      else array['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'] end;
  end if;

  with ranked as (
    select id,row_number() over(order by gen_random_uuid())::integer as rn
    from public.igr_heritage_online_players where room_code=p_code
  )
  update public.igr_heritage_online_players p
  set role_id=v_roles[ranked.rn],ready=false
  from ranked where p.id=ranked.id;

  update public.igr_heritage_online_rooms
  set status='playing',stage='role_reading',phase_index=0,decision_id=null,updated_at=now()
  where code=p_code;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_heritage_online_decide(p_code text,p_host_token uuid,p_option_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_allowed text[];
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.stage<>'decision' then raise exception 'wrong stage'; end if;
  v_allowed:=public.igr_heritage_online_decisions(v_room.campaign_id,v_room.chapter);
  if not (trim(coalesce(p_option_id,''))=any(v_allowed)) then raise exception 'invalid option'; end if;
  update public.igr_heritage_online_rooms set decision_id=trim(p_option_id),stage='reveal',updated_at=now() where code=p_code;
  return jsonb_build_object('ok',true,'decision_id',trim(p_option_id));
end
$function$;

create or replace function public.igr_heritage_online_leave(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_player public.igr_heritage_online_players%rowtype;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_player from public.igr_heritage_online_players where room_code=p_code and player_token=p_player_token;
  if not found then return jsonb_build_object('ok',true); end if;
  if v_player.is_host then delete from public.igr_heritage_online_rooms where code=p_code;
  else delete from public.igr_heritage_online_players where id=v_player.id;
  end if;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_local_scenario_pack(
  p_scenario_id text,
  p_profile_id uuid,
  p_profile_token text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_pack jsonb;
  v_key text;
begin
  if p_scenario_id !~ '^0(0[1-9]|[12][0-9]|3[0-4])$' then raise exception 'invalid_scenario'; end if;
  if p_scenario_id between '021' and '025' then v_key:='omerta';
  elsif p_scenario_id between '026' and '028' then v_key:='terror';
  elsif p_scenario_id between '029' and '031' then v_key:='cartel';
  elsif p_scenario_id between '032' and '034' then v_key:='regime';
  else v_key:=null;
  end if;
  if v_key is not null then
    perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
    if not public.igr_dlc_has_access(p_profile_id,v_key) then raise exception 'premium_access_required'; end if;
  end if;
  select pack into v_pack from public.igr_v4_scenario_packs where scenario_id=p_scenario_id;
  if v_pack is null then raise exception 'scenario_pack_missing'; end if;
  return jsonb_build_object(
    'scenario_id',p_scenario_id,
    'min_players',public.igr_v4_min_players(p_scenario_id),
    'max_players',public.igr_v4_max_players(p_scenario_id),
    'pack',v_pack
  );
end
$function$;

revoke all on function public.igr_heritage_online_decisions(text,integer) from public;
revoke all on function public.igr_heritage_online_start(text,uuid) from public;
revoke all on function public.igr_heritage_online_decide(text,uuid,text) from public;
revoke all on function public.igr_heritage_online_leave(text,uuid) from public;
revoke all on function public.igr_local_scenario_pack(text,uuid,text) from public;

grant execute on function public.igr_heritage_online_start(text,uuid) to anon,authenticated;
grant execute on function public.igr_heritage_online_decide(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_heritage_online_leave(text,uuid) to anon,authenticated;
grant execute on function public.igr_local_scenario_pack(text,uuid,text) to anon,authenticated;
