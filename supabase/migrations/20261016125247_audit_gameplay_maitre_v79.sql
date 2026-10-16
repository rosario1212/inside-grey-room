-- Restore the outcome endpoint used by the reachable judicial event screens.
-- The player token, public role and current phase are checked before recording.
create or replace function public.igr_v13_record_judicial_outcome(
  p_code text,p_player_token uuid,p_outcome text,p_note text default ''
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  expected text;
begin
  select * into p from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or r.status<>'playing' or r.phase not in ('event_negociation','event_requete','event_saisine') then
    raise exception 'wrong phase';
  end if;
  if coalesce(p_outcome,'') not in ('accepted','refused') then raise exception 'invalid outcome'; end if;
  if r.phase='event_negociation' and p.public_role is distinct from 'procureur' then raise exception 'forbidden'; end if;
  if r.phase in ('event_requete','event_saisine') and p.public_role is distinct from 'juge' then raise exception 'forbidden'; end if;
  expected:='v13_outcome_'||r.phase;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type=expected) then
    raise exception 'already submitted';
  end if;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(r.code,p.id,r.cycle,expected,jsonb_build_object('outcome',p_outcome,'note',left(coalesce(p_note,''),180)));
  return jsonb_build_object('ok',true);
end
$$;
revoke all on function public.igr_v13_record_judicial_outcome(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.igr_v13_record_judicial_outcome(text,uuid,text,text) to anon,service_role;

-- Keep CENDRES/KUROI creation unchanged. Cached old MAÎTRE clients must not
-- silently open a room with NULL truth and fall back to a different variant.
CREATE OR REPLACE FUNCTION public.igr_heritage_online_create(p_code text, p_campaign_id text, p_chapter integer, p_pseudo text, p_profile_id uuid, p_profile_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_pseudo text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not public.igr_dlc_has_access(p_profile_id,'heritage') then raise exception 'premium access required'; end if;
  -- MAÎTRE must carry the host's canonical variant through its dedicated RPC.
  if lower(trim(coalesce(p_campaign_id,'')))='maitre' then raise exception 'maitre variant required: use igr_heritage_online_create_maitre'; end if;
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
$function$
;

-- Both indexes were identical standalone unique indexes. Keep the original,
-- including its case-insensitive uniqueness guarantee; remove only its duplicate.
drop index if exists public.igr_heritage_online_players_room_pseudo_ci_uidx;
