-- v700 · A player departure must not strand role selections that no longer
-- exist at the remaining headcount. Preserve the most important reservations.
DO $patch$
DECLARE definition text;
        anchor text := $anchor$  return jsonb_build_object('ok',true,'left',true,'remaining',v_count);$anchor$;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure) INTO definition;
 IF position('v700 departure role reconciliation' IN definition)=0 THEN
   IF position(anchor IN definition)=0 OR position('  v_count int;' IN definition)=0
     THEN RAISE EXCEPTION 'v700 leave_room definition changed'; END IF;
   definition:=replace(definition,'  v_count int;', '  v_count int; v_role text; v_capacity int; v_released int:=0; v_affected int;');
   definition:=replace(definition,anchor,$replacement$
  -- v700 departure role reconciliation: never leave a now-unavailable role claimed.
  IF r.scenario_id NOT IN ('021','022','023','024','025') THEN
    FOR v_role IN SELECT DISTINCT x.preferred_role
      FROM public.igr_v4_players x
      WHERE x.room_code=v_code AND x.preferred_role IS NOT NULL
    LOOP
      v_capacity:=greatest(0,public.igr_v4_role_capacity(r.scenario_id,v_count,v_role));
      WITH ranked AS (
        SELECT x.id,
          row_number() OVER (ORDER BY
            CASE WHEN EXISTS (
              SELECT 1 FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(r.state->'victory_reservations')='array'
                  THEN r.state->'victory_reservations' ELSE '[]'::jsonb END
              ) claim
              WHERE claim->>'player_id'=x.id::text
                AND claim->>'claimed_role'=x.preferred_role
                AND claim->>'awarded'='true'
            ) THEN 0 ELSE 1 END,
            CASE WHEN x.is_host THEN 0 ELSE 1 END,
            x.seat_index ASC,x.id ASC) AS pos
        FROM public.igr_v4_players x
        WHERE x.room_code=v_code AND x.preferred_role=v_role
      )
      UPDATE public.igr_v4_players x
      SET preferred_role=NULL
      FROM ranked z
      WHERE z.id=x.id AND z.pos>v_capacity;
      GET DIAGNOSTICS v_affected=ROW_COUNT;
      v_released:=v_released+v_affected;
    END LOOP;
  END IF;
  return jsonb_build_object('ok',true,'left',true,'remaining',v_count,
    'role_reservations_released',v_released);$replacement$);
   EXECUTE definition;
 END IF;
END $patch$;
DO $check$
BEGIN
 IF position('v700 departure role reconciliation' IN
    pg_get_functiondef('public.igr_v4_leave_room(text,uuid)'::regprocedure))=0
 THEN RAISE EXCEPTION 'v700 leave_room reconciliation unavailable'; END IF;
END $check$;