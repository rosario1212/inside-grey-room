-- v827: Investigator-only early confrontation termination.
-- Existing interrogation end RPC already checks Investigator role.
create or replace function public.igr_v827_end_confrontation(p_code text, p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  next_phase text;
begin
  select * into p from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role <> 'enqueteur' then
    raise exception 'forbidden';
  end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if not found or r.status <> 'playing' or r.phase <> 'event_confrontation'
    or coalesce(r.state->>'event_active','') <> 'confrontation' then
    raise exception 'wrong phase';
  end if;
  perform public.igr_v13_complete_event(r.code,'confrontation');
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end;
$$;
revoke all on function public.igr_v827_end_confrontation(text,uuid) from public;
grant execute on function public.igr_v827_end_confrontation(text,uuid) to anon,authenticated;

-- Host phase skip stays available except for active conversations.
CREATE OR REPLACE FUNCTION public.igr_v4_advance_phase(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  -- Only the Investigator can stop a live interrogation or confrontation.
  -- The host can skip other stages.
  if r.phase in ('interrogation','event_confrontation') then
    raise exception 'Seul l''Enquêteur peut terminer cet échange.';
  end if;
  if r.scenario_id in ('032','033','034') and
    coalesce((r.state->>'regime_v13_active')::boolean,false) and
    r.phase='regime_court' then
    if r.phase_ends_at is null OR now()<r.phase_ends_at then
      raise exception 'courtroom time has not expired';
    end if;
    perform igr_private.igr_regime_v13_finish_court(r.code);
    return jsonb_build_object('ok',true,'phase','locking');
  end if;
  if r.phase='cycle_debrief' and r.scenario_id not in ('026','027','028')
     and not exists(select 1 from public.igr_v4_actions a
       join public.igr_v4_players p on p.id=a.player_id
       where a.room_code=r.code and a.cycle=r.cycle
         and a.action_type='debrief' and p.public_role='enqueteur') then
    raise exception 'Questionnaire de l''Enquêteur requis avant le passage à la suite.';
  end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;
  if r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'defense_current_id'-'defense_current_pseudo'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
  -- v171 final locks
  elsif r.phase='locking' and ((r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) or (r.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code))) then
    perform public.igr_v52_maybe_finish(r.code);
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  elsif r.phase in ('event_select','interrogation_select') then
    raise exception 'choice required';
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',updated_at=now() where code=r.code;
    perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$function$

