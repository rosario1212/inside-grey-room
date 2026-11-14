
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
   jsonb_build_object('title','LE FRONT DE LA RESTAURATION',
    'text','Le Front prétend restaurer l ordre, mais ses factions contrôlent des services civils et sont accusées de persécutions, de disparitions et de crimes graves. La Grey Room conserve des dossiers et des témoignages qui le menacent. Ses forces approchent de '||city_name||'.',
    'city',city_name,'enemy','Front de la Restauration','sectors',12));
 END IF;
 IF old.status<>'playing' THEN RETURN new;END IF;
 prior_held:=coalesce((old.state#>>'{terror_v681,controlled}')::int,
   CASE new.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 6 ELSE 3 END);
 current_held:=coalesce((new.state#>>'{terror_v681,controlled}')::int,prior_held);
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
    'text',message,'city',city_name,'sector',sector,
    'held',sector-1,'total',12,'enemy','Front de la Restauration'));
 END LOOP;
 IF current_held=0 AND prior_held>0 THEN
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
   VALUES(new.code,'terror_v682_at_gates','public',new.cycle,
    jsonb_build_object('title','ALERTE · LE FRONT AUX PORTES DE LA GREY ROOM',
      'text','Les derniers secteurs administrés ont cessé de répondre. Les assaillants sont désormais devant le bâtiment. Les issues sont verrouillées; personne ne dispose d une garantie d extraction. Les interrogatoires et les preuves ne sont pas effacés.',
      'city',city_name,'enemy','Front de la Restauration','at_gates',true));
 END IF;
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
 RETURN new;
END; $fn$;
REVOKE ALL ON FUNCTION igr_private.igr_v682_terror_sector_bulletins() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v682_terror_public_losses ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v682_terror_public_losses
AFTER UPDATE OF status,phase,cycle,state ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v682_terror_sector_bulletins();

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
