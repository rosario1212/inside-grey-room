BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v691_terror_function_backups(signature text primary key,definition text not null,saved_at timestamptz not null default now());
ALTER TABLE igr_private.igr_v691_terror_function_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v691_terror_function_backups FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v691_terror_function_backups(signature,definition)
SELECT s.sig,pg_get_functiondef(s.sig::regprocedure) FROM (VALUES
('igr_private.igr_v681_terror_dynamic_room()'),
('public.igr_v4_generic_role_card(text,text)'),
('public.igr_v688_terror_operations(text,uuid)')
) s(sig) ON CONFLICT(signature) DO NOTHING;
CREATE OR REPLACE FUNCTION igr_private.igr_v681_terror_dynamic_room()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE city_name text;t jsonb;initial_control integer;threshold integer;pressure integer;controlled integer;band text;delta integer;correct_count integer;submitted_count integer;latest_cycle integer;new_liaison text;display_perimeter text;msg text;history jsonb;counterpush int;military_choice text;civilian_services int;last_lock jsonb;locked_levels jsonb;truth_levels jsonb;precise int;total_suspects int;held_before_final int;group_survives boolean;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') THEN RETURN new;END IF;
 SELECT city INTO city_name FROM igr_private.igr_v681_terror_cities WHERE room_code=new.code;
 IF old.status='lobby' AND new.status='playing' AND city_name IS NULL THEN
   RAISE EXCEPTION 'Choisis la ville avant de lancer le DLC Terror';END IF;
 IF city_name IS NULL THEN RETURN new;END IF;
 initial_control:=CASE new.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 6 ELSE 3 END;
 threshold:=CASE new.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 12 ELSE 25 END;
 t:=coalesce(new.state->'terror_v681',old.state->'terror_v681','{}'::jsonb);
 IF old.status='lobby' AND new.status='playing' THEN
   t:=jsonb_build_object('city',city_name,'pressure',0,'controlled',initial_control,'country','Almizia','capital',true,'last_free_city',true,
    'last_scored_cycle',0,'band','DÉBUT DU SIÈGE','history','[]'::jsonb,
    'model','v681-evidence-responsive');
 END IF;
 pressure:=greatest(0,least(100,coalesce((t->>'pressure')::integer,0)));
 latest_cycle:=greatest(0,coalesce((t->>'last_scored_cycle')::integer,0));
 history:=coalesce(t->'history','[]'::jsonb);
 counterpush:=greatest(0,least(2,coalesce((t->>'counteroffensive')::int,0)));
 civilian_services:=greatest(0,least(6,coalesce((t->>'civilian_services')::int,0)));
 IF old.status='playing' AND new.status IN ('playing','finished')
    AND old.phase='cycle_debrief' AND new.phase IS DISTINCT FROM old.phase
    AND old.cycle BETWEEN 1 AND 3 AND latest_cycle<old.cycle THEN
   SELECT count(*)::integer INTO correct_count
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players p ON p.id=a.player_id AND p.room_code=a.room_code
   JOIN LATERAL jsonb_each_text(coalesce(a.payload->'answers','{}'::jsonb)) ans ON TRUE
   JOIN igr_private.igr_v681_terror_question_bank q
    ON q.scenario_id=new.scenario_id AND q.cycle=old.cycle
    AND q.question_id=ans.key AND q.correct=ans.value
   WHERE a.room_code=new.code AND a.cycle=old.cycle
    AND a.action_type='terror_v681_quiz'
    AND p.public_role IN ('enqueteur','analyste');
   SELECT count(*)::integer INTO submitted_count
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players p ON p.id=a.player_id AND p.room_code=a.room_code
   WHERE a.room_code=new.code AND a.cycle=old.cycle
    AND a.action_type='terror_v681_quiz'
    AND p.public_role IN ('enqueteur','analyste');

   SELECT a.payload->>'choice' INTO military_choice
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players officer ON officer.id=a.player_id AND officer.room_code=a.room_code
   WHERE a.room_code=new.code AND a.cycle=old.cycle
    AND a.action_type='terror_v688_military'
    AND officer.public_role='officier_liaison'
   ORDER BY a.id DESC LIMIT 1;
   military_choice:=coalesce(military_choice,'tenir');
   -- A verified previous-cycle report unlocks reconquest; the current result still matters.
   delta:=CASE military_choice
    WHEN 'tenir' THEN CASE WHEN correct_count>=5 THEN 0 WHEN correct_count>=3 THEN 10 ELSE 20 END
    WHEN 'proteger' THEN CASE WHEN correct_count>=5 THEN 4 WHEN correct_count>=3 THEN 16 ELSE 26 END
    WHEN 'reconquerir' THEN CASE WHEN correct_count>=5 THEN -16 WHEN correct_count>=3 THEN 9 ELSE 34 END
    ELSE 27 END;
   IF correct_count<3 THEN counterpush:=greatest(0,counterpush-1);END IF;
   IF military_choice='reconquerir' AND correct_count>=5 THEN
      counterpush:=least(2,counterpush+1);
   END IF;
   band:=CASE
    WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'RECONQUÊTE NATIONALE'
    WHEN military_choice='reconquerir' AND correct_count<3 THEN 'OFFENSIVE ÉCHOUÉE · LE FDR ACCÉLÈRE'
    WHEN military_choice='proteger' THEN 'PROTECTION DES CIVILS'
    WHEN military_choice='tenir' AND correct_count>=5 THEN 'DÉFENSE TENUE · DOSSIER VÉRIFIÉ'
    WHEN correct_count>=3 THEN 'PRESSION CONTENUE' ELSE 'AVANCÉE DU FDR' END;
   civilian_services:=greatest(0,least(6,civilian_services+
     CASE military_choice WHEN 'proteger' THEN CASE WHEN correct_count>=3 THEN 2 ELSE 1 END
     WHEN 'tenir' THEN CASE WHEN correct_count>=5 THEN 1 ELSE 0 END
     WHEN 'reconquerir' THEN CASE WHEN correct_count>=5 THEN 1 ELSE -1 END
     ELSE 0 END));
   pressure:=greatest(0,least(100,pressure+delta));
   latest_cycle:=old.cycle;
   history:=history||jsonb_build_array(jsonb_build_object(
      'cycle',latest_cycle,'band',band,'delta',delta,
      'correct_answers',correct_count,'possible_answers',6,'submissions',submitted_count,
      'military_operation',military_choice,
      'civilian_protection',(military_choice='proteger'),
      'civilian_services_after',civilian_services,
      'civilian_effect',CASE WHEN military_choice='proteger' THEN 'priority_to_people_and_records'
        WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'services_resumed_after_security'
        WHEN military_choice='reconquerir' THEN 'protection_disrupted_by_failed_offensive'
        ELSE 'defensive_continuity' END,
      'decision_effect',CASE
        WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'national_reconquest'
        WHEN military_choice='proteger' THEN 'civilian_protection'
        WHEN correct_count>=3 THEN 'defensive_hold'
        ELSE 'fdr_breakthrough' END,
      'national_liaison',CASE WHEN correct_count>=5 THEN 'verified_intelligence_transmitted'
         WHEN correct_count>=3 THEN 'partial_corroboration' ELSE 'information_unreliable' END));
   controlled:=least(12,greatest(0,initial_control-floor(pressure::numeric/threshold)::integer+counterpush));
   msg:=CASE new.scenario_id
    WHEN '026' THEN CASE
      WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'Les preuves sur les prises de contrôle du FDR ont été vérifiées. L état-major a ordonné la reprise limitée d un secteur, dont les institutions civiles redeviennent accessibles.'
      WHEN military_choice='proteger' THEN 'L état-major privilégie la conservation des archives et la protection des habitants. Des moyens ont été détournés de la défense du secteur, qui reste sous pression.'
      WHEN correct_count>=5 THEN 'Les preuves du FDR sont conservées et les défenses tiennent. L état-major attend une occasion justifiée de reprendre un secteur.'
      ELSE 'La reconstitution des crimes du FDR manque de preuves exploitables. Les institutions civiles de la capitale s affaiblissent.' END
    WHEN '027' THEN CASE
      WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'Les informations sur le FDR ont été datées et recoupées. L état-major ordonne une reprise limitée d une zone contestée, sans déclarer les civils absents.'
      WHEN military_choice='proteger' THEN 'L état-major donne priorité aux habitants en danger, sans présumer qu ils ont quitté la zone. La défense nationale concède du terrain.'
      WHEN correct_count>=5 THEN 'La manipulation du renseignement du FDR est identifiée. Les forces nationales stabilisent leur défense et renoncent à toute certitude humanitaire non vérifiée.'
      ELSE 'Le dossier du FDR reste trop incertain. Une source trompeuse bloque la coordination des défenseurs.' END
    ELSE CASE
      WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'Les traces liées au FDR ont été authentifiées. L état-major ordonne de desserrer le siège par une reprise limitée, sans présumer l existence d une cellule intérieure.'
      WHEN military_choice='proteger' THEN 'Le commandement ordonne la protection prioritaire des témoins et des preuves de la Grey Room. L encerclement extérieur continue.'
      WHEN correct_count>=5 THEN 'Une rumeur d infiltration du FDR est analysée sans panique. La capitale conserve sa dernière liaison vérifiée et ses défenses tiennent.'
      ELSE 'La réalité d une menace intérieure du FDR reste indécidable. Les communications s interrompent et la capitale perd des secteurs.' END END;
   IF military_choice='reconquerir' AND correct_count<5 THEN
     msg:=msg||' La décision de reconquête a été prise sur des informations insuffisantes; elle échoue et accroît la pression sur la capitale.';
   END IF;
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
   VALUES(new.code,'terror_v681_city_fall','public',old.cycle,
     jsonb_build_object('title',upper(city_name)||' · BILAN DU CYCLE '||old.cycle,
       'text',msg,'city',city_name,'country','Almizia','capital',true,
       'controlled',controlled,'total',12,'pressure',pressure,'pace',band,
       'correct_answers',correct_count,'possible_answers',6,
       'operation',military_choice,
       'effect',CASE WHEN military_choice='reconquerir' AND correct_count>=5 THEN 'reconquest'
         WHEN military_choice='proteger' THEN 'civilian_protection'
         WHEN correct_count<3 THEN 'fdr_breakthrough' ELSE 'defensive_hold' END,
       'verified_by','état-major des forces armées d Almizia'));

 END IF;

 IF old.status='playing' AND new.status='finished'
  AND coalesce(t->>'terminal_outcome','')='' THEN
   SELECT a.payload INTO last_lock
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players pp ON pp.id=a.player_id AND pp.room_code=a.room_code
   WHERE a.room_code=new.code AND a.action_type='final_lock'
      AND pp.public_role='enqueteur'
   ORDER BY a.id DESC LIMIT 1;
   locked_levels:=coalesce(last_lock->'levels',last_lock,'{}'::jsonb);
   SELECT pack->'truth'->'levels' INTO truth_levels FROM public.igr_v4_scenario_packs
    WHERE scenario_id=new.scenario_id;
   SELECT count(*)::int,
    count(*) FILTER(WHERE (locked_levels->>pp.id::text) ~ '^[0-2]$'
      AND (locked_levels->>pp.id::text)::int=
      coalesce((truth_levels->>(pp.internal_slot-1))::int,-2))::int
   INTO total_suspects,precise
   FROM public.igr_v4_players pp WHERE pp.room_code=new.code AND pp.public_role='suspect';
   held_before_final:=least(12,greatest(0,initial_control-floor(pressure::numeric/threshold)::int+counterpush));
   group_survives:=total_suspects>0 AND precise>=pg_catalog.ceil(total_suspects*2.0/3.0)::int AND held_before_final>0;
   IF group_survives THEN
     t:=t||jsonb_build_object('terminal_outcome','evidence_preserved',
       'terminal_reason','case_solved_before_breach',
       'final_exact',precise,'final_total',total_suspects,
       'band','SURVIE · PREUVES PRÉSERVÉES');
   ELSE
     pressure:=100;counterpush:=0;
     t:=t||jsonb_build_object('terminal_outcome','front_at_gates',
       'terminal_reason',CASE WHEN held_before_final=0 THEN 'city_lost' ELSE 'verdict_failed' END,
       'final_exact',precise,'final_total',total_suspects,
       'band','DÉFAITE · LE FDR AUX PORTES');
   END IF;
 END IF;
 controlled:=least(12,greatest(0,initial_control-floor(pressure::numeric/threshold)::integer+counterpush));
 display_perimeter:=CASE WHEN controlled=0 THEN 'collapsed'
    WHEN pressure>=75 THEN 'isolated'
    WHEN pressure>=48 THEN 'critical'
    WHEN pressure>=25 THEN 'strained'
    ELSE 'stable' END;
 new_liaison:=CASE WHEN new.scenario_id='028' AND controlled=0 THEN 'lost'
    WHEN new.scenario_id='028' AND controlled<=1 THEN 'last'
    WHEN pressure>=50 THEN 'degraded'
    ELSE 'active' END;
 t:=t||jsonb_build_object(
  'city',city_name,'pressure',pressure,'controlled',controlled,'total',12,'civilian_services',civilian_services,
  'band',coalesce(band,t->>'band','DÉBUT DU SIÈGE'),
  'last_scored_cycle',latest_cycle,'history',history,'perimeter',display_perimeter,
  'liaison',new_liaison);
 new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{terror_v681}',t,true);
 new.state:=jsonb_set(new.state,'{dlc_world}',
  coalesce(new.state->'dlc_world','{}'::jsonb)||jsonb_build_object(
    'kind','terror','districts_total',12,'districts_controlled',controlled,'civilian_services',civilian_services,
    'perimeter',display_perimeter,'liaison',new_liaison,'city',city_name),true);
 new.state:=jsonb_set(new.state,'{terror}',
  coalesce(new.state->'terror','{}'::jsonb)||jsonb_build_object(
    'enabled',true,'perimeter',greatest(0,100-pressure),
    'band',band,'city',city_name),true);
 RETURN new;
END; $function$
;
CREATE OR REPLACE FUNCTION public.igr_v4_generic_role_card(p_role text, p_context text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
begin case p_role when 'enqueteur' then return jsonb_build_object('place','Tu diriges l’enquête.','chronology',p_context,'hide','Tu ne caches aucun fait du dossier.','anchors','Croise les horaires, les accès, les objets et les contradictions. Le stress n’est pas une preuve.','position','Tu mènes les interrogatoires et portes la reconstruction factuelle finale.'); when 'analyste' then return jsonb_build_object('place','Tu observes les interrogatoires et aides l’Enquêteur.','chronology',p_context,'hide','Tes notes restent privées jusqu’aux échanges avec l’Enquêteur.','anchors','Repère les contradictions et les changements de version. Une impression n’est pas une preuve.','position','Tu aides à reconstruire les faits et participes à la délibération finale avec le Juge.'); when 'procureur' then return jsonb_build_object('place','Tu portes l’accusation.','chronology',p_context,'hide','Tes priorités d’entretien restent stratégiques.','anchors','Tu peux saisir le Juge et participes à sa délibération finale.','position','Accuse uniquement ce que les faits permettent de soutenir.'); when 'juge' then return jsonb_build_object('place','Tu arbitres l’accès aux éléments protégés et rends la décision officielle.','chronology',p_context,'hide','Ton statut d’intégrité et tes éventuels objectifs restent strictement privés.','anchors','Tu peux maintenir au maximum 3 éléments sous protection. Tu peux convoquer chaque joueur libre une fois par cycle pendant 2 minutes.','position','Tu n’enquêtes pas. À la fin, tu délibères obligatoirement avec le camp d’enquête puis tu tranches la responsabilité de chacun.'); when 'journaliste' then return jsonb_build_object('place','Tu enquêtes en dehors de tous les camps.','chronology',p_context,'hide','Tes sources et ton angle restent à toi.','anchors','Tu peux saisir le Juge pour un accès, une publication ou la protection d’une source.','position','Tu peux mettre la pression. Une publication n’est pas un verdict.'); when 'inspecteur' then return jsonb_build_object('place','Tu travailles sur le terrain.','chronology',p_context,'hide','Tes priorités de recherche restent privées jusqu’au résultat.','anchors','Une action de terrain par cycle.','position','Tu choisis où chercher. L’Expert dit ce que les traces prouvent.'); when 'officier_liaison' then return jsonb_build_object('place','Tu représentes l’état-major des forces armées d’Almizia à la Grey Room dans la dernière capitale libre.','chronology',p_context,'hide','Tu ne connais pas la vérité judiciaire ni les plans de toutes les factions du FDR.','anchors','Un ordre militaire public et irréversible par cycle. Tenir la ligne ou protéger les civils est possible immédiatement; une reconquête n est autorisée qu après au moins cinq réponses exactes sur six au cycle précédent. Le bilan militaire et le maintien des services civils évoluent séparément.','position','Tu décides des opérations militaires des forces armées d Almizia. Protéger les civils préserve des services et des archives mais peut coûter du terrain. Tenir freine la progression du FDR; reconquérir sur un dossier insuffisant l accélère. Tu ne contrôles ni les réponses ni le verdict et tu es exécuté avec les autres occupants si la Grey Room tombe.'); when 'expert' then return jsonb_build_object('place','Tu es l’Expert / médecin légiste.','chronology',p_context,'hide','Tes priorités d’analyse restent privées.','anchors','Une analyse complémentaire par cycle.','position','Tu établis un fait technique. Tu ne désignes jamais un coupable.'); when 'temoin' then return jsonb_build_object('place','Tu es témoin dans le dossier.','chronology',p_context,'hide','Tu peux garder un élément personnel pour toi tant que tu ne changes pas les faits.','anchors','La fenêtre témoins est commune.','position','Réponds uniquement avec ce que tu sais réellement.'); when 'maitre' then return jsonb_build_object('place','Tu es l’Avocat.','chronology',p_context,'hide','Tu ne connais pas automatiquement les secrets des suspects.','anchors','Tu peux accepter un seul client officiel. Les autres suspects non représentés disposent chacun d’une unique consultation de 1 minute, seulement pendant leur propre interrogatoire.','position','Défends la frontière exacte de la responsabilité de ton client, sans inventer de fait ni de preuve.'); else return jsonb_build_object('place',p_role,'chronology',p_context,'hide','','anchors','','position',''); end case; end $function$
;
CREATE OR REPLACE FUNCTION public.igr_v688_terror_operations(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
last_result jsonb;previous_score integer:=0;
choices jsonb;chosen text;prev_cycle int;scenario text;eligible boolean;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'not military officer';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RETURN jsonb_build_object('enabled',false);END IF;
 SELECT a.payload->>'choice' INTO chosen FROM public.igr_v4_actions a
 WHERE a.room_code=r.code AND a.cycle=r.cycle AND a.player_id=p.id
 AND a.action_type='terror_v688_military' ORDER BY a.id DESC LIMIT 1;
 last_result:=coalesce(r.state#>'{terror_v681,history}','[]'::jsonb)->-1;
 prev_cycle:=coalesce((last_result->>'cycle')::integer,0);
 previous_score:=CASE WHEN prev_cycle=r.cycle-1 THEN coalesce((last_result->>'correct_answers')::int,0) ELSE 0 END;
 eligible:=r.cycle>1 AND previous_score>=5;
 scenario:=r.scenario_id;
 choices:=jsonb_build_array(
  jsonb_build_object('id','tenir','name',CASE scenario WHEN '026' THEN 'Défendre les institutions et les archives' WHEN '027' THEN 'Tenir les positions nationales' ELSE 'Verrouiller le périmètre de la Grey Room' END,
   'risk','Réduit les pertes possibles, sans reconquête immédiate'),
  jsonb_build_object('id','proteger','name',CASE scenario WHEN '026' THEN 'Sécuriser les services civils' WHEN '027' THEN 'Protéger les civils encore exposés' ELSE 'Garantir une évacuation des témoins vulnérables' END,
   'risk','Protège les services civils, les personnes et les archives. Cette priorité peut coûter du terrain, mais elle améliore une mesure humanitaire indépendante de la carte.')
 );
 IF eligible THEN
  choices:=choices||jsonb_build_array(jsonb_build_object('id','reconquerir',
    'name',CASE scenario WHEN '026' THEN 'Reprendre un secteur et restaurer son administration' WHEN '027' THEN 'Rétablir le contrôle d une zone contestée' ELSE 'Desserrer l encerclement de la capitale' END,
    'risk','Un succès exige de nouvelles preuves; une mauvaise interprétation peut aggraver la situation'));
 END IF;
 RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'choices',choices,
  'previous_quality',CASE WHEN r.cycle=1 THEN 'aucune_synthese' WHEN previous_score>=5 THEN 'fiable'
   WHEN previous_score>=3 THEN 'partielle' ELSE 'incertaine' END,
  'already_chosen',chosen,'operation_window','during_cycle_before_debrief_close');
END; $function$
;
DO $audit$
DECLARE f text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO f;
 IF position('civilian_services_after' in f)=0 OR position('counterpush:=least(2,counterpush+1)' in f)=0 THEN RAISE EXCEPTION 'scoring independence lost';END IF;
 IF has_table_privilege('anon','igr_private.igr_v691_terror_function_backups','SELECT') THEN RAISE EXCEPTION 'privileged backups exposed';END IF;
END $audit$;
COMMIT;