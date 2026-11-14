
BEGIN;
CREATE TABLE IF NOT EXISTS igr_private.igr_v681_terror_cities(
 room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 36),
 set_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v681_terror_cities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v681_terror_cities FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS igr_private.igr_v681_terror_question_bank(
 scenario_id text NOT NULL CHECK(scenario_id IN ('026','027','028')),
 cycle integer NOT NULL CHECK(cycle BETWEEN 1 AND 3),
 question_id text NOT NULL CHECK(question_id IN ('q1','q2','q3')),
 question text NOT NULL,
 options jsonb NOT NULL CHECK(jsonb_array_length(options)=3),
 correct text NOT NULL CHECK(correct IN ('a','b','c')),
 PRIMARY KEY(scenario_id,cycle,question_id)
);
ALTER TABLE igr_private.igr_v681_terror_question_bank ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v681_terror_question_bank FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v681_terror_question_bank(scenario_id,cycle,question_id,question,options,correct)
VALUES
('026',1,'q1','Qu''est-ce qui constitue la base la plus solide pour établir les violences antérieures ?','["Le nombre de rumeurs qui circulent","Des témoignages et documents indépendants datés","L''assurance affichée par un suspect"]'::jsonb,'b'),
('026',1,'q2','Une fonction administrative dans le groupe prouve-t-elle à elle seule un ordre de massacre ?','["Non, il faut établir l''acte et les informations reçues","Oui, automatiquement","Oui, si le détenu refuse de répondre"]'::jsonb,'a'),
('026',1,'q3','La persistance de l''organisation après les arrestations doit être établie…','["Par un aveu isolé","Par des signes de peur chez les détenus","Par des indices indépendants de la continuation"]'::jsonb,'c'),
('026',2,'q1','Une décision signée prouve d''abord…','["Le rôle documenté de son signataire, à préciser selon ses pouvoirs","La responsabilité de tous les membres du groupe","L''existence de tous les crimes allégués"]'::jsonb,'a'),
('026',2,'q2','Comment distinguer influence idéologique et commandement effectif ?','["Par le prestige du discours","Par le circuit vérifiable des décisions et transmissions","Par la réaction physique à l''interrogatoire"]'::jsonb,'b'),
('026',2,'q3','Des services civils cessent de fonctionner. Laquelle de ces conclusions est justifiée ?','["Tous les dysfonctionnements sont des actes volontaires","Ils excluent toute responsabilité administrative","Il faut rechercher décisions, alertes et conséquences avant d''attribuer la cause"]'::jsonb,'c'),
('026',3,'q1','Lors du verdict, la bonne méthode consiste à…','["Attribuer à chacun les actes prouvés et ses limites de connaissance","Condamner également tous les suspects","Laisser le suspect le plus effrayé choisir le responsable"]'::jsonb,'a'),
('026',3,'q2','Un compte rendu ancien permet-il de déterminer les intentions actuelles du réseau extérieur ?','["Oui, dans tous les cas","Non, il faut des confirmations récentes","Oui, si la pièce est signée"]'::jsonb,'b'),
('026',3,'q3','Si un témoin devient injoignable, son témoignage déjà authentifié devient-il faux ?','["Oui","Il doit être supprimé automatiquement","Non, sa disponibilité et la validité de sa pièce sont distinctes"]'::jsonb,'c'),
('027',1,'q1','Des sévices passés sont établis. Que sait-on de la situation présente d''une zone contestée ?','["Elle est automatiquement confirmée","Elle doit faire l''objet d''une vérification actuelle distincte","Toutes les personnes détenues l''ont quittée"]'::jsonb,'b'),
('027',1,'q2','Plusieurs documents donnent la même information, mais citent la même source. Cela signifie…','["Qu''il n''y a pas encore plusieurs confirmations indépendantes","Que la source est forcément sincère","Qu''aucune information ne peut être utilisée"]'::jsonb,'a'),
('027',1,'q3','La crédibilité d''un fait et la sincérité de celui qui le rapporte sont-elles identiques ?','["Oui","Oui, si la pièce semble officielle","Non : un fait peut être vrai et communiqué avec un intérêt caché"]'::jsonb,'c'),
('027',2,'q1','Une information historiquement vraie décrit-elle nécessairement la situation actuelle ?','["Oui, jusqu''à preuve d''une intention de mentir","Non, il faut contrôler sa date et sa période de validité","Oui, si plusieurs accusés la répètent"]'::jsonb,'b'),
('027',2,'q2','L''absence d''un groupe de victimes dans un registre transmis justifie de…','["Comparer l''original, les transferts et des sources indépendantes","Supposer qu''aucune de ces victimes n''existe","Déduire le nombre exact de personnes aujourd''hui présentes"]'::jsonb,'a'),
('027',2,'q3','Un haut cadre fournit de nombreuses informations justes. L''enquête doit encore vérifier…','["S''il parle avec assurance","S''il possède un titre militaire","L''exhaustivité de sa sélection et ses intérêts dans la décision"]'::jsonb,'c'),
('027',3,'q1','Une liste ancienne de personnes retenues permet-elle d''affirmer qu''une zone est aujourd''hui vide ?','["Non","Oui","Seulement si le suspect le souhaite"]'::jsonb,'a'),
('027',3,'q2','La recommandation de crise doit-elle être la conséquence automatique du verdict judiciaire ?','["Oui, sans autre examen","Non, risques présents et crimes passés sont des questions distinctes","Oui, si tous les interrogés sont coupables"]'::jsonb,'b'),
('027',3,'q3','Face à une situation humanitaire non vérifiée, il faut…','["Masquer les doutes pour être décisif","Transformer une probabilité en certitude","Décrire explicitement l''incertitude et ses conséquences"]'::jsonb,'c'),
('028',1,'q1','Une autorisation d''accès ancienne démontre-t-elle qu''une personne est encore présente dans le centre ?','["Oui","Non : il faut vérifier validité et activité récente","Oui, si l''accusé paraît calme"]'::jsonb,'b'),
('028',1,'q2','Une personne détenue ne craint pas de mourir. Cela prouve-t-il qu''elle commande une cellule intérieure ?','["Oui","Oui, si elle reste silencieuse","Non, ce comportement ne prouve pas la présence ni l''autorité"]'::jsonb,'c'),
('028',1,'q3','Une liaison extérieure cesse de répondre. Lequel de ces constats est justifié ?','["La perte du contact, sans conclure automatiquement au sort de l''interlocuteur","Sa mort certaine","L''infiltration nécessaire du centre"]'::jsonb,'a'),
('028',2,'q1','Un document est reçu tardivement. Quelle date faut-il également contrôler ?','["La date du prochain cycle","Sa création et la période à laquelle il se rapporte","La date du prochain interrogatoire"]'::jsonb,'b'),
('028',2,'q2','Pour confirmer une présence clandestine actuelle, il faut privilégier…','["Le prestige d''un dirigeant","Une menace verbale","Des traces contemporaines et indépendantes"]'::jsonb,'c'),
('028',2,'q3','La coopération d''un ancien agent administratif permet surtout…','["D''authentifier ses propres actes et dossiers dans leurs limites","De connaître automatiquement tous les membres du réseau","De garantir que le centre sera évacué"]'::jsonb,'a'),
('028',3,'q1','Une dernière confirmation extérieure apporte-t-elle une réponse universelle à toutes les questions ?','["Oui","Non, elle doit rester limitée au point réellement vérifié","Oui, si l''Enquêteur la demande"]'::jsonb,'b'),
('028',3,'q2','Des informations administratives ont servi contre des victimes. L''absence de cellule intérieure enlève-t-elle cette responsabilité ?','["Oui","Uniquement si l''agent coopère","Non, les responsabilités passées sont distinctes de la présence actuelle"]'::jsonb,'c'),
('028',3,'q3','Quand tous les secteurs administrés ont été perdus, cela prouve-t-il la destruction de la Grey Room ?','["Non, cela décrit un isolement extrême, pas une destruction automatique","Oui, nécessairement","Oui, si un suspect l''affirme"]'::jsonb,'a')
ON CONFLICT(scenario_id,cycle,question_id) DO UPDATE
SET question=excluded.question,options=excluded.options,correct=excluded.correct;

CREATE OR REPLACE FUNCTION public.igr_v681_terror_set_city(
 p_code text,p_host_token uuid,p_city text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE r public.igr_v4_rooms%rowtype;v text;
BEGIN
 PERFORM igr_private.rate_limit('terror_v681_city',coalesce(p_code,''),8,60);
 SELECT * INTO r FROM public.igr_v4_rooms
 WHERE code=upper(trim(p_code)) AND host_token=p_host_token FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'lobby'
 THEN RAISE EXCEPTION 'city can only be set by the host before play';END IF;
 v:=pg_catalog.btrim(pg_catalog.regexp_replace(coalesce(p_city,''),'[[:space:]]+',' ','g'));
 IF pg_catalog.char_length(v) NOT BETWEEN 2 AND 36
    OR v !~ '^[[:alpha:]][[:alpha:] .''-]{1,35}$'
 THEN RAISE EXCEPTION 'city name invalid';END IF;
 PERFORM igr_private.assert_ugc(v,36,false);
 INSERT INTO igr_private.igr_v681_terror_cities(room_code,city)
 VALUES(r.code,v) ON CONFLICT(room_code) DO UPDATE SET city=excluded.city,set_at=now();
 UPDATE public.igr_v4_rooms
 SET state=jsonb_set(coalesce(state,'{}'::jsonb),'{terror_v681,city}',to_jsonb(v),true),
 updated_at=now() WHERE code=r.code;
 RETURN jsonb_build_object('ok',true,'city',v);
END; $fn$;
REVOKE ALL ON FUNCTION public.igr_v681_terror_set_city(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v681_terror_set_city(text,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v681_terror_get_questions(
 p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;questions jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste')
 THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028')
 OR r.status<>'playing' OR r.phase<>'cycle_debrief' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RETURN jsonb_build_object('enabled',false);END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',q.question_id,'title',q.question,'options',q.options
 ) ORDER BY q.question_id),'[]'::jsonb)
 INTO questions FROM igr_private.igr_v681_terror_question_bank q
 WHERE q.scenario_id=r.scenario_id AND q.cycle=r.cycle;
 RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'questions',questions);
END; $fn$;
REVOKE ALL ON FUNCTION public.igr_v681_terror_get_questions(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v681_terror_get_questions(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v681_terror_submit_quiz(
 p_code text,p_player_token uuid,p_answers jsonb,p_convergence integer,
 p_confusion integer,p_axis text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 q record;answer text;count_q integer:=0;
BEGIN
 PERFORM igr_private.rate_limit('terror_v681_quiz',coalesce(p_player_token::text,''),12,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste')
 THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing'
 OR r.phase<>'cycle_debrief' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'quiz is closed';END IF;
 IF jsonb_typeof(p_answers)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>3
 THEN RAISE EXCEPTION 'exactly three answers required';END IF;
 FOR q IN SELECT question_id FROM igr_private.igr_v681_terror_question_bank
 WHERE scenario_id=r.scenario_id AND cycle=r.cycle ORDER BY question_id LOOP
  count_q:=count_q+1;answer:=p_answers->>q.question_id;
  IF answer IS NULL OR answer NOT IN ('a','b','c','u') THEN
   RAISE EXCEPTION 'invalid answer';END IF;
 END LOOP;
 IF count_q<>3 THEN RAISE EXCEPTION 'question bank incomplete';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
   AND a.cycle=r.cycle AND a.player_id=p.id AND a.action_type IN ('debrief','terror_v681_quiz'))
 THEN RAISE EXCEPTION 'already submitted';END IF;
 IF p_axis NOT IN ('chronologie','acces','mobile','materiel','responsabilite')
 THEN RAISE EXCEPTION 'invalid debrief axis';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'terror_v681_quiz',jsonb_build_object('answers',p_answers));
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'debrief',jsonb_build_object(
 'convergence',greatest(0,least(2,coalesce(p_convergence,1))),
 'confusion',greatest(0,least(2,coalesce(p_confusion,1))),
 'axis',p_axis));
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,'sealed',true);
END; $fn$;
REVOKE ALL ON FUNCTION public.igr_v681_terror_submit_quiz(text,uuid,jsonb,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v681_terror_submit_quiz(text,uuid,jsonb,integer,integer,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v681_terror_dynamic_room()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE city_name text;t jsonb;initial_control integer;threshold integer;pressure integer;controlled integer;band text;delta integer;correct_count integer;submitted_count integer;latest_cycle integer;new_liaison text;display_perimeter text;msg text;history jsonb;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') THEN RETURN new;END IF;
 SELECT city INTO city_name FROM igr_private.igr_v681_terror_cities WHERE room_code=new.code;
 IF old.status='lobby' AND new.status='playing' AND city_name IS NULL THEN
   RAISE EXCEPTION 'Choisis la ville avant de lancer le DLC Terror';END IF;
 IF city_name IS NULL THEN RETURN new;END IF;
 initial_control:=CASE new.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 6 ELSE 3 END;
 threshold:=CASE new.scenario_id WHEN '026' THEN 12 WHEN '027' THEN 16 ELSE 25 END;
 t:=coalesce(new.state->'terror_v681',old.state->'terror_v681','{}'::jsonb);
 IF old.status='lobby' AND new.status='playing' THEN
   t:=jsonb_build_object('city',city_name,'pressure',0,'controlled',initial_control,
    'last_scored_cycle',0,'band','DÉBUT DU SIÈGE','history','[]'::jsonb,
    'model','v681-evidence-responsive');
 END IF;
 pressure:=greatest(0,least(100,coalesce((t->>'pressure')::integer,0)));
 latest_cycle:=greatest(0,coalesce((t->>'last_scored_cycle')::integer,0));
 history:=coalesce(t->'history','[]'::jsonb);
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
   band:=CASE WHEN correct_count>=5 THEN 'PROGRESSION RALENTIE'
              WHEN correct_count>=3 THEN 'PRESSION RENFORCÉE'
              ELSE 'PERCÉE RAPIDE' END;
   delta:=CASE WHEN correct_count>=5 THEN 9 WHEN correct_count>=3 THEN 17 ELSE 27 END;
   pressure:=least(100,pressure+delta);
   latest_cycle:=old.cycle;
   history:=history||jsonb_build_array(jsonb_build_object(
     'cycle',latest_cycle,'band',band,'delta',delta,'submissions',submitted_count));
   controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);
   msg:=CASE new.scenario_id
     WHEN '026' THEN CASE
       WHEN correct_count>=5 THEN 'Les pièces fiables orientent les enquêteurs. L avancée ralentit, mais les institutions demeurent menacées.'
       WHEN correct_count>=3 THEN 'Les contradictions ne sont pas toutes résolues. Des secteurs deviennent plus difficiles à défendre.'
       ELSE 'La reconstitution reste trop lacunaire. Les services perdent des contacts et le groupe se rapproche plus vite.' END
     WHEN '027' THEN CASE
       WHEN correct_count>=5 THEN 'L analyse des sources évite de confondre faits historiques et renseignements actuels. La pression continue.'
       WHEN correct_count>=3 THEN 'Les incertitudes pèsent sur la recommandation à venir. La zone contestée devient plus isolée.'
       ELSE 'Des renseignements mal évalués aggravent la crise. La décision extérieure reste distincte du verdict.' END
     ELSE CASE
       WHEN correct_count>=5 THEN 'Les enquêteurs distinguent les traces d archives des preuves contemporaines. Le centre gagne un répit fragile.'
       WHEN correct_count>=3 THEN 'Les communications se fragmentent. La dernière confirmation extérieure devient précieuse.'
       ELSE 'Les certitudes du camp sont insuffisantes : l encerclement s accélère. La dernière liaison peut disparaître.' END END;
   INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
   VALUES(new.code,'terror_v681_city_fall','public',old.cycle,
    jsonb_build_object('title',upper(city_name)||' · FIN DU CYCLE '||old.cycle,
      'text',msg,'city',city_name,'controlled',controlled,'total',12,
      'pressure',pressure,'pace',band));
 END IF;
 controlled:=greatest(0,initial_control-floor(pressure::numeric/threshold)::integer);
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
  'city',city_name,'pressure',pressure,'controlled',controlled,'total',12,
  'band',coalesce(band,t->>'band','DÉBUT DU SIÈGE'),
  'last_scored_cycle',latest_cycle,'history',history,'perimeter',display_perimeter,
  'liaison',new_liaison);
 new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{terror_v681}',t,true);
 new.state:=jsonb_set(new.state,'{dlc_world}',
  coalesce(new.state->'dlc_world','{}'::jsonb)||jsonb_build_object(
    'kind','terror','districts_total',12,'districts_controlled',controlled,
    'perimeter',display_perimeter,'liaison',new_liaison,'city',city_name),true);
 new.state:=jsonb_set(new.state,'{terror}',
  coalesce(new.state->'terror','{}'::jsonb)||jsonb_build_object(
    'enabled',true,'perimeter',greatest(0,100-pressure),
    'band',band,'city',city_name),true);
 RETURN new;
END; $fn$;
DROP TRIGGER IF EXISTS zz_igr_v681_terror_room_dynamic ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v681_terror_room_dynamic
BEFORE UPDATE OF phase,status,cycle,state ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v681_terror_dynamic_room();

CREATE OR REPLACE FUNCTION public.igr_terror_emit_perimeter()
RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $fn$
DECLARE p integer;city_name text;controlled integer;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') OR new.status<>'playing' THEN RETURN new;END IF;
 IF NOT (old.status IS DISTINCT FROM new.status OR old.cycle IS DISTINCT FROM new.cycle) THEN RETURN new;END IF;
 p:=coalesce((new.state#>>'{terror_v681,pressure}')::integer,0);
 city_name:=coalesce(new.state#>>'{terror_v681,city}','LA VILLE');
 controlled:=coalesce((new.state#>>'{terror_v681,controlled}')::integer,0);
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(new.code,'terror_v681_checkpoint','public',new.cycle,jsonb_build_object(
   'title','SITUATION · '||upper(city_name),
   'text','Le périmètre évolue autour du centre judiciaire. Chaque cycle apporte de nouvelles informations et une pression collective.',
   'pressure',p,'controlled',controlled,'total',12,'city',city_name));
 RETURN new;
END; $fn$;

DO $patch$
DECLARE old_fn text;new_fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v33_terror_checkpoint(text,uuid)'::regprocedure)
 INTO old_fn;
 IF old_fn IS NULL THEN RAISE EXCEPTION 'Existing 028/027 special runtime missing';END IF;
 new_fn:=old_fn;
 IF position('changed:=old_stage<>stage or st->''dlc_world'' is distinct from w;' in new_fn)=0
 THEN RAISE EXCEPTION 'Checkpoint merge point missing';END IF;
 new_fn:=replace(new_fn,
 'changed:=old_stage<>stage or st->''dlc_world'' is distinct from w;',
 'if r.state ? ''terror_v681'' then
   w:=w||jsonb_build_object(
     ''districts_controlled'',coalesce((r.state#>>''{terror_v681,controlled}'')::integer,0),
     ''perimeter'',r.state#>>''{terror_v681,perimeter}'',
     ''liaison'',r.state#>>''{terror_v681,liaison}'',
     ''city'',r.state#>>''{terror_v681,city}'');
 end if;
 changed:=old_stage<>stage or st->''dlc_world'' is distinct from w;');
 IF position('insert into public.igr_v4_events(room_code,event_type,payload)' in new_fn)=0
 THEN RAISE EXCEPTION 'Checkpoint public event point missing';END IF;
 new_fn:=replace(new_fn,
 'insert into public.igr_v4_events(room_code,event_type,payload)',
 'if r.state ? ''terror_v681'' then
   event_text:=''Situation actualisée à ''||coalesce(r.state#>>''{terror_v681,city}'',''la ville'')||
    ''. Le périmètre est sous pression; les réponses du camp détermineront la vitesse de la prochaine avancée.'';
 end if;
 insert into public.igr_v4_events(room_code,event_type,payload)');
 EXECUTE new_fn;
END; $patch$;

DO $audit$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM igr_private.igr_v681_terror_question_bank;
 IF n<>27 OR
 (SELECT count(*) FROM (SELECT scenario_id,cycle,count(*) c
   FROM igr_private.igr_v681_terror_question_bank GROUP BY 1,2 HAVING count(*)<>3) x)>0
 THEN RAISE EXCEPTION 'Invalid Terror question bank';END IF;
 IF has_table_privilege('anon','igr_private.igr_v681_terror_question_bank','SELECT')
 OR has_table_privilege('authenticated','igr_private.igr_v681_terror_cities','SELECT')
 THEN RAISE EXCEPTION 'Private Terror data exposed';END IF;
END; $audit$;
COMMIT;
