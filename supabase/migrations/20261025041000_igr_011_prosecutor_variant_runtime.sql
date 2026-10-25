-- The optional 011 Prosecutor must use the privately pinned A/B/C verdict,
-- not the legacy static pack when selecting a confidential corrupt objective.
-- All other scenarios keep their current prosecutor behavior.
DO $prosecutor_variant$
DECLARE source_sql text; needle text; inserted text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v47_ensure_prosecutor_runtime(text,uuid)'::regprocedure) INTO source_sql;
 needle := 'select sp.pack into pack from public.igr_v4_scenario_packs sp join public.igr_v4_rooms r on r.scenario_id=sp.scenario_id where r.code=p_room;';
 inserted := 'if exists(select 1 from public.igr_v4_rooms where code=p_room and scenario_id=''011'') then pack:=coalesce(igr_private.igr_v371_011_pinned_pack(p_room),pack);end if;';
 IF position(inserted in source_sql)=0 THEN
   IF position(needle in source_sql)=0 THEN
     RAISE EXCEPTION 'Prosecutor runtime core has changed — refusing unsafe patch';
   END IF;
   source_sql := replace(source_sql,needle,needle||E'\n '||inserted);
 END IF;
 EXECUTE source_sql;
END;
$prosecutor_variant$;

DO $validate_prosecutor$
BEGIN
 IF position('igr_private.igr_v371_011_pinned_pack(p_room)'
   in pg_get_functiondef('public.igr_v47_ensure_prosecutor_runtime(text,uuid)'::regprocedure))=0 THEN
  RAISE EXCEPTION '011 Prosecutor pinned variant not consulted';
 END IF;
END;
$validate_prosecutor$;
