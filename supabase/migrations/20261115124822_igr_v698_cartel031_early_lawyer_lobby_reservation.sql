-- v698 · CARTEL 031: the lawyer is a mandatory seat at launch (6–8 players).
-- Reserving that seat in the lobby must work as soon as the host creates the room.
-- Keep the start-game roster, lobby ownership checks and all other scenarios unchanged.
DO $patch$
DECLARE definition text;
        before_ text := 'when p_scenario=''031'' and p_count>=6 then 1';
        after_ text := 'when p_scenario=''031'' then 1 /* v698 cartel031 early lobby lawyer reservation */';
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure)
 INTO definition;
 IF position('v698 cartel031 early lobby lawyer reservation' IN definition)=0 THEN
   IF position(before_ IN definition)=0 THEN
     RAISE EXCEPTION 'v698 role capacity anchor changed; refusing blind patch';
   END IF;
   definition:=replace(definition,before_,after_);
   EXECUTE definition;
 END IF;
END $patch$;

DO $check$
BEGIN
 IF public.igr_v4_role_capacity('031',1,'maitre')<>1
    OR public.igr_v4_role_capacity('031',1,'avocat')<>1
    OR public.igr_v4_role_capacity('031',6,'maitre')<>1
    OR public.igr_v4_role_capacity('031',8,'maitre')<>1
 THEN RAISE EXCEPTION '031 lawyer reservation regression'; END IF;
 IF public.igr_v4_role_capacity('030',7,'maitre')<>0
    OR public.igr_v4_role_capacity('030',8,'maitre')<>1
 THEN RAISE EXCEPTION '030 lawyer seat unexpectedly changed'; END IF;
END $check$;
