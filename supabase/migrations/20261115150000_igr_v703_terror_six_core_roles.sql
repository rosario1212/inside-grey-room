-- IGR v703 · TERREUR 026–028: six core roles only.
-- Remove Inspector, Expert and Prosecutor from the new-game roster.
-- The three roles remain available in other DLCs.
BEGIN;

DO $patch$
DECLARE fn text; anchor text; from_pos integer; to_pos integer;
BEGIN
  SELECT pg_get_functiondef('public.igr_v4_min_players(text)'::regprocedure) INTO fn;
  IF position('v703 terror six-person minimum' IN fn)=0 THEN
    anchor := 'when p_scenario=''026'' then 6 when p_scenario=''027'' then 7 when p_scenario=''028'' then 6';
    IF position(anchor IN fn)=0 THEN RAISE EXCEPTION 'v703 minimum anchor missing'; END IF;
    fn:=replace(fn,anchor,'when p_scenario in (''026'',''027'',''028'') then 6 /* v703 terror six-person minimum */');
    EXECUTE fn;
  END IF;

  SELECT pg_get_functiondef('public.igr_v4_max_players(text)'::regprocedure) INTO fn;
  IF position('v703 terror six-person maximum' IN fn)=0 THEN
    anchor := 'when p_scenario=''026'' then 7 when p_scenario=''027'' then 8 when p_scenario=''028'' then 8';
    IF position(anchor IN fn)=0 THEN RAISE EXCEPTION 'v703 maximum anchor missing'; END IF;
    fn:=replace(fn,anchor,'when p_scenario in (''026'',''027'',''028'') then 6 /* v703 terror six-person maximum */');
    EXECUTE fn;
  END IF;

  SELECT pg_get_functiondef('public.igr_v4_role_for_seat(text,integer,integer)'::regprocedure) INTO fn;
  IF position('v703 terror six-person roster' IN fn)=0 THEN
    from_pos:=strpos(fn,'elsif p_scenario=''026'' then');
    to_pos:=strpos(fn,'elsif p_scenario=''029'' then');
    IF from_pos=0 OR to_pos<=from_pos THEN RAISE EXCEPTION 'v703 roster anchors changed'; END IF;
    fn:=left(fn,from_pos-1)||
      E'elsif p_scenario in (''026'',''027'',''028'') then\n'||
      E'   -- v703 terror six-person roster\n'||
      E'   if p_count<>6 or p_seat not between 0 and 5 then raise exception ''TERREUR requires exactly six players''; end if;\n'||
      E'   return (array[''enqueteur'',''analyste'',''officier_liaison'',''suspect'',''suspect'',''suspect'']::text[])[p_seat+1];\n '||
      substring(fn from to_pos);
    EXECUTE fn;
  END IF;

  SELECT pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure) INTO fn;
  IF position('v703 terror six-person capacities' IN fn)=0 THEN
    anchor:='if r=''avocat'' then r:=''maitre''; end if;';
    IF position(anchor IN fn)=0 THEN RAISE EXCEPTION 'v703 capacity anchor missing'; END IF;
    fn:=replace(fn,anchor,anchor||E'\n -- v703 terror six-person capacities: independent of historical specialist defaults.\n'||
      E' if p_scenario in (''026'',''027'',''028'') then\n'||
      E'   case r when ''enqueteur'',''analyste'',''officier_liaison'' then return 1;\n'||
      E'     when ''suspect'' then return 3;\n'||
      E'     else return 0; end case;\n'||
      E' end if;');
    EXECUTE fn;
  END IF;
END $patch$;

-- Regression: scenario 027 can start with six; none of the removed specialists
-- receives an automatic seat or remains claimable. Other DLC capacities survive.
DO $verify$
DECLARE sid text; role_name text; seat integer;
  expected text[]:=ARRAY['enqueteur','analyste','officier_liaison','suspect','suspect','suspect'];
BEGIN
  FOREACH sid IN ARRAY ARRAY['026','027','028'] LOOP
    IF public.igr_v4_min_players(sid)<>6 OR public.igr_v4_max_players(sid)<>6
      THEN RAISE EXCEPTION 'v703 wrong player bounds for %',sid; END IF;
    FOR seat IN 0..5 LOOP
      IF public.igr_v4_role_for_seat(sid,seat,6) IS DISTINCT FROM expected[seat+1]
        THEN RAISE EXCEPTION 'v703 wrong seat % of %',seat,sid; END IF;
    END LOOP;
    FOREACH role_name IN ARRAY ARRAY['enqueteur','analyste','officier_liaison','suspect',
      'inspecteur','expert','procureur','juge','journaliste','maitre','temoin'] LOOP
      IF public.igr_v4_role_capacity(sid,6,role_name)<>(CASE role_name
        WHEN 'suspect' THEN 3
        WHEN 'enqueteur' THEN 1 WHEN 'analyste' THEN 1 WHEN 'officier_liaison' THEN 1 ELSE 0 END)
        THEN RAISE EXCEPTION 'v703 capacity mismatch for % in %',role_name,sid; END IF;
    END LOOP;
  END LOOP;
  IF public.igr_v4_role_capacity('031',6,'maitre')<>1 THEN
    RAISE EXCEPTION 'v703 changed CARTEL 031 lawyer capacity'; END IF;
  IF public.igr_v4_role_capacity('020',13,'inspecteur')<>1 THEN
    RAISE EXCEPTION 'v703 changed case 020 Inspector capacity'; END IF;
END $verify$;

COMMIT;
