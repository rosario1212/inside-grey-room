-- New match in the same room must not inherit prior spy choices.
-- Preserve all variant facts and public gameplay; reset only sealed private signals.
CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_finalize_start()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE n int;k int; actor record; mission text; match_num int; motive text; forged text; route_ text;
BEGIN
 IF NOT (OLD.status='lobby' AND NEW.status='playing') THEN RETURN NEW;END IF;
 IF NEW.scenario_id NOT IN ('003','011','013','014','016','019','020','030','031') THEN RETURN NEW;END IF;
 SELECT count(*) INTO n FROM public.igr_v4_players WHERE room_code=NEW.code;
 k:=CASE WHEN NEW.scenario_id='030' THEN CASE WHEN n=9 THEN 2 ELSE 1 END
         ELSE floor(random()*2)::int END;
 match_num:=greatest(1,coalesce((NEW.state->>'match_no')::int,1));
 -- A rematch reuses player ids and room codes: old stage choices must not persist.
 DELETE FROM igr_private.igr_v630_spy_signals WHERE room_code=NEW.code;
 DELETE FROM igr_private.igr_v630_spy_assignments WHERE room_code=NEW.code;
 UPDATE public.igr_v4_players
 SET secret_role=public_role,private_state=coalesce(private_state,'{}'::jsonb)-'secret_mission'
 WHERE room_code=NEW.code AND NEW.scenario_id<>'030';
 IF NEW.scenario_id='030' AND (SELECT count(*) FROM public.igr_v4_players p WHERE p.room_code=NEW.code AND p.secret_role='espion')<>k
 THEN RAISE EXCEPTION '030 spy assignment and chapter cast disagree';END IF;
 IF k>0 THEN
  FOR actor IN SELECT id FROM public.igr_v4_players WHERE room_code=NEW.code AND (
   (NEW.scenario_id='030' AND secret_role='espion')
   OR (NEW.scenario_id='031' AND public_role IN ('analyste','procureur','maitre','temoin'))
   OR (NEW.scenario_id NOT IN ('030','031') AND public_role='suspect')
  ) ORDER BY gen_random_uuid() LIMIT k LOOP
   route_:=CASE WHEN random()<0.5 THEN 'source' ELSE 'archive' END;
   INSERT INTO igr_private.igr_v630_spy_assignments(room_code,player_id,match_no,mission_key)
   VALUES(NEW.code,actor.id,match_num,NEW.scenario_id||':'||route_);
   mission:=igr_private.igr_v631_spy_mission(NEW.scenario_id,route_);
   IF NEW.scenario_id='030' THEN
    SELECT manuscript#>>'{canonical_truth,mole_motive}',
           manuscript#>>'{canonical_truth,forged_I14_field}'
      INTO motive,forged FROM igr_private.igr_v110_030_room_variants WHERE room_code=NEW.code;
    IF motive IS NOT NULL THEN mission:=mission||E'\nMotif : '||motive;END IF;
    IF forged IS NOT NULL THEN mission:=mission||E'\nIndice : le champ I-14 « '||forged||' » a été falsifié. Il est interdit de falsifier toi-même une pièce.';END IF;
   END IF;
   UPDATE public.igr_v4_players
   SET secret_role='espion',private_state=coalesce(private_state,'{}'::jsonb)||jsonb_build_object('secret_mission',mission)
   WHERE id=actor.id AND room_code=NEW.code;
  END LOOP;
 END IF;
 RETURN NEW;
END $function$
;
