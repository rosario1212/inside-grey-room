-- v631: audit fixes for hidden spies: absence, irreversible cartel outcomes, final phases,
-- milestone achievements, and mission-specific decisions verified on the server.
ALTER TABLE igr_private.igr_v630_spy_signals ADD COLUMN IF NOT EXISTS choice text;
REVOKE ALL ON igr_private.igr_v630_spy_signals FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v631_spy_mission(p_scenario text,p_route text)
RETURNS text LANGUAGE plpgsql STABLE SET search_path='' AS $fn$
DECLARE context_ text; channel_ text; finish_ text;
BEGIN
 context_:=CASE p_scenario
  WHEN '003' THEN 'Centre Helios : protège le témoin qui connaît la chaîne d’accès au protocole.'
  WHEN '011' THEN '36 Heures : protège le lien confidentiel entre les officiers et l’observateur extérieur.'
  WHEN '013' THEN 'Ligne de Mire : sécurise le lien PERSEUS entre les accès et les fonds.'
  WHEN '014' THEN 'Sous Secret : protège la source du service extérieur exposée par la fuite.'
  WHEN '016' THEN 'Le Dernier Étage : préserve le témoin financier du réseau narcotique.'
  WHEN '019' THEN 'Le Grand Bal : garde en sécurité la piste de l’intermédiaire financier.'
  WHEN '020' THEN 'L’Apothéose : conserve le canal discret lié aux flux financiers.'
  WHEN '030' THEN 'DLC Cartel : protège la liaison du réseau sans falsifier la pièce I-14.'
  WHEN '031' THEN 'DLC Cartel : protège une liaison confidentielle avec les hommes d’El Luto.'
  ELSE 'Protège ton contact clandestin.' END;
 IF p_route='source' THEN
  channel_:='**Ton contact est une personne.** Avant la fin du cycle 2, privilégie SOURCE (et non ARCHIVES).';
  finish_:='Au cycle 3, choisis PROTÉGER : garder la source hors du dossier public. Vérifier des copies serait une fausse piste.';
 ELSIF p_route='archive' THEN
  channel_:='**Ton contact est une archive authentique.** Avant la fin du cycle 2, privilégie ARCHIVES (et non SOURCE).';
  finish_:='Au cycle 3, choisis VÉRIFIER : sceller l’empreinte du document authentique sans le modifier. Protéger une source imaginaire serait une fausse piste.';
 ELSE RAISE EXCEPTION 'spy route invalid';END IF;
 RETURN context_||E'\n\nMission confidentielle et indépendante du verdict :\n'
 ||channel_||E'\n'||finish_
 ||E'\nChaque étape est un choix irréversible. Une fausse destination compromet la mission. Aucun indice, preuve ou événement officiel ne peut être modifié. Une absence, un abandon de mandat sanctionné ou une mort définitive annule ta victoire.';
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v631_spy_mission(text,text) FROM PUBLIC,anon,authenticated;

-- Pin one route to the confidential assignment when role distribution finishes.
DO $patch$
DECLARE def text;
BEGIN
 def:=pg_get_functiondef('igr_private.igr_v630_spy_finalize_start()'::regprocedure);
 IF position('igr_v631_spy_mission' IN def)>0 THEN RAISE EXCEPTION 'v631 spy start already patched';END IF;
 IF position('motive text; forged text;' IN def)=0 OR
    position('VALUES(NEW.code,actor.id,match_num,NEW.scenario_id);' IN def)=0 OR
    position('mission:=igr_private.igr_v630_spy_mission(NEW.scenario_id);' IN def)=0
 THEN RAISE EXCEPTION 'v630 spy start shape changed';END IF;
 def:=replace(def,'motive text; forged text;','motive text; forged text; route_ text;');
 def:=replace(def,'   INSERT INTO igr_private.igr_v630_spy_assignments(room_code,player_id,match_no,mission_key)',
  '   route_:=CASE WHEN random()<0.5 THEN ''source'' ELSE ''archive'' END;'||E'\n'
  ||'   INSERT INTO igr_private.igr_v630_spy_assignments(room_code,player_id,match_no,mission_key)');
 def:=replace(def,'VALUES(NEW.code,actor.id,match_num,NEW.scenario_id);',
                 'VALUES(NEW.code,actor.id,match_num,NEW.scenario_id||'':''||route_);');
 def:=replace(def,'mission:=igr_private.igr_v630_spy_mission(NEW.scenario_id);',
                 'mission:=igr_private.igr_v631_spy_mission(NEW.scenario_id,route_);');
 EXECUTE def;
END $patch$;

-- Old no-choice endpoint can no longer let a player bypass the meaningful mission choice.
REVOKE ALL ON FUNCTION public.igr_v630_spy_transmit(text,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v631_spy_decide(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
        assignment_ igr_private.igr_v630_spy_assignments%rowtype;
        stage_ int; expect_ text; route_ text; inserted int;
BEGIN
 PERFORM igr_private.rate_limit('spy_decision',p_player_token::text,6,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF p.id IS NULL OR p.secret_role<>'espion' THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
    OR r.phase IN ('briefing','role_reading','closed','locking','reveal','final_debrief')
    OR r.phase LIKE 'final_%'
 THEN RAISE EXCEPTION 'spy mission phase closed';END IF;
 SELECT * INTO assignment_ FROM igr_private.igr_v630_spy_assignments
 WHERE room_code=r.code AND player_id=p.id
 AND match_no=greatest(1,coalesce((r.state->>'match_no')::int,1));
 IF assignment_.player_id IS NULL THEN RAISE EXCEPTION 'spy mission assignment absent'; END IF;
 route_:=split_part(assignment_.mission_key,':',2);
 IF route_ NOT IN ('source','archive') THEN RAISE EXCEPTION 'spy mission route unavailable';END IF;
 stage_:=CASE WHEN r.cycle IN (1,2) THEN 1 ELSE 3 END;
 IF stage_=1 THEN
   IF p_choice NOT IN ('source','archive') THEN RAISE EXCEPTION 'invalid early choice';END IF;
   IF EXISTS (SELECT 1 FROM igr_private.igr_v630_spy_signals
    WHERE room_code=r.code AND player_id=p.id AND cycle IN (1,2))
   THEN RAISE EXCEPTION 'early choice already sealed';END IF;
   expect_:=route_;
 ELSE
   IF p_choice NOT IN ('protect','verify') THEN RAISE EXCEPTION 'invalid final choice'; END IF;
   IF NOT EXISTS (SELECT 1 FROM igr_private.igr_v630_spy_signals
     WHERE room_code=r.code AND player_id=p.id AND cycle IN (1,2))
   THEN RAISE EXCEPTION 'early mission stage missing';END IF;
   expect_:=CASE WHEN route_='source' THEN 'protect' ELSE 'verify' END;
 END IF;
 INSERT INTO igr_private.igr_v630_spy_signals(room_code,player_id,cycle,choice)
 VALUES(r.code,p.id,r.cycle,p_choice) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>1 THEN RAISE EXCEPTION 'spy choice already sealed';END IF;
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,'sealed',true,
  'stage',stage_,'matched',p_choice=expect_);
END $fn$;
REVOKE ALL ON FUNCTION public.igr_v631_spy_decide(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v631_spy_decide(text,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v631_spy_success(p_room text,p_player uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $fn$
 SELECT EXISTS(
  SELECT 1 FROM igr_private.igr_v630_spy_assignments a
  JOIN igr_private.igr_v630_spy_signals early
   ON early.room_code=a.room_code AND early.player_id=a.player_id AND early.cycle IN (1,2)
  JOIN igr_private.igr_v630_spy_signals final
   ON final.room_code=a.room_code AND final.player_id=a.player_id AND final.cycle=3
  WHERE a.room_code=p_room AND a.player_id=p_player AND
   early.choice=split_part(a.mission_key,':',2)
   AND final.choice=CASE WHEN split_part(a.mission_key,':',2)='source' THEN 'protect' ELSE 'verify' END
 );
$fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v631_spy_success(text,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v630_spy_reveal_overlay(p_room text,p_result jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
DECLARE entry jsonb; updated jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
        pid uuid; won boolean; p public.igr_v4_players%rowtype;
        absent jsonb;achievements jsonb;old_achievement jsonb;
        exact_ int;total_ int;
BEGIN
 IF jsonb_typeof(p_result->'results')<>'array'
 OR NOT EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_assignments WHERE room_code=p_room)
 THEN RETURN p_result; END IF;
 absent:=coalesce(p_result->'absent_players','[]'::jsonb);
 exact_:=coalesce((p_result#>>'{accuracy,exact}')::int,0);
 total_:=greatest(1,coalesce((p_result#>>'{accuracy,total}')::int,1));
 FOR entry IN SELECT value FROM jsonb_array_elements(p_result->'results') LOOP
   IF entry->>'player_id' IS NOT NULL THEN
    pid:=(entry->>'player_id')::uuid;
    IF EXISTS(SELECT 1 FROM igr_private.igr_v630_spy_assignments
      WHERE room_code=p_room AND player_id=pid) THEN
       SELECT * INTO p FROM public.igr_v4_players WHERE room_code=p_room AND id=pid;
       won:=igr_private.igr_v631_spy_success(p_room,pid)
         AND NOT (absent ? pid::text)
         AND NOT coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false)
         AND NOT coalesce((entry->>'forfeited')::boolean,false)
         AND coalesce(entry->>'family_fate','')<>'killed'
         AND coalesce(entry->>'fate','') NOT IN ('killed','executed','dead');
       -- Keep achievements unrelated to the removed old verdict-only spy victory rule.
       achievements:='[]'::jsonb;
       FOR old_achievement IN SELECT value FROM jsonb_array_elements(coalesce(entry->'achievements','[]'::jsonb)) LOOP
         IF old_achievement <> to_jsonb('espion_ombre'::text) THEN
           achievements:=achievements||jsonb_build_array(old_achievement);
         END IF;
       END LOOP;
       IF won AND exact_*2<=total_ THEN
        achievements:=achievements||jsonb_build_array('espion_ombre');
       END IF;
       entry:=entry||jsonb_build_object(
        'role','espion','success',won,'personal_objective_success',won,
        'text',CASE WHEN coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false)
                      OR coalesce((entry->>'forfeited')::boolean,false)
              THEN coalesce(entry->>'text','')||' Ta mission d’espion ne peut annuler cette sanction définitive.'
              WHEN absent ? pid::text
              THEN coalesce(entry->>'text','')||' Joueur absent : mission non validée.'
              WHEN coalesce(entry->>'fate','') IN ('killed','executed','dead')
              THEN coalesce(entry->>'text','')||' Une mort définitive interdit toute victoire.'
              WHEN won
              THEN 'Ta mission clandestine est accomplie : les deux choix confidentiels correspondent au bon contact, indépendamment du verdict.'
              ELSE 'Ta mission clandestine échoue : un choix manque ou ne correspond pas au véritable contact.' END,
        'achievements',achievements);
       IF entry ? 'victories' THEN
         entry:=jsonb_set(entry,'{victories,personal}',to_jsonb(won),true);
       END IF;
    END IF;
   END IF;
   updated:=updated||jsonb_build_array(entry);
   IF coalesce((entry->>'success')::boolean,false) AND entry->>'player_id' IS NOT NULL
   THEN winners:=winners||jsonb_build_array((entry->>'player_id')::uuid); END IF;
 END LOOP;
 RETURN p_result||jsonb_build_object('results',updated,
  'winners',winners,'winner_count',jsonb_array_length(winners));
END $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v630_spy_reveal_overlay(text,jsonb) FROM PUBLIC,anon,authenticated;
