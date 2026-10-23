-- Private operator-only smoke test, no scene text or secret tokens returned.
-- Run BEFORE release: the 007 gate must still deny creation and investigation.
-- All successful QA rooms are explicitly rolled back in one subtransaction.
do $tests$
declare
  host jsonb;
  player_count int;
  role_count int;
  room_state text;
  report jsonb := '{}'::jsonb;
begin
  -- A rogue old client must not circumvent the new database room guard.
  begin
    perform public.igr_v4_create_room('Q7V95','007','Unreleased QA');
    raise exception 'SECURITY FAILURE: 007 room was accepted' using errcode='ZX005';
  exception when sqlstate 'P0001' then
    report=report||jsonb_build_object('007_denied',true);
  end;

  -- Existing dossiers must still be able to create/start five-player sessions.
  begin
    host=public.igr_v4_create_room('Q6V95','006','QA one');
    perform public.igr_v4_join_room('Q6V95','QA two');
    perform public.igr_v4_join_room('Q6V95','QA three');
    perform public.igr_v4_join_room('Q6V95','QA four');
    perform public.igr_v4_join_room('Q6V95','QA five');
    select count(*),count(*) filter (where public_role is not null)
      into player_count,role_count from public.igr_v4_players where room_code='Q6V95';
    perform public.igr_v4_start_game('Q6V95',(host->>'host_token')::uuid);
    select status into room_state from public.igr_v4_rooms where code='Q6V95';
    if player_count<>5 or role_count<>5 or room_state<>'playing' then
      raise exception 'Existing scenario gameplay regression' using errcode='ZX006';
    end if;
    report=report||jsonb_build_object('legacy_five_players_ok',true);
    raise exception 'ROLLBACK SUCCESSFUL TEST DATA' using errcode='ZX007';
  exception when sqlstate 'ZX007' then
    perform set_config('igr.qa_v295',report::text,true);
  end;
end $tests$;

select current_setting('igr.qa_v295',true)::jsonb as pre_release_checks,
       (select count(*) from public.igr_v4_rooms where code='Q6V95') as persisted_qa_rooms,
       igr_private.igr_v281_007_release_status() as actual_release_status;
