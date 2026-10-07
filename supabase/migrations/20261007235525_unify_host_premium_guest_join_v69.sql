-- Inside Grey Room v69 — unify free guest join routing for all four DLCs.
-- OMERTÀ uses the same generic premium join path as TERREUR/CARTEL/LE RÉGIME;
-- the host entitlement remains the only paid requirement.

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
  if v_key not in ('omerta','terror','cartel','regime') then raise exception 'not_premium_room'; end if;
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
  values(r.code,'player_joined',jsonb_build_object(
    'title','ARRIVÉE',
    'text',case when v_key='omerta'
      then p.pseudo||' a rejoint la cellule OMERTÀ.'
      else p.pseudo||' a rejoint la cellule.' end
  ));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'dlc_key',v_key,'host_licensed',true);
end
$function$;

revoke all on function public.igr_dlc_join_room(text,text,uuid,text) from public;
grant execute on function public.igr_dlc_join_room(text,text,uuid,text) to anon, authenticated;
