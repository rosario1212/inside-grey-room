BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v692_terror_trigger_backup(signature text primary key,definition text not null,saved_at timestamptz default now());
ALTER TABLE igr_private.igr_v692_terror_trigger_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v692_terror_trigger_backup FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v692_terror_trigger_backup(signature,definition)
SELECT 'igr_private.igr_v682_terror_sector_bulletins()',pg_get_functiondef('igr_private.igr_v682_terror_sector_bulletins()'::regprocedure) ON CONFLICT(signature) DO NOTHING;
CREATE OR REPLACE FUNCTION igr_private.igr_v682_terror_sector_bulletins()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    'text','La République d''Almizia sort d une longue guerre civile. Après des années de corruption et de soldes impayées, le Front de la Restauration (FDR), une coalition rebelle, a profité de l effondrement de la garnison de Ferra pour s emparer de sa base militaire et de matériel lourd. Désormais, les forces armées d Almizia défendent les derniers secteurs de '||city_name||'. Le FDR approche de la Grey Room, qui détient des preuves de ses persécutions et de ses crimes.',
    'city',city_name,'country','République d''Almizia','capital',true,'last_free_city',true,'enemy','FDR','sectors',12));
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
      'DÉFAITE · EXÉCUTIONS SOMMAIRES DANS LA GREY ROOM' ELSE
      'DOSSIER SAUVÉ · LE FRONT DEMEURE ACTIF' END,
     'text',CASE WHEN front_status='front_at_gates'
      THEN 'Le FDR a franchi les portes de la Grey Room. Tous ses occupants ont été capturés, soumis à des mauvais traitements puis exécutés sommairement. La capitale d Almizia est tombée.'
      ELSE 'Les preuves ont été sécurisées avant la rupture totale. La menace demeure et les populations ne sont pas hors de danger.' END,
     'city',city_name,'terminal',front_status));
 END IF;

 -- The military counteroffensive is reported publicly in exactly the same way as losses.
 IF current_held>prior_held THEN
   FOR sector IN prior_held+1..current_held LOOP
     INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
     VALUES(new.code,'terror_v683_sector_recovered','public',new.cycle,
       jsonb_build_object('title','SECTEUR '||lpad(sector::text,2,'0')||' · REPRIS · '||upper(city_name),
         'text','Les preuves judiciaires recoupées ont été validées par la liaison nationale. Les forces armées d Almizia ont rétabli le contrôle de ce secteur contesté. Le FDR recule, mais les habitants restent exposés à la crise.',
         'city',city_name,'country','République d''Almizia','capital',true,'sector',sector,'held',sector,'total',12,'enemy','FDR',
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
    'text',message,'city',city_name,'country','République d''Almizia','capital',true,'sector',sector,
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
END; $function$
;
DO $audit$
DECLARE f text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v682_terror_sector_bulletins()'::regprocedure) INTO f;
 IF position('exécutés sommairement' in f)=0 OR position('leur issue n est pas déterminée' in f)>0
 THEN RAISE EXCEPTION 'terminal bulletin contradicts fatal outcome';END IF;
 IF has_function_privilege('anon','igr_private.igr_v682_terror_sector_bulletins()','EXECUTE')
 THEN RAISE EXCEPTION 'private event trigger callable';END IF;
END $audit$;
COMMIT;