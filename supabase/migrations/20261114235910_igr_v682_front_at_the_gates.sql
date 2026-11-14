
BEGIN;
-- Preserve the formerly released routines for a reversible rollout.
CREATE TABLE IF NOT EXISTS igr_private.igr_v682_terror_function_backup(
  signature text PRIMARY KEY,definition text NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v682_terror_function_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v682_terror_function_backup FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v682_terror_function_backup(signature,definition)
SELECT f.sig,pg_get_functiondef(f.sig::regprocedure)
FROM (VALUES
 ('igr_private.igr_v681_terror_dynamic_room()'),
 ('public.igr_v4_make_reveal(text)')
) f(sig)
ON CONFLICT(signature) DO NOTHING;

-- Preserve the v681 independently sealed questionnaire and its server-only keys.
-- Three substantially incorrect cycles now permit the Front to reach the building in all three dossiers.
DO $v682_dynamic$
DECLARE prior text; nextdef text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO prior;
 IF position('WHEN ''026'' THEN 12 WHEN ''027'' THEN 16 ELSE 25 END;' in prior)=0
 THEN RAISE EXCEPTION 'v681 siege thresholds changed unexpectedly';END IF;
 nextdef:=replace(prior,
  'WHEN ''026'' THEN 12 WHEN ''027'' THEN 16 ELSE 25 END;',
  'WHEN ''026'' THEN 9 WHEN ''027'' THEN 12 ELSE 25 END;');
 IF position('latest_cycle integer;new_liaison text;display_perimeter text;msg text;history jsonb;' in nextdef)=0
 THEN RAISE EXCEPTION 'v681 declaration changed';END IF;
 nextdef:=replace(nextdef,
  'latest_cycle integer;new_liaison text;display_perimeter text;msg text;history jsonb;',
  'latest_cycle integer;new_liaison text;display_perimeter text;msg text;history jsonb;
   last_lock jsonb;locked_levels jsonb;truth_levels jsonb;precise int;total_suspects int;
   held_before_final int;group_survives boolean;');
 IF position(E' END IF;\n controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);\n display_perimeter' in nextdef)=0
 THEN RAISE EXCEPTION 'v681 terminal insertion changed';END IF;
 nextdef:=replace(nextdef,
  E' END IF;\n controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);\n display_perimeter',
  E' END IF;\n
 -- The definitive result is settled only at the actual reveal, not by a suspect, a click or an early checkpoint.
 IF old.status=''playing'' AND new.status=''finished''
    AND coalesce(t->>''terminal_outcome'','''')='''' THEN
   SELECT a.payload INTO last_lock
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players p ON p.id=a.player_id AND p.room_code=a.room_code
   WHERE a.room_code=new.code AND a.action_type=''final_lock'' AND p.public_role=''enqueteur''
   ORDER BY a.id DESC LIMIT 1;
   locked_levels:=coalesce(last_lock->''levels'',last_lock,''{}''::jsonb);
   SELECT pack->''truth''->''levels'' INTO truth_levels
   FROM public.igr_v4_scenario_packs WHERE scenario_id=new.scenario_id;
   SELECT count(*)::int,
    count(*) FILTER(WHERE
      (locked_levels->>p.id::text) ~ ''^[0-2]$''
      AND (locked_levels->>p.id::text)::int =
        coalesce((truth_levels->>(p.internal_slot-1))::int,-2))::int
   INTO total_suspects,precise
   FROM public.igr_v4_players p WHERE p.room_code=new.code AND p.public_role=''suspect'';
   held_before_final:=greatest(0,initial_control-floor(pressure::numeric/threshold)::int);
   group_survives:=total_suspects>0 AND precise>=pg_catalog.ceil(total_suspects*2.0/3.0)::int
      AND held_before_final>0;
   IF NOT group_survives THEN
     pressure:=100;
     t:=t||jsonb_build_object(''terminal_outcome'',''front_at_gates'',
      ''terminal_reason'',case when held_before_final=0 then ''city_lost'' else ''verdict_failed'' end,
      ''final_exact'',precise,''final_total'',total_suspects,
      ''band'',''DÉFAITE · LE FRONT AUX PORTES'');
   ELSE
     t:=t||jsonb_build_object(''terminal_outcome'',''evidence_preserved'',
      ''terminal_reason'',''case_solved_before_breach'',
      ''final_exact'',precise,''final_total'',total_suspects,
      ''band'',''SURVIE · PREUVES PRÉSERVÉES'');
   END IF;
 END IF;
 controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);
 display_perimeter');
 IF nextdef=prior THEN RAISE EXCEPTION 'v682 did not patch dynamic function';END IF;
 EXECUTE nextdef;
END; $v682_dynamic$;


-- v683: Correct answers produce an independently validated national counteroffensive,
-- not merely a smaller loss. Wrong answers still accelerate the rebel advance.
DO $v683_counterpush$
DECLARE prior text;nextdef text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO prior;
 nextdef:=prior;
 IF position('held_before_final int;group_survives boolean;' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 1 absent';END IF;
 nextdef:=replace(nextdef,'held_before_final int;group_survives boolean;','held_before_final int;group_survives boolean;counterpush int;');
 IF position('history:=coalesce(t->''history'',''[]''::jsonb);' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 2 absent';END IF;
 nextdef:=replace(nextdef,'history:=coalesce(t->''history'',''[]''::jsonb);','history:=coalesce(t->''history'',''[]''::jsonb);
 counterpush:=greatest(0,least(2,coalesce((t->>''counteroffensive'')::int,0)));');
 IF position('band:=CASE WHEN correct_count>=5 THEN ''PROGRESSION RALENTIE''
              WHEN correct_count>=3 THEN ''PRESSION RENFORCÉE''
              ELSE ''PERCÉE RAPIDE'' END;' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 3 absent';END IF;
 nextdef:=replace(nextdef,'band:=CASE WHEN correct_count>=5 THEN ''PROGRESSION RALENTIE''
              WHEN correct_count>=3 THEN ''PRESSION RENFORCÉE''
              ELSE ''PERCÉE RAPIDE'' END;','band:=CASE WHEN correct_count>=5 THEN ''CONTRE-OFFENSIVE NATIONALE''
              WHEN correct_count>=3 THEN ''PRESSION CONTENUE''
              ELSE ''PERCÉE DU FDR'' END;');
 IF position('delta:=CASE WHEN correct_count>=5 THEN 9 WHEN correct_count>=3 THEN 17 ELSE 27 END;' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 4 absent';END IF;
 nextdef:=replace(nextdef,'delta:=CASE WHEN correct_count>=5 THEN 9 WHEN correct_count>=3 THEN 17 ELSE 27 END;','delta:=CASE WHEN correct_count>=5 THEN -9 WHEN correct_count>=3 THEN 14 ELSE 27 END;');
 IF position('pressure:=least(100,pressure+delta);' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 5 absent';END IF;
 nextdef:=replace(nextdef,'pressure:=least(100,pressure+delta);','pressure:=greatest(0,least(100,pressure+delta));
 IF correct_count>=5 THEN counterpush:=least(2,counterpush+1);
 ELSIF correct_count<3 THEN counterpush:=greatest(0,counterpush-1);END IF;');
 IF position('''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 6 absent';END IF;
 nextdef:=replace(nextdef,'''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count','''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count,
     ''national_liaison'',CASE WHEN correct_count>=5 THEN ''verified_intelligence_transmitted'' WHEN correct_count>=3 THEN ''partial_corroboration'' ELSE ''information_unreliable'' END');
 IF position('controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 7 absent';END IF;
 nextdef:=replace(nextdef,'controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);','controlled:=least(12,greatest(0,initial_control-floor(pressure::numeric/threshold)::integer+counterpush));');
 IF position('pressure:=100;
     t:=t||jsonb_build_object(''terminal_outcome''' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 8 absent';END IF;
 nextdef:=replace(nextdef,'pressure:=100;
     t:=t||jsonb_build_object(''terminal_outcome''','pressure:=100;
     counterpush:=0;
     t:=t||jsonb_build_object(''terminal_outcome''');
 IF position('''city'',city_name,''pressure'',pressure,''controlled'',controlled,''total'',12,' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 9 absent';END IF;
 nextdef:=replace(nextdef,'''city'',city_name,''pressure'',pressure,''controlled'',controlled,''total'',12,','''city'',city_name,''pressure'',pressure,''controlled'',controlled,''total'',12,
  ''country'',''République d'Almizia'',''armed_group'',''FDR'',
  ''counteroffensive'',counterpush,''national_forces'',''Forces armées de Almizia'',');
 IF position('''Les certitudes du camp sont insuffisantes : l encerclement s accélère. La dernière liaison peut disparaître.'' END END;' in nextdef)=0 THEN RAISE EXCEPTION 'v683 scoring patch point 10 absent';END IF;
 nextdef:=replace(nextdef,'''Les certitudes du camp sont insuffisantes : l encerclement s accélère. La dernière liaison peut disparaître.'' END END;','''Les certitudes du camp sont insuffisantes : l encerclement s accélère. La dernière liaison peut disparaître.'' END END;
 IF correct_count>=5 THEN msg:=''La liaison judiciaire a transmis des informations recoupées. Les forces armées de Almizia rétablissent le contrôle d un secteur contesté et repoussent temporairement le FDR.'';END IF;');
 IF position('''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count,
     ''national_liaison'',CASE WHEN correct_count>=5 THEN ''verified_intelligence_transmitted'' WHEN correct_count>=3 THEN ''partial_corroboration'' ELSE ''information_unreliable'' END' in nextdef)=0 THEN RAISE EXCEPTION 'v684 1 patch anchor missing';END IF;
 nextdef:=replace(nextdef,'''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count,
     ''national_liaison'',CASE WHEN correct_count>=5 THEN ''verified_intelligence_transmitted'' WHEN correct_count>=3 THEN ''partial_corroboration'' ELSE ''information_unreliable'' END','''cycle'',latest_cycle,''band'',band,''delta'',delta,''submissions'',submitted_count,
     ''correct_answers'',correct_count,''possible_answers'',6,
     ''decision_effect'',CASE WHEN correct_count>=5 THEN ''national_reconquest'' WHEN correct_count>=3 THEN ''defensive_hold'' ELSE ''fdr_breakthrough'' END,
     ''national_liaison'',CASE WHEN correct_count>=5 THEN ''verified_intelligence_transmitted'' WHEN correct_count>=3 THEN ''partial_corroboration'' ELSE ''information_unreliable'' END');
 IF position('IF correct_count>=5 THEN msg:=''La liaison judiciaire a transmis des informations recoupées. Les forces armées de Almizia rétablissent le contrôle d un secteur contesté et repoussent temporairement le FDR.'';END IF;' in nextdef)=0 THEN RAISE EXCEPTION 'v684 2 patch anchor missing';END IF;
 nextdef:=replace(nextdef,'IF correct_count>=5 THEN msg:=''La liaison judiciaire a transmis des informations recoupées. Les forces armées de Almizia rétablissent le contrôle d un secteur contesté et repoussent temporairement le FDR.'';END IF;','msg:=CASE WHEN correct_count>=5 THEN CASE new.scenario_id
  WHEN ''026'' THEN ''Vos recoupements ont authentifié une partie des archives et des décisions. Après vérification par la liaison judiciaire, les forces d'Almizia rétablissent un service public et reprennent un secteur de la capitale. Le FDR recule.''
  WHEN ''027'' THEN ''Vos réponses ont permis de distinguer les faits anciens des renseignements actuels. La liaison nationale confirme ces limites aux forces d'Almizia, qui sécurisent un secteur disputé. Le FDR recule sans que le sort des civils soit présumé.''
  ELSE ''Vos vérifications empêchent de traiter une trace périmée comme une présence certaine. Les forces d'Almizia préservent une liaison et reprennent un secteur contesté aux abords du centre. L éventuelle cellule intérieure reste à établir.'' END
 WHEN correct_count>=3 THEN
  ''Certaines analyses sont exactes, mais le dossier reste trop incomplet pour confirmer une contre-offensive. Les forces nationales tiennent plusieurs positions; le FDR gagne du terrain dans les secteurs disputés.''
 ELSE
  ''Les réponses transmises sont trop éloignées des pièces disponibles. Le commandement national ne peut pas confirmer la synthèse; le FDR exploite le désordre, plusieurs services cessent de répondre et ses factions se rapprochent de la Grey Room.''
 END;');
 IF position('''text'',msg,''city'',city_name,''controlled'',controlled,''total'',12,
      ''pressure'',pressure,''pace'',band' in nextdef)=0 THEN RAISE EXCEPTION 'v684 3 patch anchor missing';END IF;
 nextdef:=replace(nextdef,'''text'',msg,''city'',city_name,''controlled'',controlled,''total'',12,
      ''pressure'',pressure,''pace'',band','''text'',msg,''city'',city_name,''controlled'',controlled,''total'',12,
      ''country'',''République d'Almizia'',''capital'',true,''capital_last_free_city'',true,
      ''correct_answers'',correct_count,''possible_answers'',6,
      ''source'',''liaison_judiciaire_validee_par_commandement_national'',
      ''effect'',CASE WHEN correct_count>=5 THEN ''reconquest'' WHEN correct_count>=3 THEN ''hold_under_pressure'' ELSE ''fdr_breakthrough'' END,
      ''pressure'',pressure,''pace'',band');
 IF position('''country'',''République d'Almizia'',''armed_group'',''FDR'',' in nextdef)=0 THEN RAISE EXCEPTION 'v684 4 patch anchor missing';END IF;
 nextdef:=replace(nextdef,'''country'',''République d'Almizia'',''armed_group'',''FDR'',','''country'',''République d'Almizia'',''capital'',true,''last_free_city'',true,''armed_group'',''FDR'',');
 IF position('''city'',city_name,''pressure'',0,''controlled'',initial_control,' in nextdef)=0 THEN RAISE EXCEPTION 'v684 5 patch anchor missing';END IF;
 nextdef:=replace(nextdef,'''city'',city_name,''pressure'',0,''controlled'',initial_control,','''city'',city_name,''pressure'',0,''controlled'',initial_control,''country'',''République d'Almizia'',''capital'',true,''last_free_city'',true,');
 IF nextdef=prior THEN RAISE EXCEPTION 'v683 country and counteroffensive not applied';END IF;
 EXECUTE nextdef;
END; $v683_counterpush$;

-- Make the judicial victory and the siege outcome a single contract for the camp.
DO $v682_reveal$
DECLARE prior text;nextdef text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_make_reveal(text)'::regprocedure) INTO prior;
 IF position('    if success then'||E'\n'||
       '      winners := winners || jsonb_build_array(p.id);' in prior)=0
 THEN RAISE EXCEPTION 'current reveal player scoring changed';END IF;
 nextdef:=replace(prior,
 '    if success then'||E'\n'||
 '      winners := winners || jsonb_build_array(p.id);',
 '    -- The Front reaches the Grey Room on a failed collective investigation.
    -- This does not automatically kill or pardon any prisoner.
    if r.scenario_id in (''026'',''027'',''028'')
      and (exact<threshold OR coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0)
    then
      if p.public_role in (''enqueteur'',''analyste'',''expert'',''inspecteur'',''procureur'',''juge'') then
        success:=false;
        result_text:=result_text||'' Le Front de la Restauration atteint les portes de la Grey Room : le camp d enquête perd cette partie.'';
      elsif p.public_role=''suspect'' then
        result_text:=result_text||'' Les assaillants arrivent aux portes; aucune loyauté ne garantit ta survie.'';
      end if;
    end if;
    if success then'||E'\n'||
 '      winners := winners || jsonb_build_array(p.id);');
 IF position(E'  return jsonb_build_object(\n    ''title'',''RÉVÉLATION'',' in nextdef)=0
 THEN RAISE EXCEPTION 'reveal return location changed';END IF;
 nextdef:=replace(nextdef,
 E'  return jsonb_build_object(\n    ''title'',''RÉVÉLATION'',',
 E'  return jsonb_build_object(
    ''title'',''RÉVÉLATION'',
    ''terror_finale'',case when r.scenario_id in (''026'',''027'',''028'') then
      jsonb_build_object(
       ''organization'',''Front de la Restauration'',
       ''city'',coalesce(r.state#>>''{terror_v681,city}'',''la ville''),
       ''status'',case when exact<threshold OR
          coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0
          then ''front_at_gates'' else ''evidence_preserved'' end,
       ''message'',case when exact<threshold OR
          coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0
         then ''LE FRONT EST AUX PORTES. Le centre est encerclé. Les preuves peuvent être conservées, mais personne ne peut garantir l évacuation ni la survie des détenus.''
         else ''La Grey Room préserve ses preuves et dispose encore d un secteur administré. Le Front n a pas été vaincu : la menace demeure.'' end)
      else null end,');
 IF nextdef=prior THEN RAISE EXCEPTION 'reveal patch missing';END IF;
 EXECUTE nextdef;
END; $v682_reveal$;

-- One public room bulletin per fallen fictitious sector. No secret identity or tactical location is exposed.
CREATE OR REPLACE FUNCTION igr_private.igr_v682_terror_sector_bulletins()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE city_name text;prior_held int;current_held int;sector int;
       messages text[];message text;front_status text;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') THEN RETURN new;END IF;
 city_name:=new.state#>>'{terror_v681,city}';
 IF city_name IS NULL THEN RETURN new;END IF;
 IF old.status='lobby' AND new.status='playing' THEN
  INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  VALUES(new.code,'terror_v682_front_briefing','public',0,
   jsonb_build_object('title','LE FDR · FRONT DE LA RESTAURATION',
    'text','La République d'Almizia sort d une longue guerre civile. Après des années de corruption et de soldes impayées, le Front de la Restauration (FDR), une coalition rebelle, a profité de l effondrement de la garnison de Ferra pour s emparer de sa base militaire et de matériel lourd. Désormais, les forces armées de Almizia défendent les derniers secteurs de '||city_name||'. Le FDR approche de la Grey Room, qui détient des preuves de ses persécutions et de ses crimes.',
    'city',city_name,'country','République d'Almizia','capital',true,'last_free_city',true,'enemy','FDR','sectors',12));
 END IF;
 IF old.status<>'playing' THEN RETURN new;END IF;
 prior_held:=coalesce((old.state#>>'{terror_v681,controlled}')::int,
   CASE new.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 6 ELSE 3 END);
 current_held:=coalesce((new.state#>>'{terror_v681,controlled}')::int,prior_held);
 IF old.status='playing' AND new.status='finished' THEN
  front_status:=new.state#>>'{terror_v681,terminal_outcome}';
  INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  VALUES(new.code,'terror_v682_final_status','public',new.cycle,
   jsonb_build_object('title',CASE WHEN front_status='front_at_gates' THEN
      'DÉFAITE · LE FRONT DEVANT LA GREY ROOM' ELSE
      'DOSSIER SAUVÉ · LE FRONT DEMEURE ACTIF' END,
     'text',CASE WHEN front_status='front_at_gates'
      THEN 'Le camp d enquête n a pas contenu la crise. La Grey Room est encerclée; les vies restent menacées et leur issue n est pas déterminée.'
      ELSE 'Les preuves ont été sécurisées avant la rupture totale. La menace demeure et les populations ne sont pas hors de danger.' END,
     'city',city_name,'terminal',front_status));
 END IF;

 -- The military counteroffensive is reported publicly in exactly the same way as losses.
 IF current_held>prior_held THEN
   FOR sector IN prior_held+1..current_held LOOP
     INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
     VALUES(new.code,'terror_v683_sector_recovered','public',new.cycle,
       jsonb_build_object('title','SECTEUR '||lpad(sector::text,2,'0')||' · REPRIS · '||upper(city_name),
         'text','Les preuves judiciaires recoupées ont été validées par la liaison nationale. Les forces armées de Almizia ont rétabli le contrôle de ce secteur contesté. Le FDR recule, mais les habitants restent exposés à la crise.',
         'city',city_name,'country','République d'Almizia','capital',true,'sector',sector,'held',sector,'total',12,'enemy','FDR',
         'national_forces','Forces armées de Almizia','front_pushed_back',true));
   END LOOP;
 END IF;
 IF current_held>=prior_held THEN RETURN new;END IF;
 messages:=ARRAY[
   'Les familles se regroupent devant des services fermés. Personne ne peut confirmer combien ont pu partir.',
   'Un service civil cesse de répondre. Les derniers documents transmis sont placés sous scellés.',
   'Des témoignages font état de départs précipités. Le sort des personnes restées sur place n est pas établi.',
   'L annonce d une fermeture provoque une ruée vers les points d accueil; aucune sortie n est garantie.',
   'Le bureau des archives annonce la suspension de ses activités. Les pièces déjà authentifiées restent valables.',
   'Les communications du secteur se fragmentent. Une absence de réponse ne constitue pas un constat de décès.',
   'Des agents publics perdent l accès à leur service. Les dossiers de la Grey Room deviennent particulièrement sensibles.',
   'Des proches demandent des nouvelles de personnes retenues. Les autorités ne disposent pas de confirmation actuelle.',
   'Les signalements se multiplient; il devient impossible de séparer les faits constatés des rumeurs sans recoupement.',
   'Les fonctions municipales ne répondent plus. Les derniers témoins joignables demandent une protection.',
   'L administration n est plus en mesure de garantir ses permanences. Le Front fait circuler ses propres communiqués.',
   'Un dernier service public signale qu il ne peut plus assurer une présence normale. Le centre judiciaire se retrouve isolé.'
 ];
 FOR sector IN REVERSE prior_held..current_held+1 LOOP
   message:=messages[1+mod(sector-1,array_length(messages,1))];
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
   VALUES(new.code,'terror_v682_sector_lost','public',new.cycle,
    jsonb_build_object('title','SECTEUR '||lpad(sector::text,2,'0')||' · PERDU · '||upper(city_name),
    'text',message,'city',city_name,'country','République d'Almizia','capital',true,'sector',sector,
    'held',sector-1,'total',12,'enemy','FDR'));
 END LOOP;
 IF current_held=0 AND prior_held>0 THEN
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
   VALUES(new.code,'terror_v682_at_gates','public',new.cycle,
    jsonb_build_object('title','ALERTE · LE FRONT AUX PORTES DE LA GREY ROOM',
      'text','La capitale, dernière grande ville libre de Almizia, a perdu son dernier secteur administré. Le FDR est désormais devant le bâtiment. Les issues sont verrouillées; personne ne dispose d une garantie d extraction. Les interrogatoires et les preuves ne sont pas effacés.',
      'city',city_name,'enemy','FDR','at_gates',true));
 END IF;

 RETURN new;
END; $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v682_terror_sector_bulletins() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v682_terror_public_losses ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v682_terror_public_losses
AFTER UPDATE OF status,phase,cycle,state ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v682_terror_sector_bulletins();

-- Every factual cycle now investigates the FDR rather than a generic statistics method.
-- The answer key remains in the private schema; public clients receive only questions and options.
INSERT INTO igr_private.igr_v681_terror_question_bank(scenario_id,cycle,question_id,question,options,correct) VALUES
('026',1,'q1','Quelles preuves peuvent faire reconnaître les victimes du FDR malgré ses communiqués ?','["Une liste de rumeurs répétées","Des documents datés recoupés avec des familles et des archives indépendantes","La seule assurance d''un détenu"]'::jsonb,'b'),
('026',1,'q2','Le FDR affirme avoir agi au nom d''une autorité légitime. Quel élément permet de contrôler cette affirmation ?','["Le circuit réel d''approbation et les décisions signées","La popularité de ses slogans","Le silence de ses opposants"]'::jsonb,'a'),
('026',1,'q3','Un responsable du FDR nie connaître des persécutions. Quel élément permet de tester son affirmation ?','["Son degré d''inquiétude","Ses convictions déclarées","Les alertes et les comptes rendus qu''il a réellement reçus"]'::jsonb,'c'),
('026',2,'q1','Le FDR affirme qu''une de ses structures est dissoute. Quel indice conteste cette version ?','["Un ancien discours menaçant","Des actes datés et des transmissions postérieurs à cette annonce","Une rumeur concernant une autre faction"]'::jsonb,'b'),
('026',2,'q2','Un orateur du FDR a tenu des discours violents. Cela établit-il qu''il a ordonné toute la répression ?','["Non, il faut établir séparément ses décisions et son autorité","Oui, sans autre preuve","Oui, si le responsable administratif se tait"]'::jsonb,'a'),
('026',2,'q3','Comment protéger les archives que le FDR voudrait effacer ?','["Interroger seulement les prisonniers les plus convaincus","Déduire que tous les documents manquants ont été détruits","Authentifier des copies conservées hors de sa chaîne de contrôle"]'::jsonb,'c'),
('026',3,'q1','Quelle information issue de l''enquête peut affaiblir la prise de contrôle institutionnelle du FDR ?','["Une hypothèse nouvelle non vérifiée","La chaîne documentée des décisions et leur effet sur les habitants","L''annonce d''une victoire militaire certaine"]'::jsonb,'b'),
('026',3,'q2','Une signature du FDR prouve-t-elle à elle seule la responsabilité de toutes ses factions ?','["Oui","Seulement si le signataire est célèbre","Non, l''acte précis et les informations reçues doivent être établis"]'::jsonb,'c'),
('026',3,'q3','Que peut transmettre la Grey Room aux autorités nationales pour aider à restaurer les services civils ?','["Une synthèse vérifiée distinguant faits, responsables et inconnues","Un classement fondé sur la peur des détenus","Un ordre d''intervention donné par un seul joueur"]'::jsonb,'a'),
('027',1,'q1','Un prisonnier affilié au FDR livre des documents exacts. Quelle question reste essentielle ?','["L''exhaustivité de la sélection et son intérêt personnel","Sa manière de parler","Le nombre de compliments qu''il adresse aux enquêteurs"]'::jsonb,'a'),
('027',1,'q2','Le FDR affirme qu''un secteur ne contient plus de civils. Quelle conclusion est prudente ?','["Il faut considérer ce secteur comme vide","Il faut une vérification contemporaine et indépendante de la situation humanitaire","Toute information sur le secteur est nécessairement fausse"]'::jsonb,'b'),
('027',1,'q3','Plusieurs rapports du FDR répètent la même source. Cela représente-t-il plusieurs confirmations ?','["Oui, si leurs titres diffèrent","Oui, si leurs dates sont proches","Non, répéter une source ne crée pas une preuve indépendante"]'::jsonb,'c'),
('027',2,'q1','Un registre transmis par un collaborateur du FDR omet des détenus. Quelle vérification permet de résister à cette dissimulation ?','["La comparaison avec les inventaires et les familles","L''acceptation des noms qu''il a choisis","La suppression des témoignages contradictoires"]'::jsonb,'a'),
('027',2,'q2','Un ancien renseignement exact indique la présence d''un responsable du FDR. Peut-on le tenir pour actuel ?','["Oui, tant qu''il n''est pas démenti","Non, il faut vérifier sa date et les changements intervenus","Oui, s''il provient d''un cadre connu"]'::jsonb,'b'),
('027',2,'q3','Pourquoi les rivalités entre factions du FDR peuvent-elles rendre un témoignage trompeur ?','["Elles rendent tous les témoins innocents","Elles permettent de connaître automatiquement le commandement","Une faction peut livrer des faits vrais pour détourner l''attention de ses propres crimes"]'::jsonb,'c'),
('027',3,'q1','Quel usage des renseignements du FDR aide réellement à protéger les civils ?','["Fournir une analyse datée, recoupée et explicite sur ses limites","Déclarer vide toute zone dont les témoins sont absents","Laisser une seule faction choisir les faits publiés"]'::jsonb,'a'),
('027',3,'q2','Une personne du FDR avoue un crime passé. Cela suffit-il pour établir où se trouvent aujourd''hui les captifs ?','["Oui","Non, la situation actuelle doit être confirmée séparément","Oui, si l''aveu est détaillé"]'::jsonb,'b'),
('027',3,'q3','Quel bilan peut neutraliser une campagne de désinformation du FDR ?','["Un communiqué sans sources, rédigé en urgence","Une promesse de victoire militaire immédiate","Un dossier qui distingue éléments établis, omissions décelées et inconnues humanitaires"]'::jsonb,'c'),
('028',1,'q1','Une liste ancienne mentionne un accès lié au FDR. Que prouve-t-elle concernant le centre aujourd''hui ?','["L''infiltration est certaine","Une autorisation historique à dater, pas nécessairement une présence actuelle","La défaite est inévitable"]'::jsonb,'b'),
('028',1,'q2','Un prisonnier du FDR paraît très calme tandis que les autres paniquent. Que peut-on en conclure ?','["Qu''il dirige une cellule","Qu''il a forcément reçu une promesse d''évacuation","Rien sur son autorité sans preuves indépendantes"]'::jsonb,'c'),
('028',1,'q3','La liaison avec un service civil est rompue. Que peut-on affirmer ?','["Le contact a été perdu, sans conclure au sort des personnes","Que le service a été pris par un relais intérieur","Que tous les témoins sont morts"]'::jsonb,'a'),
('028',2,'q1','Un message attribué au FDR parvient en retard à la Grey Room. Que faut-il établir ?','["La réaction du prisonnier idéologue","Sa date de création et sa période de validité","La date du prochain interrogatoire"]'::jsonb,'b'),
('028',2,'q2','Comment distinguer une cellule intérieure réelle d''une rumeur utilisée par le FDR ?','["En confrontant des traces contemporaines et des sources indépendantes","En demandant à chaque prisonnier s''il a peur","En supposant que les anciens accès sont toujours actifs"]'::jsonb,'a'),
('028',2,'q3','Un agent administratif a transmis des dossiers au FDR. Comment qualifier cette responsabilité ?','["Elle disparaît si aucune cellule n''est prouvée","Elle appartient nécessairement à l''idéologue","Elle doit être examinée indépendamment de l''existence actuelle d''un relais"]'::jsonb,'c'),
('028',3,'q1','La dernière confirmation extérieure est limitée. Comment doit-elle être utilisée ?','["Comme preuve absolue du destin du centre","Uniquement pour ce qu''elle a effectivement vérifié","Comme autorisation d''accuser n''importe quel détenu"]'::jsonb,'b'),
('028',3,'q2','Une copie indique qu''un accès du FDR avait été annulé avant la fermeture du périmètre. Que faut-il en déduire ?','["La trace ancienne ne démontre pas une présence actuelle, sans garantir la sécurité générale","Le FDR ne menace plus la ville","Tous les suspects sont innocents"]'::jsonb,'a'),
('028',3,'q3','Quelle enquête aide le plus les défenseurs de la Grey Room face à une intimidation du FDR ?','["Celle qui croit l''alerte la plus effrayante","Celle qui déclare la capitale déjà détruite","Celle qui authentifie l''état présent des menaces sans effacer les responsabilités passées"]'::jsonb,'c')
ON CONFLICT(scenario_id,cycle,question_id) DO UPDATE SET question=excluded.question,options=excluded.options,correct=excluded.correct;

DO $audit$
DECLARE def text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO def;
 IF position('WHEN ''026'' THEN 9 WHEN ''027'' THEN 12 ELSE 25 END;' in def)=0
 THEN RAISE EXCEPTION 'v682 thresholds not applied';END IF;
 IF position('terminal_outcome' in def)=0 THEN RAISE EXCEPTION 'v682 loss not applied';END IF;
 IF has_function_privilege('anon','igr_private.igr_v682_terror_sector_bulletins()','EXECUTE')
 THEN RAISE EXCEPTION 'private bulletin function publicly callable';END IF;
 IF has_table_privilege('anon','igr_private.igr_v682_terror_function_backup','SELECT')
 THEN RAISE EXCEPTION 'private rollback exposed';END IF;
END; $audit$;
COMMIT;
