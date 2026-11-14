
-- 020 v675: adaptive choices depend on sealed hypotheses, but cannot change the six mandatory proofs.
CREATE OR REPLACE FUNCTION igr_private.igr_v675_020_offered(p_room text,p_cycle integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE pack jsonb;focus_axis text:='chronologie';difficulty text:='balanced';respondents int:=0;hits int:=0;offers jsonb:='[]'::jsonb;
BEGIN
 IF p_cycle NOT BETWEEN 1 AND 3 THEN RETURN '[]'::jsonb;END IF;
 pack:=igr_private.igr_v601_020_pinned_pack(p_room);
 IF pack IS NULL THEN RETURN '[]'::jsonb;END IF;
 SELECT a.payload->>'axis' INTO focus_axis
 FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='debrief'
 AND a.payload->>'axis' IN ('chronologie','acces','mobile','materiel','responsabilite')
 ORDER BY a.id DESC LIMIT 1;
 focus_axis:=coalesce(focus_axis,'chronologie');
 SELECT count(*)::int,coalesce(sum(
 (CASE WHEN a.payload->>'ignition'=pack#>>'{truth,reconstruction_020,ignition}' THEN 1 ELSE 0 END)+
 (CASE WHEN a.payload->>'exits'=pack#>>'{truth,reconstruction_020,exits}' THEN 1 ELSE 0 END)+
 (CASE WHEN a.payload->>'maintenance'=pack#>>'{truth,reconstruction_020,maintenance}' THEN 1 ELSE 0 END)+
 (CASE WHEN a.payload->>'evacuation'=pack#>>'{truth,reconstruction_020,evacuation}' THEN 1 ELSE 0 END)
 ),0)::int INTO respondents,hits
 FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='hypothesis_020';
 IF respondents>0 THEN
   IF hits<respondents*2 THEN difficulty:='clarity';
   ELSIF hits>=respondents*3.2 THEN difficulty:='challenge';
   END IF;
 END IF;
 WITH options AS (
  SELECT e AS item,ord,
  (CASE WHEN coalesce((e->>'core')::boolean,false) THEN 28 ELSE 0 END)+
  (CASE WHEN e->>'axis'=focus_axis THEN 6 ELSE 0 END)+
  (CASE WHEN e->>'level'=difficulty THEN 10 ELSE 0 END)+
  (CASE WHEN e->>'level'='balanced' THEN 2 ELSE 0 END) priority
  FROM jsonb_array_elements(coalesce(pack->'investigation_020','[]'::jsonb))
  WITH ORDINALITY t(e,ord)
  WHERE (e->>'cycle')::int=p_cycle AND NOT EXISTS (
   SELECT 1 FROM public.igr_v4_actions a
   WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle
    AND a.action_type='investigation_020' AND a.payload->>'choice'=e->>'id')
 ), chosen AS (
   SELECT item,priority,ord FROM options ORDER BY priority DESC,ord LIMIT 4
 )
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',item->>'id','title',item->>'title')
  ORDER BY priority DESC,ord),'[]'::jsonb) INTO offers FROM chosen;
 RETURN offers;
END $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v675_020_offered(text,integer) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v675_020_hypothesis_submit(
 p_code text,p_player_token uuid,p_ignition text,p_exits text,p_maintenance text,p_evacuation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE actor public.igr_v4_players%rowtype;room_ public.igr_v4_rooms%rowtype;
BEGIN
 PERFORM igr_private.rate_limit('020_hypothesis',p_player_token::text,12,60);
 SELECT * INTO actor FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR actor.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO room_ FROM public.igr_v4_rooms WHERE code=actor.room_code FOR UPDATE;
 IF NOT FOUND OR room_.scenario_id<>'020' OR room_.status<>'playing'
 OR room_.cycle NOT BETWEEN 1 AND 2 OR room_.phase<>'cycle_debrief'
 THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF coalesce(p_ignition,'') NOT IN ('undetermined','intentional_diversion','accidental_equipment_fault','authorized_stage_effect')
 OR coalesce(p_exits,'') NOT IN ('undetermined','known_restrictions','final_check_waived','restrictions_kept_after_warnings')
 OR coalesce(p_maintenance,'') NOT IN ('undetermined','known_repairs_deferred','overoptimistic_signoff')
 OR coalesce(p_evacuation,'') NOT IN ('undetermined','risk_underestimated','false_assurance_delay','deliberate_delay')
 THEN RAISE EXCEPTION 'invalid 020 hypothesis';END IF;
 IF EXISTS (SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=room_.code
  AND a.player_id=actor.id AND a.cycle=room_.cycle AND a.action_type='hypothesis_020')
 THEN RAISE EXCEPTION 'hypotheses already sealed';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(room_.code,actor.id,room_.cycle,'hypothesis_020',
 jsonb_build_object('ignition',p_ignition,'exits',p_exits,'maintenance',p_maintenance,'evacuation',p_evacuation));
 RETURN jsonb_build_object('ok',true,'cycle',room_.cycle);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v675_020_hypothesis_submit(text,uuid,text,text,text,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v675_020_hypothesis_submit(text,uuid,text,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v605_020_investigate(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;
BEGIN
 IF (igr_private.igr_v601_020_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '020 not released';END IF;
 PERFORM igr_private.rate_limit('020_investigation',p_player_token::text,18,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id<>'020' OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'not available';END IF;
 IF NOT (r.phase IN ('investigation_assembly','interrogation_select','interrogation','cycle_debrief') OR r.phase LIKE 'annex_%')
 THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF (SELECT count(*) FROM public.igr_v4_actions a WHERE a.room_code=r.code AND a.cycle=r.cycle
  AND a.action_type='investigation_020')>=2 THEN RAISE EXCEPTION 'two-choice cycle limit';END IF;
 pack:=igr_private.igr_v601_020_pinned_pack(r.code);
 IF pack IS NULL THEN RAISE EXCEPTION 'private snapshot missing';END IF;
 SELECT e INTO item FROM jsonb_array_elements(coalesce(pack->'investigation_020','[]'::jsonb)) t(e)
 WHERE e->>'id'=p_choice AND (e->>'cycle')::int=r.cycle LIMIT 1;
 IF item IS NULL THEN RAISE EXCEPTION 'invalid lead';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(igr_private.igr_v675_020_offered(r.code,r.cycle)) t(e)
 WHERE e->>'id'=p_choice) THEN RAISE EXCEPTION 'lead not offered';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'investigation_020',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 VALUES(r.code,'investigation_020','roles',ARRAY['enqueteur','analyste']::text[],r.cycle,
 jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v605_020_investigate(text,uuid,text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v675_020_investigate_choice(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN RETURN public.igr_v605_020_investigate(p_code,p_player_token,p_choice);END $function$;
REVOKE ALL ON FUNCTION public.igr_v675_020_investigate_choice(text,uuid,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v675_020_investigate_choice(text,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v606_020_investigate_index(p_code text,p_player_token uuid,p_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;offers jsonb;choice text;
BEGIN
 IF p_index NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'invalid index';END IF;
 IF NOT EXISTS (SELECT 1 FROM public.igr_v4_players p WHERE p.room_code=upper(trim(p_code))
  AND p.player_token=p_player_token AND p.public_role IN ('enqueteur','analyste'))
 THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND OR r.scenario_id<>'020' THEN RAISE EXCEPTION 'not available';END IF;
 offers:=igr_private.igr_v675_020_offered(r.code,r.cycle);
 SELECT e->>'id' INTO choice FROM jsonb_array_elements(offers) WITH ORDINALITY t(e,ord)
 WHERE ord=p_index LIMIT 1;
 IF choice IS NULL THEN RAISE EXCEPTION 'no choice';END IF;
 RETURN public.igr_v605_020_investigate(p_code,p_player_token,choice);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v606_020_investigate_index(text,uuid,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v606_020_investigate_index(text,uuid,integer) TO anon,authenticated;
