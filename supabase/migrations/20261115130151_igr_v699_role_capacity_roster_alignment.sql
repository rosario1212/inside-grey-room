-- v699 · Align lobby capacities with actual start-game seat allocations.
-- Omerta keeps its separate role allocator; unchanged roles and hidden dossiers stay sealed.
DO $patch$
DECLARE definition text;
        anchor text := 'if r=''avocat'' then r:=''maitre''; end if;';
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure) INTO definition;
 IF position('v699 roster capacity sync' IN definition)=0 THEN
   IF position(anchor IN definition)=0 THEN RAISE EXCEPTION 'v699 anchor changed'; END IF;
   definition := replace(definition,anchor,$replacement$
 if r='avocat' then r:='maitre'; end if;
 -- v699 roster capacity sync: lobby selection must match the server's start roster.
 IF p_scenario BETWEEN '035' AND '039' THEN
   CASE r
     WHEN 'enqueteur','analyste' THEN RETURN 1;
     WHEN 'suspect' THEN RETURN 3;
     WHEN 'expert' THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END;
     WHEN 'procureur' THEN RETURN CASE WHEN p_count>=7 THEN 1 ELSE 0 END;
     ELSE RETURN 0;
   END CASE;
 END IF;
 IF p_scenario BETWEEN '040' AND '044' THEN
   CASE r
     WHEN 'enqueteur','analyste','maitre' THEN RETURN 1;
     WHEN 'suspect' THEN RETURN 4;
     ELSE RETURN 0;
   END CASE;
 END IF;
 IF r='analyste' AND
    ((p_scenario IN ('001','003','004','005','006') AND p_count<5)
      OR (p_scenario='002' AND p_count<6))
 THEN RETURN 0; END IF;
 IF r='expert' AND p_scenario IN ('003','009')
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;
 IF r='juge' AND p_scenario='008'
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;
 IF r='procureur' AND p_scenario='011'
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;
$replacement$);
   EXECUTE definition;
 END IF;
END $patch$;

-- Exhaustive database regression: every published/legacy seat map, every legal
-- headcount and every public role capacity must agree, including inverse checks.
DO $test$
DECLARE sid text; n integer; minimum integer; maximum integer;
        role_name text; expected integer; capacity integer;
        kinds text[] := ARRAY['enqueteur','analyste','suspect','procureur','juge',
          'journaliste','maitre','inspecteur','expert','temoin','officier_liaison','don','bras_droit'];
BEGIN
 FOR i IN 1..44 LOOP
   IF i BETWEEN 21 AND 25 THEN CONTINUE; END IF;
   sid:=lpad(i::text,3,'0');
   minimum:=public.igr_v4_min_players(sid);
   maximum:=public.igr_v4_max_players(sid);
   FOR n IN minimum..maximum LOOP
     FOREACH role_name IN ARRAY kinds LOOP
       SELECT count(*) INTO expected
         FROM generate_series(0,n-1) seat
         WHERE public.igr_v4_role_for_seat(sid,seat,n)=role_name;
       capacity:=public.igr_v4_role_capacity(sid,n,role_name);
       IF expected<>capacity THEN RAISE EXCEPTION 'v699 % at % players: role % expected %, got %',
         sid,n,role_name,expected,capacity; END IF;
     END LOOP;
   END LOOP;
 END LOOP;
 IF public.igr_v4_role_capacity('031',1,'maitre')<>1 THEN RAISE EXCEPTION 'v698 regressed'; END IF;
 IF public.igr_v4_role_capacity('029',6,'maitre')<>0 THEN RAISE EXCEPTION '029 lawyer appeared'; END IF;
END $test$;