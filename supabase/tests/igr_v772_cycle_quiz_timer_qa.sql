-- v772 introspection smoke tests; run after deploying migration in a test database.
do $$
begin
 if to_regprocedure('igr_private.igr_v772_one_choice()') is null then raise exception 'v772 action guard missing'; end if;
 if to_regprocedure('igr_private.igr_v772_phase_timer()') is null then raise exception 'v772 phase timer missing'; end if;
 if to_regprocedure('public.igr_v772_cast_names(text,uuid)') is null then raise exception 'v772 cast RPC missing'; end if;
 if not exists(select 1 from pg_trigger where tgname='igr_v772_one_choice' and not tgisinternal) then raise exception 'v772 action trigger missing'; end if;
 if not exists(select 1 from pg_trigger where tgname='igr_v772_phase_timer' and not tgisinternal) then raise exception 'v772 timer trigger missing'; end if;
 if position('if r.phase=''cycle_debrief'' then perform public.igr_v4_emit_trame' in
    pg_get_functiondef('public.igr_v4_tick(text)'::regprocedure))>0 then
   raise exception 'questionnaire still bypassed by tick';
 end if;
end $$;
