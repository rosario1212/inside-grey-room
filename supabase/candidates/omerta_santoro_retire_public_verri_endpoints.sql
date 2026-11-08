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
REVOKE EXECUTE ON FUNCTION public.igr_omerta_legacy_sync_core(text,uuid)
  FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF has_function_privilege('anon','public.igr_omerta_start_game(text,uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.igr_omerta_start_game(text,uuid)','EXECUTE')
   OR has_function_privilege('anon','public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.igr_omerta_legacy_sync_core(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Verri public API still exposed'; END IF;
  IF NOT has_function_privilege('anon','public.igr_omerta_start_standalone(text,uuid)','EXECUTE')
   OR NOT has_function_privilege('authenticated','public.igr_omerta_standalone_safe_sync(text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Santoro entrypoint unavailable'; END IF;
END$$;
COMMIT;
