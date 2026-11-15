BEGIN;


CREATE TABLE IF NOT EXISTS igr_private.igr_v693_officer_access_backup(
 signature text PRIMARY KEY,definition text NOT NULL,created_at timestamptz DEFAULT now());
ALTER TABLE igr_private.igr_v693_officer_access_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v693_officer_access_backup FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_v693_officer_access_backup(signature,definition)
 SELECT sig,pg_get_functiondef(sig::regprocedure)
 FROM (VALUES
  ('public.igr_v4_signal_send(text,uuid,uuid,text,jsonb)'),
  ('public.igr_v4_generic_role_card(text,text)')
 ) q(sig) ON CONFLICT(signature) DO NOTHING;


CREATE OR REPLACE FUNCTION public.igr_v693_terror_officer_join(
 p_code text,p_player_token uuid,p_focus text,p_phase_started_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 focus_ text;session_type text;question_text text;session_targets jsonb;
 parts jsonb;visit jsonb;who text;
BEGIN
 PERFORM igr_private.rate_limit('terror_693_officer_join',coalesce(p_player_token::text,''),8,60);
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code))
  AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN
  RAISE EXCEPTION 'only the military officer can join';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing'
  OR r.scenario_id NOT IN ('026','027','028') OR r.cycle NOT IN (2,3)
  OR r.phase NOT IN ('interrogation','event_confrontation')
  OR r.phase_started_at IS DISTINCT FROM p_phase_started_at
  OR r.phase_ends_at IS NULL OR r.phase_ends_at<=clock_timestamp()
 THEN RAISE EXCEPTION 'no eligible live hearing';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
  AND a.player_id=p.id AND a.cycle=r.cycle AND a.action_type='terror_v693_officer_join')
 THEN RAISE EXCEPTION 'one officer intervention per cycle';END IF;
 focus_:=lower(trim(coalesce(p_focus,'')));
 IF focus_ NOT IN ('source','civils','acces') THEN RAISE EXCEPTION 'invalid interview focus';END IF;
 session_type:=CASE WHEN r.phase='interrogation' THEN 'interrogation' ELSE 'confrontation' END;
 IF session_type='interrogation' THEN
  IF nullif(r.state->>'current_target','') IS NULL THEN RAISE EXCEPTION 'missing suspect';END IF;
  SELECT jsonb_build_array(t.id::text) INTO session_targets
   FROM public.igr_v4_players t WHERE t.room_code=r.code
    AND t.id=(r.state->>'current_target')::uuid AND t.public_role='suspect';
  IF session_targets IS NULL THEN RAISE EXCEPTION 'interrogation without valid suspect';END IF;
 ELSE
  IF r.state->>'event_active'<>'confrontation' OR
   jsonb_array_length(coalesce(r.state->'event_targets','[]'::jsonb))<>2
  THEN RAISE EXCEPTION 'confrontation not active';END IF;
  session_targets:=r.state->'event_targets';
 END IF;
 question_text:=CASE focus_
  WHEN 'source' THEN 'Que pouvez-vous confirmer personnellement, et avec quelle pièce datée indépendante du FDR ?'
  WHEN 'civils' THEN 'Quels civils ou détenus pourraient être exposés, et quelle information ne pouvez-vous pas vérifier ?'
  ELSE 'Cette autorisation ou ce contact est-il encore valable, et comment vérifier sa date ?' END;
 visit:=jsonb_build_object(
  'cycle',r.cycle,'visitor_id',p.id::text,'session_type',session_type,
  'session_started_at',r.phase_started_at::text,'focus',focus_,
  'question',question_text,'targets',session_targets);
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'terror_v693_officer_join',visit);
 -- A confrontation already has a participant roster; add the officer
 -- without removing official participants or their protected roles.
 IF session_type='confrontation' THEN
  parts:=coalesce(r.state->'event_participants',session_targets);
  IF NOT parts ? p.id::text THEN parts:=parts||to_jsonb(p.id::text); END IF;
  UPDATE public.igr_v4_rooms SET state=jsonb_set(
   jsonb_set(state,'{event_participants}',parts,true),
   '{terror_v693_officer_visit}',visit,true),updated_at=now()
  WHERE code=r.code;
 ELSE
  UPDATE public.igr_v4_rooms SET state=jsonb_set(
   state,'{terror_v693_officer_visit}',visit,true),updated_at=now()
  WHERE code=r.code;
 END IF;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'terror_v693_officer_visit','public',r.cycle,
  jsonb_build_object('title','L ÉTAT-MAJOR REJOINT LA SÉANCE',
  'text',p.pseudo||' intervient dans cette '||session_type||'. '||question_text,
  'question',question_text,'kind',session_type,'focus',focus_,
  'officer_id',p.id::text,'no_automatic_evidence',true));
 RETURN jsonb_build_object('ok',true,'joined',true,'cycle',r.cycle,
  'kind',session_type,'question',question_text,'targets',session_targets,
  'remaining_visits',0,'remaining_military_orders','independent');
END; $body$;
REVOKE ALL ON FUNCTION public.igr_v693_terror_officer_join(text,uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v693_terror_officer_join(text,uuid,text,timestamptz) TO anon,authenticated;


CREATE OR REPLACE FUNCTION public.igr_v4_signal_send(p_code text, p_player_token uuid, p_to uuid, p_type text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.igr_v4_players%rowtype;
  t public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  allowed boolean;
  eligible text[]:=array['analyste','procureur','juge','inspecteur','officier_liaison'];
  cut_until timestamptz;
  session_id text;
begin
  perform igr_private.rate_limit('signal_send',p_player_token::text,90,60);

  if octet_length(coalesce(p_payload,'{}'::jsonb)::text)>131072 then
    raise exception 'signal too large';
  end if;

  select * into p from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into t from public.igr_v4_players
  where id=p_to and room_code=p.room_code;
  if not found or t.id=p.id then raise exception 'invalid target'; end if;
  if igr_private.is_blocked(p.room_code,p.id,t.id) then raise exception 'blocked'; end if;

  select * into r from public.igr_v4_rooms where code=p.room_code;
  if r.status<>'playing' or r.phase<>'interrogation' then
    raise exception 'video only during interrogation';
  end if;

  allowed:=(p.public_role='enqueteur' and t.public_role=any(eligible))
        or (t.public_role='enqueteur' and p.public_role=any(eligible));
  if not allowed then raise exception 'forbidden'; end if;
  -- The officer may see the live interrogation feed ONLY after actually
  -- using the one-per-cycle visit for this exact current session.
  if p.public_role='officier_liaison' or t.public_role='officier_liaison' then
    if r.scenario_id not in ('026','027','028') or r.cycle<2
     or not exists(
       select 1 from public.igr_v4_actions a
       where a.room_code=r.code and a.cycle=r.cycle
        and a.action_type='terror_v693_officer_join'
        and a.player_id=case when p.public_role='officier_liaison' then p.id else t.id end
        and a.payload->>'session_type'='interrogation'
        and a.payload->>'session_started_at'=r.phase_started_at::text
     )
    then raise exception 'officer did not join this interrogation';end if;
  end if;

  if coalesce((r.state->>'video_active')::boolean,false)=false then
    raise exception 'video inactive';
  end if;

  begin
    cut_until:=nullif(r.state->>'video_cut_until','')::timestamptz;
  exception when others then
    cut_until:=null;
  end;
  if cut_until is not null and cut_until>now() then raise exception 'video cut'; end if;

  session_id:=nullif(r.state->>'video_session','');
  if session_id is null or coalesce(p_payload->>'session','')<>session_id then
    raise exception 'stale video session';
  end if;

  if p_type not in ('viewer_ready','offer','answer','ice','hangup') then
    raise exception 'invalid signal';
  end if;

  insert into public.igr_v4_signals(room_code,from_player_id,to_player_id,signal_type,payload)
  values(p.room_code,p.id,t.id,p_type,p_payload);

  return jsonb_build_object('ok',true);
end
$function$
;

CREATE OR REPLACE FUNCTION public.igr_v4_generic_role_card(p_role text, p_context text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
begin case p_role when 'enqueteur' then return jsonb_build_object('place','Tu diriges l’enquête.','chronology',p_context,'hide','Tu ne caches aucun fait du dossier.','anchors','Croise les horaires, les accès, les objets et les contradictions. Le stress n’est pas une preuve.','position','Tu mènes les interrogatoires et portes la reconstruction factuelle finale.'); when 'analyste' then return jsonb_build_object('place','Tu observes les interrogatoires et aides l’Enquêteur.','chronology',p_context,'hide','Tes notes restent privées jusqu’aux échanges avec l’Enquêteur.','anchors','Repère les contradictions et les changements de version. Une impression n’est pas une preuve.','position','Tu aides à reconstruire les faits et participes à la délibération finale avec le Juge.'); when 'procureur' then return jsonb_build_object('place','Tu portes l’accusation.','chronology',p_context,'hide','Tes priorités d’entretien restent stratégiques.','anchors','Tu peux saisir le Juge et participes à sa délibération finale.','position','Accuse uniquement ce que les faits permettent de soutenir.'); when 'juge' then return jsonb_build_object('place','Tu arbitres l’accès aux éléments protégés et rends la décision officielle.','chronology',p_context,'hide','Ton statut d’intégrité et tes éventuels objectifs restent strictement privés.','anchors','Tu peux maintenir au maximum 3 éléments sous protection. Tu peux convoquer chaque joueur libre une fois par cycle pendant 2 minutes.','position','Tu n’enquêtes pas. À la fin, tu délibères obligatoirement avec le camp d’enquête puis tu tranches la responsabilité de chacun.'); when 'journaliste' then return jsonb_build_object('place','Tu enquêtes en dehors de tous les camps.','chronology',p_context,'hide','Tes sources et ton angle restent à toi.','anchors','Tu peux saisir le Juge pour un accès, une publication ou la protection d’une source.','position','Tu peux mettre la pression. Une publication n’est pas un verdict.'); when 'inspecteur' then return jsonb_build_object('place','Tu travailles sur le terrain.','chronology',p_context,'hide','Tes priorités de recherche restent privées jusqu’au résultat.','anchors','Une action de terrain par cycle.','position','Tu choisis où chercher. L’Expert dit ce que les traces prouvent.'); when 'officier_liaison' then return jsonb_build_object('place','Tu représentes l’état-major des forces armées d’Almizia à la Grey Room dans la dernière capitale libre.','chronology',p_context,'hide','Tu ne connais pas la vérité judiciaire ni les plans de toutes les factions du FDR.','anchors','Ton rôle possède deux décisions indépendantes : un ordre militaire public par cycle (tenir, protéger ou reconquérir si les informations le permettent) et, aux cycles 2 et 3, une seule intervention dans un interrogatoire ou une confrontation déjà ouvert. Choisis une question sur la source, les civils ou les accès. Tu ne prends pas la direction de l audition et tu ne peux pas changer le verdict.','position','Tu représentes l état-major des forces armées d Almizia et prends un ordre militaire par cycle. Ta présence à une audition donne un poids politique et humain aux informations, mais ne génère aucun renseignement secret automatique. Protéger les civils conserve davantage de services tout en risquant du territoire; tenir limite les pertes; reconquérir exige au moins 5 sur 6 réponses correctes au cycle précédent. Si la Grey Room tombe, tu subis la défaite collective.'); when 'expert' then return jsonb_build_object('place','Tu es l’Expert / médecin légiste.','chronology',p_context,'hide','Tes priorités d’analyse restent privées.','anchors','Une analyse complémentaire par cycle.','position','Tu établis un fait technique. Tu ne désignes jamais un coupable.'); when 'temoin' then return jsonb_build_object('place','Tu es témoin dans le dossier.','chronology',p_context,'hide','Tu peux garder un élément personnel pour toi tant que tu ne changes pas les faits.','anchors','La fenêtre témoins est commune.','position','Réponds uniquement avec ce que tu sais réellement.'); when 'maitre' then return jsonb_build_object('place','Tu es l’Avocat.','chronology',p_context,'hide','Tu ne connais pas automatiquement les secrets des suspects.','anchors','Tu peux accepter un seul client officiel. Les autres suspects non représentés disposent chacun d’une unique consultation de 1 minute, seulement pendant leur propre interrogatoire.','position','Défends la frontière exacte de la responsabilité de ton client, sans inventer de fait ni de preuve.'); else return jsonb_build_object('place',p_role,'chronology',p_context,'hide','','anchors','','position',''); end case; end $function$
;


DO $audit$
DECLARE fn text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v693_terror_officer_join(text,uuid,text,timestamptz)'::regprocedure) INTO fn;
 IF position('one officer intervention per cycle' in fn)=0
 OR position('event_confrontation' in fn)=0
 OR position('p_phase_started_at' in fn)=0 THEN
  RAISE EXCEPTION 'session-scoped officer privilege missing';END IF;
 SELECT pg_get_functiondef('public.igr_v4_signal_send(text,uuid,uuid,text,jsonb)'::regprocedure) INTO fn;
 IF position('officer did not join this interrogation' in fn)=0 THEN
  RAISE EXCEPTION 'officer video not session gated';END IF;
 IF has_table_privilege('anon','igr_private.igr_v693_officer_access_backup','SELECT') THEN
  RAISE EXCEPTION 'private backup exposed';END IF;
END; $audit$;

COMMIT;