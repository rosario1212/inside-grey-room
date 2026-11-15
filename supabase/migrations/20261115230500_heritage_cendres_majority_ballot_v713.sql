-- CENDRES v713: server-validated collective vote; no host verdict override.
-- Keep KUROI and MAÎTRE decision routes unchanged.
-- Apply this migration before publishing the paired play-modes client change.

alter table public.igr_heritage_online_rooms
  add column if not exists cendres_vote_round integer not null default 1;

create table if not exists public.igr_heritage_online_cendres_votes (
  room_code text not null references public.igr_heritage_online_rooms(code) on delete cascade,
  player_id uuid not null references public.igr_heritage_online_players(id) on delete cascade,
  option_id text not null,
  voted_at timestamptz not null default now(),
  primary key (room_code,player_id)
);

alter table public.igr_heritage_online_cendres_votes enable row level security;
revoke all on public.igr_heritage_online_cendres_votes from public, anon, authenticated;
-- All ballot reads/writes pass through room+player-token checked SECURITY DEFINER RPCs.

create or replace function public.igr_heritage_online_vote_cendres(
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
  v_total integer;
  v_cast integer;
  v_votes integer;
  v_winning_option text;
  v_majority integer;
  v_option text := trim(coalesce(p_option_id,''));
begin
  p_code := upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms
  where code=p_code for update;
  if not found then raise exception 'room not found'; end if;
  if v_room.campaign_id<>'cendres' then raise exception 'cendres only'; end if;
  if v_room.status<>'playing' or v_room.stage<>'decision' or v_room.decision_id is not null
    then raise exception 'ballot closed'; end if;

  select * into v_player from public.igr_heritage_online_players
  where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  if not (v_option = any(public.igr_heritage_online_decisions('cendres',v_room.chapter)))
    then raise exception 'invalid option'; end if;

  select count(*) into v_total from public.igr_heritage_online_players
  where room_code=p_code;
  if v_total not between 5 and 7 then raise exception 'invalid roster'; end if;
  v_majority := (v_total/2)+1;

  insert into public.igr_heritage_online_cendres_votes(room_code,player_id,option_id)
  values (p_code,v_player.id,v_option)
  on conflict (room_code,player_id)
  do update set option_id=excluded.option_id,voted_at=now();

  select option_id,count(*)::integer
    into v_winning_option,v_votes
  from public.igr_heritage_online_cendres_votes
  where room_code=p_code
  group by option_id
  order by count(*) desc,option_id
  limit 1;

  select count(*) into v_cast from public.igr_heritage_online_cendres_votes
  where room_code=p_code;

  if v_cast=v_total and coalesce(v_votes,0)>=v_majority then
    update public.igr_heritage_online_rooms
      set decision_id=v_winning_option,stage='reveal',updated_at=now()
    where code=p_code;
    return jsonb_build_object('ok',true,'decided',true,'decision_id',v_winning_option,
      'votes_cast',v_cast,'players',v_total,'majority',v_majority,
      'vote_round',v_room.cendres_vote_round);
  end if;

  if v_cast=v_total then
    -- Plurality is insufficient; automatically reopen a clean round.
    delete from public.igr_heritage_online_cendres_votes where room_code=p_code;
    update public.igr_heritage_online_rooms
      set cendres_vote_round=cendres_vote_round+1,updated_at=now()
    where code=p_code;
    return jsonb_build_object('ok',true,'decided',false,'new_round',true,
      'votes_cast',0,'players',v_total,'majority',v_majority,
      'vote_round',v_room.cendres_vote_round+1);
  end if;

  return jsonb_build_object('ok',true,'decided',false,'new_round',false,
    'votes_cast',v_cast,'players',v_total,'majority',v_majority,
    'vote_round',v_room.cendres_vote_round);
end
$function$;

revoke all on function public.igr_heritage_online_vote_cendres(text,uuid,text) from public;
grant execute on function public.igr_heritage_online_vote_cendres(text,uuid,text) to anon,authenticated;

create or replace function public.igr_heritage_online_cendres_ballot_status(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_total integer;
  v_cast integer;
  v_mine text;
begin
  p_code := upper(trim(coalesce(p_code,'')));
  select * into v_player from public.igr_heritage_online_players
    where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into v_room from public.igr_heritage_online_rooms where code=p_code;
  if not found or v_room.campaign_id<>'cendres' then raise exception 'room not found'; end if;
  select count(*) into v_total from public.igr_heritage_online_players where room_code=p_code;
  select count(*) into v_cast from public.igr_heritage_online_cendres_votes where room_code=p_code;
  select option_id into v_mine from public.igr_heritage_online_cendres_votes
    where room_code=p_code and player_id=v_player.id;
  return jsonb_build_object('vote_round',v_room.cendres_vote_round,
    'votes_cast',v_cast,'players',v_total,'majority',(v_total/2)+1,
    'my_vote',v_mine,'stage',v_room.stage);
end
$function$;

revoke all on function public.igr_heritage_online_cendres_ballot_status(text,uuid) from public;
grant execute on function public.igr_heritage_online_cendres_ballot_status(text,uuid) to anon,authenticated;

-- The legacy host-token RPC must not be an alternate way around the ballot.
create or replace function public.igr_heritage_online_decide(
  p_code text,
  p_host_token uuid,
  p_option_id text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_allowed text[];
begin
  p_code := upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms
  where code=p_code and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.campaign_id='cendres' then raise exception 'collective ballot required'; end if;
  if v_room.stage<>'decision' then raise exception 'wrong stage'; end if;
  if v_room.campaign_id='maitre' and exists(
    select 1 from public.igr_heritage_online_players where room_code=p_code and role_id='juge'
  ) then raise exception 'judge only'; end if;
  v_allowed:=public.igr_heritage_online_decisions(v_room.campaign_id,v_room.chapter);
  if not (trim(coalesce(p_option_id,''))=any(v_allowed)) then raise exception 'invalid option'; end if;
  update public.igr_heritage_online_rooms
    set decision_id=trim(p_option_id),stage='reveal',updated_at=now()
  where code=p_code;
  return jsonb_build_object('ok',true,'decision_id',trim(p_option_id));
end
$function$;

revoke all on function public.igr_heritage_online_decide(text,uuid,text) from public;
grant execute on function public.igr_heritage_online_decide(text,uuid,text) to anon,authenticated;

-- Preserve the five/seven-seat quorum after game start: leaving suspends a seat
-- rather than shrinking the majority or deleting the whole campaign.
create or replace function public.igr_heritage_online_leave(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms where code=p_code for update;
  if not found then return jsonb_build_object('ok',true); end if;
  select * into v_player from public.igr_heritage_online_players
    where room_code=p_code and player_token=p_player_token;
  if not found then return jsonb_build_object('ok',true); end if;
  if v_room.campaign_id='cendres' and v_room.status='playing' then
    return jsonb_build_object('ok',false,'resume_required',true);
  end if;
  if v_player.is_host then
    delete from public.igr_heritage_online_rooms where code=p_code;
  else
    delete from public.igr_heritage_online_players where id=v_player.id;
  end if;
  return jsonb_build_object('ok',true);
end
$function$;

revoke all on function public.igr_heritage_online_leave(text,uuid) from public;
grant execute on function public.igr_heritage_online_leave(text,uuid) to anon,authenticated;
