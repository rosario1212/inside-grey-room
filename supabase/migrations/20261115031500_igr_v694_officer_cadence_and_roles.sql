-- v694 · Consistent role rules and three-stage military command (Terror 026–028).
-- New functions require player tokens, enforce phase, deadlines, and preserve existing truth/verdict.
CREATE OR REPLACE FUNCTION igr_private.igr_v694_window(p_step integer,p_time timestamptz)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path TO ''
AS $body$
DECLARE opens timestamptz; seconds_delay integer;
BEGIN
 seconds_delay:=CASE WHEN p_step=1 THEN 0 ELSE (25+floor(random()*61))::integer END;
 opens:=p_time+seconds_delay*interval '1 second';
 RETURN jsonb_build_object('available_at',opens,
  'deadline',opens+((60+floor(random()*61))::integer*interval '1 second'));
END;
$body$;
REVOKE ALL ON FUNCTION igr_private.igr_v694_window(integer,timestamptz) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v694_officer_state(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
s jsonb;t timestamptz:=clock_timestamp();step_ integer;legacy text;
opens timestamptz;closes timestamptz;choices jsonb;modified boolean:=false;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code))
  AND player_token=p_player_token AND public_role='officier_liaison';
 IF NOT FOUND THEN RAISE EXCEPTION 'officer role required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing'
  OR r.cycle NOT BETWEEN 1 AND 3 OR r.phase IN ('cycle_debrief','trame','locking','reveal')
 THEN RETURN jsonb_build_object('enabled',false);END IF;
 s:=coalesce(r.state->'terror_v694','{}'::jsonb);
 IF coalesce((s->>'cycle')::integer,0)<>r.cycle THEN
  s:=jsonb_build_object('cycle',r.cycle,'step',1,'decisions','{}'::jsonb)
   ||igr_private.igr_v694_window(1,t);
  modified:=true;
 END IF;
 step_:=coalesce((s->>'step')::integer,1);
 IF step_=1 THEN
  SELECT a.payload->>'choice' INTO legacy FROM public.igr_v4_actions a
  WHERE a.room_code=r.code AND a.player_id=p.id AND a.cycle=r.cycle
   AND a.action_type='terror_v688_military' ORDER BY a.id DESC LIMIT 1;
  IF legacy IS NOT NULL THEN
   s:=s||jsonb_build_object('step',2,'decisions',
    coalesce(s->'decisions','{}'::jsonb)||jsonb_build_object('1',legacy))
    ||igr_private.igr_v694_window(2,t);
   step_:=2;modified:=true;
  END IF;
 END IF;
 IF step_ BETWEEN 1 AND 3 AND t>(s->>'deadline')::timestamptz THEN
  s:=s||jsonb_build_object('step',step_+1,'decisions',
   coalesce(s->'decisions','{}'::jsonb)||jsonb_build_object(step_::text,'non_recu'))
   ||igr_private.igr_v694_window(step_+1,t);
  INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  VALUES(r.code,'terror_v694_order_missed','public',r.cycle,
   jsonb_build_object('title','ORDRE NON REÇU',
    'text','La fenêtre de décision '||step_||' a expiré. Aucun ordre de remplacement n est inventé.'));
  step_:=step_+1;modified:=true;
 END IF;
 IF modified THEN
  UPDATE public.igr_v4_rooms SET state=jsonb_set(coalesce(state,'{}'::jsonb),
    '{terror_v694}',s,true),updated_at=now() WHERE code=r.code;
 END IF;
 opens:=(s->>'available_at')::timestamptz;
 closes:=(s->>'deadline')::timestamptz;
 IF step_=1 THEN
  choices:=coalesce((public.igr_v688_terror_operations(r.code,p_player_token))->'choices','[]'::jsonb);
 ELSIF step_=2 THEN
  choices:=jsonb_build_array(
   jsonb_build_object('id','abris','name','Ouvrir des abris civils',
    'risk','Des services sont immédiatement protégés. Le front perd des réserves.'),
   jsonb_build_object('id','renforts','name','Renforcer les positions avancées',
    'risk','La défense reçoit des moyens, sans protection civile supplémentaire.'));
 ELSIF step_=3 THEN
  choices:=jsonb_build_array(
   jsonb_build_object('id','verification','name','Vérifier la synthèse de renseignement',
    'risk','Une vérification utile réduit les pertes; une synthèse faible ralentit la réponse.'),
   jsonb_build_object('id','urgence','name','Diffuser un ordre opérationnel urgent',
    'risk','Fort gain avec 5 réponses exactes sur 6; fort risque avec des données erronées.'));
 ELSE choices:='[]'::jsonb;END IF;
 RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'step',step_,
  'title',CASE step_ WHEN 1 THEN '1/3 · Défense territoriale'
    WHEN 2 THEN '2/3 · Protection et réserves'
    WHEN 3 THEN '3/3 · Exploitation du renseignement'
    ELSE 'Décisions closes' END,
  'available_at',opens,'deadline',closes,'server_now',t,
  'ready',step_ BETWEEN 1 AND 3 AND t>=opens AND t<closes,
  'choices',choices,'decisions',coalesce(s->'decisions','{}'::jsonb),
  'civilian_services',coalesce((r.state#>>'{terror_v681,civilian_services}')::integer,0));
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v694_officer_state(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v694_officer_state(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v694_officer_decide(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE status_ jsonb;p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
s jsonb;step_ integer;c text;at_ timestamptz:=clock_timestamp();
services integer;title_ text;effect_ text;
BEGIN
 PERFORM igr_private.rate_limit('terror_v694_order',coalesce(p_player_token::text,''),8,60);
 status_:=public.igr_v694_officer_state(p_code,p_player_token);
 IF coalesce((status_->>'ready')::boolean,false)=false
 THEN RAISE EXCEPTION 'outside military decision window';END IF;
 step_:=(status_->>'step')::integer;c:=lower(trim(coalesce(p_choice,'')));
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(status_->'choices') e WHERE e->>'id'=c)
 THEN RAISE EXCEPTION 'order unavailable';END IF;
 IF step_=1 THEN
  PERFORM public.igr_v688_terror_choose_operation(p_code,p_player_token,c);
  RETURN jsonb_build_object('ok',true,'step',1,'choice',c,'effect',
   'Ordre territorial annoncé. Le bilan du front sera calculé à la fin du cycle.');
 END IF;
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code))
  AND player_token=p_player_token AND public_role='officier_liaison';
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 s:=coalesce(r.state->'terror_v694','{}'::jsonb);
 IF coalesce((s->>'cycle')::integer,0)<>r.cycle
  OR coalesce((s->>'step')::integer,0)<>step_
  OR at_<(s->>'available_at')::timestamptz OR at_>=(s->>'deadline')::timestamptz
  OR r.status<>'playing' OR r.phase IN ('cycle_debrief','trame','locking','reveal')
 THEN RAISE EXCEPTION 'stale order';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
  AND a.player_id=p.id AND a.cycle=r.cycle AND a.action_type='terror_v694_decision'
  AND (a.payload->>'step')::integer=step_)
 THEN RAISE EXCEPTION 'already ordered';END IF;
 services:=coalesce((r.state#>>'{terror_v681,civilian_services}')::integer,0);
 IF step_=2 THEN
  IF c='abris' THEN services:=least(6,services+1);END IF;
  title_:=CASE c WHEN 'abris' THEN 'ABRIS CIVILS ACTIVÉS' ELSE 'RENFORTS DÉPLOYÉS' END;
  effect_:=CASE c WHEN 'abris' THEN
   'Des abris disposent de moyens supplémentaires. La réserve des unités avancées est diminuée.'
   ELSE 'Les positions avancées sont renforcées. Aucun moyen supplémentaire n est envoyé aux abris.' END;
 ELSE
  title_:=CASE c WHEN 'verification' THEN 'RENSEIGNEMENT MIS À L ÉPREUVE'
   ELSE 'ALERTE OPÉRATIONNELLE IMMÉDIATE' END;
  effect_:=CASE c WHEN 'verification' THEN
   'L état-major attend une synthèse recoupée avant de confirmer la manœuvre.'
   ELSE 'Un ordre rapide est transmis. Son efficacité dépend de la fiabilité du dossier.' END;
 END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'terror_v694_decision',
  jsonb_build_object('step',step_,'choice',c,'title',title_));
 s:=s||jsonb_build_object('step',step_+1,'decisions',
   coalesce(s->'decisions','{}'::jsonb)||jsonb_build_object(step_::text,c))
    ||igr_private.igr_v694_window(step_+1,at_);
 UPDATE public.igr_v4_rooms SET state=jsonb_set(
  jsonb_set(coalesce(state,'{}'::jsonb),'{terror_v694}',s,true),
  '{terror_v681,civilian_services}',to_jsonb(services),true),updated_at=now()
 WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'terror_v694_order','public',r.cycle,
  jsonb_build_object('title',title_,'text',effect_,'step',step_,
   'choice',c,'civilian_services',services,'effect','immediate'));
 RETURN jsonb_build_object('ok',true,'step',step_,'choice',c,
  'effect',effect_,'civilian_services',services);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v694_officer_decide(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v694_officer_decide(text,uuid,text) TO anon,authenticated;

DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v688_terror_choose_operation(text,uuid,text)'::regprocedure) INTO fn;
 IF position('v694 deadline guard' IN fn)=0 THEN
  IF position($a$ choice:=lower(trim(coalesce(p_choice,'')));$a$ IN fn)=0
  THEN RAISE EXCEPTION 'v688 operation anchor changed';END IF;
  fn:=replace(fn,$a$ choice:=lower(trim(coalesce(p_choice,'')));$a$,
  $b$ -- v694 deadline guard: legacy RPC cannot bypass stage 1.
 IF NOT coalesce((public.igr_v694_officer_state(p_code,p_player_token)->>'ready')::boolean,false)
   OR coalesce((public.igr_v694_officer_state(p_code,p_player_token)->>'step')::integer,0)<>1
 THEN RAISE EXCEPTION 'military order time expired';END IF;
 choice:=lower(trim(coalesce(p_choice,'')));$b$);
  EXECUTE fn;
 END IF;
END;$patch$;

DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO fn;
 IF position('v694 cumulative command' IN fn)=0 THEN
  IF position('pressure:=greatest(0,least(100,pressure+delta));' IN fn)=0
  THEN RAISE EXCEPTION 'terror pressure anchor changed';END IF;
  fn:=replace(fn,'pressure:=greatest(0,least(100,pressure+delta));',
  $b$-- v694 cumulative command impact from three independently sealed decisions.
   delta:=delta+CASE old.state#>>'{terror_v694,decisions,2}'
     WHEN 'abris' THEN 2 WHEN 'renforts' THEN -2 ELSE 0 END
     +CASE old.state#>>'{terror_v694,decisions,3}'
     WHEN 'verification' THEN CASE WHEN correct_count>=3 THEN -3 ELSE 2 END
     WHEN 'urgence' THEN CASE WHEN correct_count>=5 THEN -5 ELSE 6 END
     ELSE 0 END;
   pressure:=greatest(0,least(100,pressure+delta));$b$);
  EXECUTE fn;
 END IF;
END;$patch$;

-- Replace only obsolete copy. Actual backend protection/exploration limits stay unchanged.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v4_generic_role_card(text,text)'::regprocedure) INTO fn;
 fn:=replace(fn,
  'Tu peux maintenir au maximum 3 éléments sous protection. Tu peux convoquer chaque joueur libre une fois par cycle pendant 2 minutes.',
  'Trois points de protection maximum; certaines pièces coûtent deux points. Hors procédure officielle, échanges libres sans convocation chronométrée.');
 fn:=replace(fn,'Une action de terrain par cycle.',
  'Trois explorations maximum par cycle; chaque lieu ne peut être exploré qu une fois.');
 fn:=replace(fn,'Ton rôle possède deux décisions indépendantes : un ordre militaire public par cycle',
  'Ton rôle comporte trois ordres militaires successifs par cycle');
 fn:=replace(fn,'et, aux cycles 2 et 3, une seule intervention dans un interrogatoire ou une confrontation déjà ouvert.',
  'et une intervention indépendante par cycle à partir du deuxième dans une audition ou confrontation déjà ouverte.');
 EXECUTE fn;
END;$patch$;

-- Preserve the next-cycle requirement: the officer must approach a different suspect.
DO $patch$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v693_terror_officer_join(text,uuid,text,timestamptz)'::regprocedure) INTO fn;
 IF position('v694 new suspect per visit' IN fn)=0 THEN
  IF position(' visit:=jsonb_build_object(' IN fn)=0
  THEN RAISE EXCEPTION 'officer-visit anchor changed';END IF;
  fn:=replace(fn,' visit:=jsonb_build_object(',
  $b$  -- v694 new suspect per visit. No target can be repeated across cycles.
  IF r.cycle=3 AND EXISTS(
   SELECT 1 FROM public.igr_v4_actions older
   WHERE older.room_code=r.code AND older.player_id=p.id
     AND older.cycle=2 AND older.action_type='terror_v693_officer_join'
     AND EXISTS(
       SELECT 1 FROM jsonb_array_elements_text(coalesce(older.payload->'targets','[]'::jsonb)) old_target
       JOIN jsonb_array_elements_text(session_targets) new_target ON new_target.value=old_target.value))
  THEN RAISE EXCEPTION 'different suspect required for military visit';END IF;
  visit:=jsonb_build_object($b$);
  EXECUTE fn;
 END IF;
END;$patch$;
