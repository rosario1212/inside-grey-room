BEGIN;

-- TERROR V694 / deterministic, per-room command state; private source remains private.
CREATE TABLE IF NOT EXISTS igr_private.igr_v694_function_backups
(signature text primary key, definition text not null, saved_at timestamptz not null default clock_timestamp());
ALTER TABLE igr_private.igr_v694_function_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v694_function_backups FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v694_function_backups(signature,definition)
SELECT sig,pg_get_functiondef(sig::regprocedure)
FROM (VALUES ('public.igr_v4_role_capacity(text,integer,text)'),
 ('public.igr_v4_generic_role_card(text,text)'),
 ('public.igr_v693_terror_officer_join(text,uuid,text,timestamptz)'),
 ('public.igr_v4_signal_send(text,uuid,uuid,text,jsonb)'),
 ('igr_private.igr_v681_terror_dynamic_room()'),
 ('public.igr_v4_make_reveal(text)')) v(sig)
ON CONFLICT(signature) DO NOTHING;

-- Existing CASE for specialist roles accidentally raises CASE_NOT_FOUND on all standard roles.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure) INTO fn;
 IF position(E'when \'inspecteur\' then return case when p_scenario=\'027\'' in fn)=0 THEN
   RAISE EXCEPTION 'v694 role capacity anchor missing';
 END IF;
 fn:=replace(fn,E'  end case;\n end if;\n if r=\'enqueteur\'',
                   E'  else null;\n  end case;\n end if;\n if r=\'enqueteur\'');
 EXECUTE fn;
END $patch$;

-- The Inspector is not the Officer: remove legacy name collisions and post-verdict restriction.
UPDATE public.igr_v4_scenario_packs
SET pack=jsonb_set(
    jsonb_set(pack,'{role_notes,inspecteur,place}',
      to_jsonb('Tu es Inspecteur : tu vérifies des informations sur le terrain. L Officier commande séparément les forces gouvernementales.'::text),true),
    '{role_notes,inspecteur,anchors}',
      to_jsonb('Tu recherches des faits vérifiables, sans commander d opérations. Les décisions militaires appartiennent à l Officier.'::text),true)
WHERE scenario_id IN ('027','028');
UPDATE public.igr_v4_scenario_packs
SET pack=jsonb_set(pack,'{context}',
 to_jsonb(replace(pack->>'context','L’Officier de liaison devra, après le verdict, porter la décision militaire finale.',
 'L’Officier prend trois décisions militaires par cycle, tandis que l’Enquêteur établit séparément les responsabilités.')::text),true)
WHERE scenario_id='027';

-- Shared role card, with nine decisions, three separate suspect visits and two confrontations.
DO $patch$
DECLARE fn text;a int;b int;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_generic_role_card(text,text)'::regprocedure) INTO fn;
 a:=strpos(fn,'when ''officier_liaison'' then');
 b:=strpos(fn,'when ''expert'' then');
 IF a=0 OR b<=a THEN RAISE EXCEPTION 'v694 role-card anchors unavailable';END IF;
 fn:=substring(fn from 1 for a-1)||
 $off$when 'officier_liaison' then return jsonb_build_object(
 'place','OFFICIER — Tu commandes les opérations des forces gouvernementales d Almizia, sans diriger l enquête.',
 'chronology',p_context,
 'hide','Tu ne connais ni la variante secrète ni la vérité judiciaire. Tu dois agir avec des renseignements incomplets.',
 'anchors','Trois décisions militaires distinctes par cycle, déclenchées à des moments imprévus et chronométrées entre 60 et 120 secondes. Chaque confirmation produit immédiatement un bulletin public et un changement chiffré. Un suspect différent à interroger par cycle (cycles 1, 2, 3). Une confrontation supplémentaire possible au cycle 2 et au cycle 3, sans consommer ta visite.',
 'position','Tu protèges la capitale, choisis où consacrer les moyens et assumes les répercussions en temps réel. Tu poses une question ciblée lors de tes séances autorisées, sans prendre le contrôle du verdict. Ta réussite militaire dépend de la survie du périmètre et de tes décisions, même si l enquête se trompe.'); $off$||
 substring(fn from b);
 EXECUTE fn;
END $patch$;

-- The existing hearing join becomes a suspect-only visit usable at every cycle.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v693_terror_officer_join(text,uuid,text,timestamptz)'::regprocedure) INTO fn;
 IF position('one officer intervention per cycle' in fn)=0 THEN RAISE EXCEPTION 'v694 hearing anchor missing';END IF;
 fn:=replace(fn,'r.cycle NOT IN (2,3)','r.cycle NOT BETWEEN 1 AND 3');
 fn:=replace(fn,'r.phase NOT IN (''interrogation'',''event_confrontation'')',
                 'r.phase <> ''interrogation''');
 fn:=replace(fn,' question_text:=CASE focus_',
 $distinct$  IF EXISTS (
    SELECT 1 FROM public.igr_v4_actions a
    WHERE a.room_code=r.code AND a.player_id=p.id
     AND a.action_type='terror_v693_officer_join'
     AND a.payload->'targets' ? (session_targets->>0)
  ) THEN RAISE EXCEPTION 'suspect already visited in a previous cycle'; END IF;
  question_text:=CASE focus_$distinct$);
 EXECUTE fn;
 SELECT pg_get_functiondef('public.igr_v4_signal_send(text,uuid,uuid,text,jsonb)'::regprocedure) INTO fn;
 fn:=replace(fn,'or r.cycle<2','');
 EXECUTE fn;
END $patch$;

-- A confrontation is independent of the one-suspect-per-cycle visit.
CREATE OR REPLACE FUNCTION public.igr_v694_officer_confront(
 p_code text,p_player_token uuid,p_focus text,p_phase_started_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 focus_ text;parts jsonb;question_text text;visit jsonb;
BEGIN
 PERFORM igr_private.rate_limit('terror_694_confront',coalesce(p_player_token::text,''),8,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'officer only';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing'
  OR r.cycle NOT IN (2,3) OR r.phase<>'event_confrontation'
  OR r.phase_started_at IS DISTINCT FROM p_phase_started_at
  OR r.phase_ends_at<=clock_timestamp() OR r.state->>'event_active'<>'confrontation'
  OR jsonb_array_length(coalesce(r.state->'event_targets','[]'::jsonb))<>2
 THEN RAISE EXCEPTION 'no eligible active confrontation';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
  AND a.player_id=p.id AND a.cycle=r.cycle AND a.action_type='terror_v694_officer_confront')
 THEN RAISE EXCEPTION 'one military confrontation per cycle'; END IF;
 focus_:=lower(trim(coalesce(p_focus,'')));
 IF focus_ NOT IN ('source','civils','acces') THEN RAISE EXCEPTION 'invalid focus';END IF;
 question_text:=CASE focus_ WHEN 'source' THEN 'Quel élément daté permet de vérifier vos deux versions ?'
   WHEN 'civils' THEN 'Quels civils ou captifs sont concernés par vos contradictions ?'
   ELSE 'Quel accès ou quelle autorisation peut être contrôlé indépendamment ?' END;
 visit:=jsonb_build_object('cycle',r.cycle,'visitor_id',p.id::text,'session_type','confrontation',
  'session_epoch_ms',floor(extract(epoch from r.phase_started_at)*1000)::bigint,
  'focus',focus_,'question',question_text,'targets',r.state->'event_targets');
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'terror_v694_officer_confront',visit);
 parts:=coalesce(r.state->'event_participants',r.state->'event_targets');
 IF NOT parts ? p.id::text THEN parts:=parts||to_jsonb(p.id::text);END IF;
 UPDATE public.igr_v4_rooms SET state=jsonb_set(jsonb_set(state,
  '{event_participants}',parts,true),'{terror_v694_officer_confront}',visit,true),updated_at=now()
 WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'terror_v694_officer_confront','public',r.cycle,
  jsonb_build_object('title','L OFFICIER REJOINT LA CONFRONTATION',
   'text',question_text,'officer_id',p.id::text,'no_automatic_evidence',true));
 RETURN jsonb_build_object('ok',true,'joined',true,'cycle',r.cycle,'question',question_text);
END; $body$;
REVOKE ALL ON FUNCTION public.igr_v694_officer_confront(text,uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v694_officer_confront(text,uuid,text,timestamptz) TO anon,authenticated;

-- Neutralize the old duplicate military effect at debrief without losing its
-- intelligence grading or changing non-Terror behavior.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO fn;
 IF position('delta:=CASE military_choice' in fn)=0 OR position('civilian_services:=' in fn)=0
 THEN RAISE EXCEPTION 'v694 current military pressure function differs';END IF;
 fn:=replace(fn,'delta:=CASE military_choice',
  'delta:=CASE WHEN coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN 0 ELSE CASE military_choice');
 fn:=replace(fn,'ELSE 27 END;','ELSE 27 END END;');
 fn:=replace(fn,'IF correct_count<3 THEN counterpush',
  'IF correct_count<3 AND NOT coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN counterpush');
 fn:=replace(fn,'IF military_choice=''reconquerir'' AND correct_count>=5 THEN',
  'IF military_choice=''reconquerir'' AND correct_count>=5 AND NOT coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN');
 fn:=replace(fn,'civilian_services:=greatest(0,least(6,civilian_services+',
  'civilian_services:=greatest(0,least(6,civilian_services+CASE WHEN coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN 0 ELSE ');
 fn:=replace(fn,'ELSE 0 END));','ELSE 0 END END));');
 fn:=replace(fn,'IF military_choice=''reconquerir'' AND correct_count<5 THEN',
  'IF military_choice=''reconquerir'' AND correct_count<5 AND NOT coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN');
 fn:=replace(fn,'    INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)',
  E'    IF coalesce((new.state#>>''{terror_v694,enabled}'')::boolean,false) THEN\n      msg:=''Les ordres de ce cycle ont déjà produit leurs conséquences publiques en temps réel. Les nouvelles conclusions judiciaires préparent les opérations suivantes.'';\n    END IF;\n    INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)');
 fn:=replace(fn,
  'group_survives:=total_suspects>0 AND precise>=pg_catalog.ceil(total_suspects*2.0/3.0)::int AND held_before_final>0;',
  'group_survives:=held_before_final>0;');
 fn:=replace(fn,'''terminal_reason'',''case_solved_before_breach''',
  '''terminal_reason'',CASE WHEN precise>=pg_catalog.ceil(total_suspects*2.0/3.0)::int THEN ''case_solved_before_breach'' ELSE ''capital_held_verdict_incomplete'' END');
 EXECUTE fn;
END $patch$;

-- Separate military survival from the judicial accuracy score at reveal.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_make_reveal(text)'::regprocedure) INTO fn;
 IF position('terror_v688_military' in fn)=0 THEN RAISE EXCEPTION 'v694 reveal anchor missing';END IF;
 fn:=replace(fn,'and (exact<threshold OR coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0)',
   'and coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0');
 fn:=replace(fn,E'exact<threshold OR\n           coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0',
   'coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0');
 fn:=replace(fn,E'exact<threshold OR\n           coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0',
   'coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)=0');
 fn:=replace(fn,'''terror_v688_military''','''terror_v694_military''');
 fn:=replace(fn,
  'success:=exact>=threshold' || E'\n        AND coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)>0' || E'\n        AND action_count>=1;',
  'success:=coalesce((r.state#>>''{terror_v681,controlled}'')::int,0)>0 AND action_count>=9;');
 fn:=replace(fn,'Tes ordres ont contribué à préserver les défenses de la capitale d Almizia, appuyés par un dossier suffisamment exact. La Grey Room tient encore.',
  'Tu as confirmé les neuf décisions et contribué à la défense de la capitale. Le résultat judiciaire est évalué indépendamment.');
 fn:=replace(fn,'Tu n as transmis aucun ordre militaire avant l issue de la crise. Le FDR prend la capitale ou les preuves ne permettent pas de conclure.',
  'Tu n as pas confirmé les neuf décisions requises. Ta mission de commandement est incomplète.');
 fn:=replace(fn,'Malgré tes décisions, les informations disponibles et le dernier verdict ne permettent pas d empêcher le FDR de prendre la Grey Room.',
  'Ta mission militaire échoue : le périmètre est perdu ou les neuf décisions ne sont pas confirmées.');
 EXECUTE fn;
END $patch$;

-- This function is private: callers must authenticate through the two public RPCs.
CREATE OR REPLACE FUNCTION igr_private.igr_v694_commit(
 p_code text,p_officer uuid,p_cycle int,p_slot int,p_choice text,p_auto boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE r public.igr_v4_rooms%rowtype;t jsonb;v jsonb;active jsonb;
 n int;pressure_ int;controlled_ int;initial_ int;threshold_ int;counter_ int;services_ int;
 prev_score int:=0;delta_ int;service_delta int;label_ text;result_ jsonb;valid_ text[];
 choice_ text:=lower(trim(coalesce(p_choice,''))); event_text text;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle<>p_cycle OR r.scenario_id NOT IN ('026','027','028')
 THEN RAISE EXCEPTION 'invalid command cycle';END IF;
 v:=coalesce(r.state->'terror_v694','{}'::jsonb);
 active:=v->'active';
 IF coalesce((active->>'slot')::int,0)<>p_slot OR coalesce((v->>'cycle')::int,0)<>p_cycle
 THEN RAISE EXCEPTION 'military order is not active';END IF;
 SELECT count(*) INTO n FROM public.igr_v4_actions
 WHERE room_code=r.code AND player_id=p_officer AND cycle=r.cycle AND action_type='terror_v694_military';
 IF n<>p_slot-1 THEN RAISE EXCEPTION 'duplicate or out of order command';END IF;
 valid_:=CASE p_slot WHEN 1 THEN ARRAY['defense','archives','evacuation']
  WHEN 2 THEN ARRAY['reserve','secteur','secours']
  ELSE ARRAY['tenir','proteger','reconquerir'] END;
 IF NOT choice_=ANY(valid_) THEN RAISE EXCEPTION 'invalid military choice';END IF;
 t:=coalesce(r.state->'terror_v681','{}'::jsonb);
 SELECT coalesce((h->>'correct_answers')::int,0) INTO prev_score
 FROM jsonb_array_elements(coalesce(t->'history','[]'::jsonb)) h
 WHERE (h->>'cycle')::int=r.cycle-1 LIMIT 1;
 prev_score:=coalesce(prev_score,3); -- cycle 1 starts with uncertain rather than assumed wrong intelligence
 IF r.cycle=1 THEN prev_score:=3;END IF;
 delta_:=CASE r.scenario_id WHEN '026' THEN 6 WHEN '027' THEN 8 ELSE 10 END;
 service_delta:=0;
 IF p_slot=1 THEN
   CASE choice_ WHEN 'defense' THEN delta_:=delta_-7;label_:='Défense des institutions';
     WHEN 'archives' THEN delta_:=delta_-4;service_delta:=1;label_:='Préservation des archives';
     ELSE delta_:=delta_+2;service_delta:=2;label_:='Évacuation des habitants'; END CASE;
 ELSIF p_slot=2 THEN
   CASE choice_ WHEN 'reserve' THEN delta_:=delta_-6;label_:='Réserves conservées';
     WHEN 'secteur' THEN delta_:=delta_-8;service_delta:=-1;label_:='Renfort d un secteur';
     ELSE delta_:=delta_+1;service_delta:=2;label_:='Renfort des secours';END CASE;
 ELSE
   CASE choice_ WHEN 'tenir' THEN delta_:=delta_-7;label_:='Tenir les positions';
     WHEN 'proteger' THEN delta_:=delta_-3;service_delta:=2;label_:='Protéger les civils';
     ELSE label_:='Reconquête limitée';
       IF prev_score>=5 THEN delta_:=delta_-16;service_delta:=1;
       ELSE delta_:=delta_+16;service_delta:=-1;END IF;
   END CASE;
 END IF;
 IF prev_score<3 THEN delta_:=delta_+5;END IF;
 IF prev_score>=5 THEN delta_:=delta_-2;END IF;
 pressure_:=greatest(0,least(100,coalesce((t->>'pressure')::int,0)+delta_));
 counter_:=greatest(0,least(2,coalesce((t->>'counteroffensive')::int,0)));
 IF p_slot=3 AND choice_='reconquerir' AND prev_score>=5 THEN counter_:=least(2,counter_+1);END IF;
 services_:=greatest(0,least(6,coalesce((t->>'civilian_services')::int,0)+service_delta));
 initial_:=CASE r.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 6 ELSE 3 END;
 threshold_:=CASE r.scenario_id WHEN '026' THEN 9 WHEN '027' THEN 12 ELSE 25 END;
 controlled_:=greatest(0,least(12,initial_-floor(pressure_::numeric/threshold_)::int+counter_));
 event_text:=CASE WHEN controlled_>coalesce((t->>'controlled')::int,initial_) THEN
    'Un secteur contesté est repris. Les défenseurs rétablissent une liaison.'
  WHEN controlled_<coalesce((t->>'controlled')::int,initial_) THEN
    'Le FDR progresse : les forces gouvernementales perdent un secteur.'
  WHEN services_>coalesce((t->>'civilian_services')::int,0) THEN
    'La protection des habitants et des services civils est renforcée.'
  ELSE 'Les positions restent inchangées, mais le rapport de forces évolue.' END;
 result_:=jsonb_build_object('slot',p_slot,'cycle',p_cycle,'choice',choice_,
  'label',label_,'auto',p_auto,'pressure',pressure_,'delta',delta_,
  'controlled',controlled_,'civilian_services',services_,
  'text',event_text,'timestamp',clock_timestamp());
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p_officer,r.cycle,'terror_v694_military',result_);
 UPDATE public.igr_v4_rooms SET state=jsonb_set(
  jsonb_set(r.state,'{terror_v681}',t||jsonb_build_object(
   'pressure',pressure_,'controlled',controlled_,'counteroffensive',counter_,
   'civilian_services',services_,'band',upper(label_)),true),
  '{terror_v694}',(v-'active')||jsonb_build_object('last_result',result_,'active',null),true),
 updated_at=clock_timestamp() WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'terror_v694_military_result','public',p_cycle,
  jsonb_build_object('title','ORDRE EXÉCUTÉ · '||upper(label_),'text',event_text,
   'slot',p_slot,'decision',choice_,'automatic',p_auto,
   'controlled',controlled_,'total',12,'pressure',pressure_,
   'civilian_services',services_,'country','Almizia'));
 RETURN result_;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v694_commit(text,uuid,integer,integer,text,boolean) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v694_terror_orders(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 v jsonb;n int;slot_ int;start_ timestamptz;due_ timestamptz;expires_ timestamptz;
 jitter int;duration_ int;score_ int:=3;opts jsonb;previous jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code))
 AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'officer only';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing'
 OR r.cycle NOT BETWEEN 1 AND 3 THEN RETURN jsonb_build_object('enabled',false);END IF;
 v:=coalesce(r.state->'terror_v694','{}'::jsonb);
 IF coalesce((v->>'cycle')::int,0)<>r.cycle THEN
   v:=jsonb_build_object('enabled',true,'cycle',r.cycle,'started_at',clock_timestamp(),
       'active',null,'last_result',null);
   UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{terror_v694}',v,true)
   WHERE code=r.code;
 END IF;
 SELECT count(*) INTO n FROM public.igr_v4_actions a
 WHERE a.room_code=r.code AND a.player_id=p.id AND a.cycle=r.cycle
 AND a.action_type='terror_v694_military';
 slot_:=n+1;
 IF slot_>3 THEN RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,
  'completed',3,'total',3,'active',null,'last_result',v->'last_result');END IF;
 IF r.phase IN ('cycle_debrief','trame','locking','reveal') THEN
  RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'completed',n,
    'total',3,'active',null,'cycle_closed',true,'last_result',v->'last_result');END IF;
 IF v->'active' IS NOT NULL AND jsonb_typeof(v->'active')='object' THEN
   expires_:=(v#>>'{active,expires_at}')::timestamptz;
   IF expires_<=clock_timestamp() AND r.phase NOT IN ('interrogation','event_confrontation') AND v#>>'{active,paused_at}' IS NULL THEN
     PERFORM igr_private.igr_v694_commit(r.code,p.id,r.cycle,slot_,
       CASE slot_ WHEN 1 THEN 'defense' WHEN 2 THEN 'reserve' ELSE 'tenir' END,true);
     SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
     v:=coalesce(r.state->'terror_v694','{}'::jsonb);
     n:=n+1;slot_:=slot_+1;
   END IF;
 END IF;
 IF slot_>3 THEN RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,
   'completed',3,'total',3,'active',null,'last_result',v->'last_result');END IF;
 IF v->'active' IS NULL OR jsonb_typeof(v->'active')='null' THEN
   start_:=(v->>'started_at')::timestamptz;
   jitter:=mod(abs(pg_catalog.hashtext(r.code||':'||r.cycle||':'||slot_)::bigint),25)::int;
   due_:=start_+make_interval(secs=>((slot_-1)*105+18+jitter));
   IF clock_timestamp()>=due_ AND r.phase NOT IN ('interrogation','event_confrontation') THEN
     SELECT coalesce((h->>'correct_answers')::int,3) INTO score_
       FROM jsonb_array_elements(coalesce(r.state#>'{terror_v681,history}','[]'::jsonb)) h
       WHERE (h->>'cycle')::int=r.cycle-1 LIMIT 1;
     score_:=coalesce(score_,3);
     duration_:=CASE mod(abs(pg_catalog.hashtext(r.code||':'||r.cycle||':clock:'||slot_)::bigint)
        +CASE WHEN score_<3 THEN 1 WHEN score_>=5 THEN 2 ELSE 0 END
        +CASE WHEN r.scenario_id='028' THEN 1 ELSE 0 END,3)
       WHEN 0 THEN 60 WHEN 1 THEN 90 ELSE 120 END;
     expires_:=clock_timestamp()+make_interval(secs=>duration_);
     v:=jsonb_set(v,'{active}',jsonb_build_object(
       'slot',slot_,'opened_at',clock_timestamp(),'expires_at',expires_,
       'duration_seconds',duration_),true);
     UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{terror_v694}',v,true) WHERE code=r.code;
   END IF;
 END IF;
 opts:=CASE slot_ WHEN 1 THEN
  '[{"id":"defense","label":"Défendre les institutions"},{"id":"archives","label":"Sauvegarder les archives"},{"id":"evacuation","label":"Évacuer des civils"}]'::jsonb
  WHEN 2 THEN '[{"id":"reserve","label":"Conserver les réserves"},{"id":"secteur","label":"Renforcer un secteur"},{"id":"secours","label":"Renforcer les secours"}]'::jsonb
  ELSE '[{"id":"tenir","label":"Tenir les positions"},{"id":"proteger","label":"Protéger les civils"},{"id":"reconquerir","label":"Tenter une reconquête risquée"}]'::jsonb END;
 RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'completed',n,'total',3,
   'active',v->'active','options',opts,'last_result',v->'last_result');
END $body$;
REVOKE ALL ON FUNCTION public.igr_v694_terror_orders(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v694_terror_orders(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v694_terror_confirm(
 p_code text,p_player_token uuid,p_slot int,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 v jsonb;expires_ timestamptz;result_ jsonb;
BEGIN
 PERFORM igr_private.rate_limit('terror_v694_confirm',coalesce(p_player_token::text,''),12,60);
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'officer only';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
  OR r.phase IN ('cycle_debrief','trame','locking','reveal','interrogation','event_confrontation') THEN RAISE EXCEPTION 'command window closed';END IF;
 v:=coalesce(r.state->'terror_v694','{}'::jsonb);
 IF (v#>>'{active,slot}')::int IS DISTINCT FROM p_slot THEN RAISE EXCEPTION 'stale military order';END IF;
 expires_:=(v#>>'{active,expires_at}')::timestamptz;
 IF expires_<=clock_timestamp() THEN
   result_:=igr_private.igr_v694_commit(r.code,p.id,r.cycle,p_slot,
     CASE p_slot WHEN 1 THEN 'defense' WHEN 2 THEN 'reserve' ELSE 'tenir' END,true);
 ELSE
   result_:=igr_private.igr_v694_commit(r.code,p.id,r.cycle,p_slot,p_choice,false);
 END IF;
 RETURN jsonb_build_object('ok',true,'result',result_);
END $body$;
REVOKE ALL ON FUNCTION public.igr_v694_terror_confirm(text,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v694_terror_confirm(text,uuid,integer,text) TO anon,authenticated;


-- Do not force a player to answer during an interrogation or confrontation.
CREATE OR REPLACE FUNCTION igr_private.igr_v694_pause_hearing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE v jsonb;a jsonb;paused_ timestamptz;deadline_ timestamptz;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') OR new.status<>'playing'
  OR old.phase IS NOT DISTINCT FROM new.phase THEN RETURN new;END IF;
 v:=coalesce(new.state->'terror_v694','{}'::jsonb);
 a:=v->'active';
 IF a IS NULL OR jsonb_typeof(a)<>'object' THEN RETURN new;END IF;
 IF new.phase IN ('interrogation','event_confrontation')
  AND old.phase NOT IN ('interrogation','event_confrontation') THEN
   a:=a||jsonb_build_object('paused_at',clock_timestamp());
 ELSIF old.phase IN ('interrogation','event_confrontation')
  AND new.phase NOT IN ('interrogation','event_confrontation')
  AND nullif(a->>'paused_at','') IS NOT NULL THEN
   paused_:=(a->>'paused_at')::timestamptz;
   deadline_:=(a->>'expires_at')::timestamptz+
      greatest(interval '0 second',clock_timestamp()-paused_);
   a:=(a-'paused_at')||jsonb_build_object('expires_at',deadline_);
 ELSE RETURN new;END IF;
 UPDATE public.igr_v4_rooms SET state=jsonb_set(state,
  '{terror_v694,active}',a,true),updated_at=clock_timestamp()
 WHERE code=new.code;
 RETURN new;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v694_pause_hearing() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v694_pause_hearing ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v694_pause_hearing
AFTER UPDATE OF phase ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v694_pause_hearing();

-- Short cycles or an absent officer never deadlock the story: the three missed
-- decisions are recorded, defaulted and publicly resolved on entry to debrief.
CREATE OR REPLACE FUNCTION igr_private.igr_v694_finish_cycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE r public.igr_v4_rooms%rowtype;o uuid;v jsonb;a jsonb;slot_ int;n int;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028') OR new.status<>'playing'
 OR new.phase<>'cycle_debrief' OR old.phase='cycle_debrief' THEN RETURN new;END IF;
 SELECT id INTO o FROM public.igr_v4_players
 WHERE room_code=new.code AND public_role='officier_liaison' LIMIT 1;
 IF o IS NULL THEN RETURN new;END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=new.code FOR UPDATE;
 v:=coalesce(r.state->'terror_v694','{}'::jsonb);
 IF coalesce((v->>'cycle')::int,0)<>r.cycle THEN
  v:=jsonb_build_object('enabled',true,'cycle',r.cycle,
   'started_at',clock_timestamp(),'active',null,'last_result',null);
  UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{terror_v694}',v,true)
  WHERE code=r.code;
 END IF;
 FOR slot_ IN 1..3 LOOP
  SELECT count(*) INTO n FROM public.igr_v4_actions
  WHERE room_code=r.code AND cycle=r.cycle AND player_id=o
    AND action_type='terror_v694_military';
  EXIT WHEN n>=3;
  IF n+1<>slot_ THEN CONTINUE;END IF;
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=new.code FOR UPDATE;
  v:=coalesce(r.state->'terror_v694','{}'::jsonb);
  a:=jsonb_build_object('slot',slot_,'opened_at',clock_timestamp(),
   'expires_at',clock_timestamp(),'duration_seconds',60);
  UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{terror_v694,active}',a,true)
  WHERE code=r.code;
  PERFORM igr_private.igr_v694_commit(r.code,o,r.cycle,slot_,
    CASE slot_ WHEN 1 THEN 'defense' WHEN 2 THEN 'reserve' ELSE 'tenir' END,true);
 END LOOP;
 RETURN new;
END $body$;
REVOKE ALL ON FUNCTION igr_private.igr_v694_finish_cycle() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v694_finish_cycle ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v694_finish_cycle
AFTER UPDATE OF phase ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v694_finish_cycle();

-- Read-only integrity verification of required nine scripts and separate quotas.
DO $audit$
DECLARE s text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure) INTO s;
 IF position('else null;' in s)=0 THEN RAISE EXCEPTION 'role_capacity patch absent';END IF;
 SELECT pg_get_functiondef('public.igr_v693_terror_officer_join(text,uuid,text,timestamptz)'::regprocedure) INTO s;
 IF position('suspect already visited in a previous cycle' in s)=0 THEN
  RAISE EXCEPTION 'distinct suspect visit guard absent';END IF;
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO s;
 IF position('terror_v694,enabled' in s)=0 THEN RAISE EXCEPTION 'legacy debrief not neutralized';END IF;
END $audit$;

COMMIT;
