-- v630: optional confidential spy missions. Manifests/mole identities are never public.
-- Deploy only after SQL rollback smoke test, PR CI, and CF validation.
CREATE TABLE IF NOT EXISTS igr_private.igr_v630_spy_assignments (
 room_code text NOT NULL REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES public.igr_v4_players(id) ON DELETE CASCADE,
 match_no integer NOT NULL DEFAULT 1,
 mission_key text NOT NULL,
 assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(room_code,player_id)
);
CREATE TABLE IF NOT EXISTS igr_private.igr_v630_spy_signals (
 room_code text NOT NULL, player_id uuid NOT NULL,
 cycle integer NOT NULL CHECK(cycle BETWEEN 1 AND 3),
 sent_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(room_code,player_id,cycle),
 FOREIGN KEY(room_code,player_id)
 REFERENCES igr_private.igr_v630_spy_assignments(room_code,player_id) ON DELETE CASCADE
);
ALTER TABLE igr_private.igr_v630_spy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE igr_private.igr_v630_spy_signals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v630_spy_assignments FROM PUBLIC,anon,authenticated;
REVOKE ALL ON igr_private.igr_v630_spy_signals FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_mission(p_scenario text)
RETURNS text LANGUAGE plpgsql STABLE SET search_path=pg_catalog AS $fn$
DECLARE m text;
BEGIN
 m:=CASE p_scenario
 WHEN '003' THEN 'Centre Helios : sauvegarder le contact clandestin lié au protocole.'
 WHEN '011' THEN '36 Heures : maintenir secrètement un canal avec un réseau extérieur.'
 WHEN '013' THEN 'Ligne de Mire : préserver le canal PERSEUS entre accès et financement.'
 WHEN '014' THEN 'Sous Secret : garder un canal de renseignement étranger.'
 WHEN '016' THEN 'Le Dernier Étage : protéger le canal du réseau narcotique.'
 WHEN '019' THEN 'Le Grand Bal : préserver un intermédiaire financier.'
 WHEN '020' THEN 'L’Apothéose : garder la trace du réseau financier.'
 WHEN '030' THEN 'Cartel : protéger la liaison clandestine du réseau sans dévoiler ta couverture.'
 WHEN '031' THEN 'La Dette : protéger une liaison discrète avec El Luto.'
 ELSE 'Protéger une liaison secrète.' END;
 RETURN m||E'\n\nPour réussir, transmets secrètement une fois au cycle 1 OU au cycle 2, puis une fois au cycle 3, avant la fin de partie. Ta mission est indépendante de la précision du verdict. Tu conserves ton rôle public, ta personnalité et ses contraintes. Tu ne peux pas fabriquer ou modifier des preuves.';
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v630_spy_mission(text) FROM PUBLIC,anon,authenticated;

-- Run last alphabetically after the canonical game-start triggers for 030/031.
CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_finalize_start()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n int;k int; actor record; mission text; match_num int; motive text; forged text;
BEGIN
 IF NOT (OLD.status='lobby' AND NEW.status='playing') THEN RETURN NEW;END IF;
 IF NEW.scenario_id NOT IN ('003','011','013','014','016','019','020','030','031') THEN RETURN NEW;END IF;
 SELECT count(*) INTO n FROM public.igr_v4_players WHERE room_code=NEW.code;
 k:=CASE WHEN NEW.scenario_id='030' AND n=9 THEN floor(random()*3)::int
         ELSE floor(random()*2)::int END;
 match_num:=greatest(1,coalesce((NEW.state->>'match_no')::int,1));
 DELETE FROM igr_private.igr_v630_spy_assignments WHERE room_code=NEW.code;
 UPDATE public.igr_v4_players
 SET secret_role=public_role,private_state=coalesce(private_state,'{}'::jsonb)-'secret_mission'
 WHERE room_code=NEW.code;
 IF k>0 THEN
  FOR actor IN SELECT id FROM public.igr_v4_players WHERE room_code=NEW.code AND (
   (NEW.scenario_id='030' AND public_role IN ('analyste','procureur','maitre','journaliste'))
   OR (NEW.scenario_id='031' AND public_role IN ('analyste','procureur','maitre','temoin'))
   OR (NEW.scenario_id NOT IN ('030','031') AND public_role='suspect')
  ) ORDER BY gen_random_uuid() LIMIT k LOOP
   INSERT INTO igr_private.igr_v630_spy_assignments(room_code,player_id,match_no,mission_key)
   VALUES(NEW.code,actor.id,match_num,NEW.scenario_id);
   mission:=igr_private.igr_v630_spy_mission(NEW.scenario_id);
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
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v630_spy_finalize_start() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v630_spy_finalize_start ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v630_spy_finalize_start AFTER UPDATE OF status ON public.igr_v4_rooms
 FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v630_spy_finalize_start();

-- Authenticated by one specific player's opaque token; no public event/action created.
CREATE OR REPLACE FUNCTION public.igr_v630_spy_transmit(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;inserted integer;
BEGIN
 PERFORM igr_private.rate_limit('spy_signal',p_player_token::text,6,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF p.id IS NULL OR p.secret_role<>'espion' THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
    OR r.phase IN ('briefing','role_reading') THEN RAISE EXCEPTION 'signal unavailable';END IF;
 IF NOT EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_assignments
 WHERE room_code=r.code AND player_id=p.id AND match_no=greatest(1,coalesce((r.state->>'match_no')::integer,1)))
 THEN RAISE EXCEPTION 'mission not assigned'; END IF;
 INSERT INTO igr_private.igr_v630_spy_signals(room_code,player_id,cycle)
 VALUES(r.code,p.id,r.cycle) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>1 THEN RAISE EXCEPTION 'already transmitted';END IF;
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,
  'signals',(SELECT count(*) FROM igr_private.igr_v630_spy_signals WHERE room_code=r.code AND player_id=p.id));
END $fn$;
REVOKE ALL ON FUNCTION public.igr_v630_spy_transmit(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v630_spy_transmit(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_success(p_room text,p_player uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $fn$
 SELECT EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_signals WHERE room_code=p_room AND player_id=p_player AND cycle IN (1,2))
    AND EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_signals WHERE room_code=p_room AND player_id=p_player AND cycle=3);
$fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v630_spy_success(text,uuid) FROM PUBLIC,anon,authenticated;

-- Modify only assigned spies; preserve everyone else's results and add winners from final success values.
CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_reveal_overlay(p_room text,p_result jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
DECLARE entry jsonb;updated jsonb:='[]'::jsonb;winners jsonb:='[]'::jsonb;pid uuid;won boolean;
BEGIN
 IF jsonb_typeof(p_result->'results')<>'array'
 OR NOT EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_assignments WHERE room_code=p_room)
 THEN RETURN p_result; END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_result->'results') LOOP
   IF entry->>'player_id' IS NOT NULL THEN
     pid:=(entry->>'player_id')::uuid;
     IF EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_assignments
      WHERE room_code=p_room AND player_id=pid) THEN
       won:=igr_private.igr_v630_spy_success(p_room,pid);
       entry:=entry||jsonb_build_object(
        'role','espion','success',won,'personal_objective_success',won,
        'text',CASE WHEN won THEN 'Les deux transmissions ont atteint le réseau. Ta mission réussit indépendamment du verdict.'
          ELSE 'La mission clandestine échoue : les deux transmissions requises ne sont pas parvenues.' END,
        'achievements','[]'::jsonb);
       IF entry ? 'victories' THEN entry:=jsonb_set(entry,'{victories,personal}',to_jsonb(won),true);END IF;
     END IF;
   END IF;
   updated:=updated||jsonb_build_array(entry);
   IF coalesce((entry->>'success')::boolean,false) AND entry->>'player_id' IS NOT NULL
     THEN winners:=winners||jsonb_build_array(entry->>'player_id');END IF;
 END LOOP;
 RETURN p_result||jsonb_build_object('results',updated,'winners',winners,'winner_count',jsonb_array_length(winners));
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v630_spy_reveal_overlay(text,jsonb) FROM PUBLIC,anon,authenticated;

-- Strictly guarded source wrapping of the canonical final result, INCLUDING the special 031 ending.
DO $patch$ DECLARE def text; early text;BEGIN
 def:=pg_get_functiondef('public.igr_v52_make_reveal(text)'::regprocedure);
 IF position('igr_v630_spy_reveal_overlay' IN def)>0 THEN RAISE EXCEPTION 'v630 already attached; abort duplicate';END IF;
 early:='return igr_private.igr_v171_031_make_reveal(p_room);';
 IF position(early IN def)=0 THEN RAISE EXCEPTION '031 reveal hook missing';END IF;
 def:=replace(def,early,'return igr_private.igr_v630_spy_reveal_overlay(p_room,igr_private.igr_v171_031_make_reveal(p_room));');
 IF position('return igr_private.igr_v607_020_reveal_enrich(p_room,' IN def)=0 THEN
   RAISE EXCEPTION 'canonical scorer hook changed';END IF;
 def:=replace(def,'return igr_private.igr_v607_020_reveal_enrich(p_room,',
                  'spy_base:=igr_private.igr_v607_020_reveal_enrich(p_room,');
 IF position(E'\nend\n$function$' IN def)=0 THEN RAISE EXCEPTION 'canonical scorer tail changed';END IF;
 def:=replace(def,E'\nend\n$function$',E'\nreturn igr_private.igr_v630_spy_reveal_overlay(p_room,spy_base);\nend\n$function$');
 EXECUTE def;
END $patch$;
