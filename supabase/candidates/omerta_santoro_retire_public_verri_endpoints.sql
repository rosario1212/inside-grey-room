-- Omerta Santoro: decommission direct API access to historical Verri internals.
-- Production operation, deliberately NOT a release approval.
-- The canonical SECURITY DEFINER public.igr_omerta_start_standalone
-- and public.igr_omerta_standalone_safe_sync are owned by postgres and
-- still call these internal implementations. Do not DROP the functions,
-- tables, historical room logs or their dependencies.
--
-- Apply after the Santoro-only frontend has passed CI and been deployed.
-- Rollback: GRANT EXECUTE ON FUNCTION ... TO anon,authenticated;
BEGIN;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_start_game(text,uuid)
  FROM PUBLIC, anon, authenticated;
-- The old level-based revelation, arbitrary sanction and protection API does
-- not score against the independently sourced Santoro canon.
REVOKE EXECUTE ON FUNCTION public.igr_omerta_action(text,uuid,text,uuid,integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_legacy_sync_core(text,uuid)
  FROM PUBLIC, anon, authenticated;
-- Legacy Verri informant and money-intel entrypoints are not used by
-- Santoro autonomous rooms; the newer Santoro *_indic_* RPCs stay public.
REVOKE EXECUTE ON FUNCTION public.igr_omerta_indic_final_assess(text,uuid,uuid,boolean,integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_indic_offer(text,uuid,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_indic_protect(text,uuid,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_indic_respond(text,uuid,boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_money_intel_options(text,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_money_intel_signal(text,uuid,text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.igr_omerta_money_intel_send(text,uuid,text)
  FROM PUBLIC, anon, authenticated;
DO $
BEGIN
  IF has_function_privilege('anon','public.igr_omerta_start_game(text,uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.igr_omerta_start_game(text,uuid)','EXECUTE')
   OR has_function_privilege('anon','public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Verri public API still exposed'; END IF;
  IF EXISTS(
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
    AND p.proname IN(
      'igr_omerta_indic_final_assess','igr_omerta_indic_offer',
      'igr_omerta_indic_protect','igr_omerta_indic_respond',
      'igr_omerta_money_intel_options','igr_omerta_money_intel_signal',
      'igr_omerta_money_intel_send'
    )
    AND (
      has_function_privilege('anon',p.oid,'EXECUTE') OR
      has_function_privilege('authenticated',p.oid,'EXECUTE')
    )
  ) THEN RAISE EXCEPTION 'Legacy Verri Indic API still exposed'; END IF;
  IF NOT has_function_privilege('anon','public.igr_omerta_santoro_indic_action(text,uuid,text,uuid,text,boolean,integer)','EXECUTE')
   OR NOT has_function_privilege('authenticated','public.igr_omerta_santoro_indic_status(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Santoro informant API unavailable'; END IF;
  IF has_function_privilege('anon','public.igr_omerta_action(text,uuid,text,uuid,integer)','EXECUTE')
     OR has_function_privilege('authenticated','public.igr_omerta_action(text,uuid,text,uuid,integer)','EXECUTE')
  THEN RAISE EXCEPTION 'Legacy arbitrary action still exposed'; END IF;
  IF NOT has_function_privilege('anon','public.igr_omerta_start_standalone(text,uuid)','EXECUTE')
   OR NOT has_function_privilege('authenticated','public.igr_omerta_standalone_safe_sync(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Santoro entrypoint unavailable'; END IF;
END$$;
COMMIT;
