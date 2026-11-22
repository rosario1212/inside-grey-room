-- v832: forbid host skip of the Investigator's provisional accusations.
-- A provisional choice must use igr_v4_set_provisional, which preserves every suspect's defense rights.
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
  if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then
    -- A final vote is an individual and sealed decision, never a host shortcut.
    -- igr_v4_lock_final and verified absence recovery call igr_v52_maybe_finish.
    -- An incomplete ballot must remain open even if a host tries to advance.
    raise exception 'Votes finaux obligatoires : chaque membre habilité doit verrouiller sa décision (ou être confirmé absent par la procédure sécurisée).';
  end if;
  -- v832: A Host cannot erase the Investigator's provisional charges or the
  -- defendants' subsequent rights of defense by skipping this mandatory phase.
  if r.phase='provisional_lock' then
    raise exception 'Accusations provisoires requises : seul l''Enquêteur peut les verrouiller. Les défenses ne peuvent pas être ignorées.';
  end if;
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
  if r.phase='locking' and ((r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) or (r.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code))) then
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
$function$;
