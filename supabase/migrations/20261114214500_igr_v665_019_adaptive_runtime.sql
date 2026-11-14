
-- Private evidence selector for 019; only authenticated room participation can reveal a chosen item.
CREATE OR REPLACE FUNCTION igr_private.igr_v665_019_offered(p_room text,p_cycle integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE pack jsonb; focus_axis text:='chronologie';score_level text:='balanced';n int:=0;hits int:=0;out_ jsonb;
BEGIN
 IF p_cycle NOT BETWEEN 1 AND 3 THEN RETURN '[]'::jsonb; END IF;
 pack:=igr_private.igr_v571_019_pinned_pack(p_room);
 IF pack IS NULL THEN RETURN '[]'::jsonb; END IF;
 SELECT a.payload->>'axis' INTO focus_axis FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='debrief'
 AND a.payload->>'axis' IN ('chronologie','acces','mobile','materiel','responsabilite')
 ORDER BY a.id DESC LIMIT 1;
 focus_axis:=coalesce(focus_axis,'chronologie');
 SELECT count(*)::int,coalesce(sum(
  (CASE WHEN a.payload->>'killer'=pack#>>'{truth,reconstruction_019,killer}' THEN 1 ELSE 0 END)
  +(CASE WHEN a.payload->>'security_role'=pack#>>'{truth,reconstruction_019,security_role}' THEN 1 ELSE 0 END)
  +(CASE WHEN a.payload->>'cover'=pack#>>'{truth,reconstruction_019,cover}' THEN 1 ELSE 0 END)
 ),0)::int INTO n,hits FROM public.igr_v4_actions a
 WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle-1 AND a.action_type='hypothesis_019';
 IF n>0 THEN
  IF hits<n*1.4 THEN score_level:='clarity';
  ELSIF hits>=n*2.4 THEN score_level:='challenge';END IF;
 END IF;
 WITH options AS (
 SELECT e item,ord,
   (CASE WHEN coalesce((e->>'core')::boolean,false) THEN 30 ELSE 0 END)
  +(CASE WHEN e->>'axis'=focus_axis THEN 5 ELSE 0 END)
  +(CASE WHEN e->>'level'=score_level THEN 8 ELSE 0 END)
  +(CASE WHEN e->>'level'='balanced' THEN 2 ELSE 0 END) priority
 FROM jsonb_array_elements(coalesce(pack->'investigation_019','[]'::jsonb))
 WITH ORDINALITY t(e,ord)
 WHERE (e->>'cycle')::int=p_cycle
 AND NOT EXISTS (SELECT 1 FROM public.igr_v4_actions a
  WHERE a.room_code=upper(trim(p_room)) AND a.cycle=p_cycle
   AND a.action_type='investigation_019' AND a.payload->>'choice'=e->>'id')
 ), selected AS (SELECT item,ord,priority FROM options ORDER BY priority DESC,ord LIMIT 4)
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',item->>'id','title',item->>'title')
 ORDER BY priority DESC,ord),'[]'::jsonb) INTO out_ FROM selected;
 RETURN out_;
END $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v665_019_offered(text,integer) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v665_019_hypothesis_submit(
 p_code text,p_player_token uuid,p_killer text,p_security_role text,p_cover text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE actor public.igr_v4_players%rowtype;room_ public.igr_v4_rooms%rowtype;
BEGIN
 PERFORM igr_private.rate_limit('019_hypothesis',p_player_token::text,12,60);
 SELECT * INTO actor FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR actor.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO room_ FROM public.igr_v4_rooms WHERE code=actor.room_code FOR UPDATE;
 IF NOT FOUND OR room_.scenario_id<>'019' OR room_.status<>'playing'
 OR room_.cycle NOT BETWEEN 1 AND 2 OR room_.phase<>'cycle_debrief'
 THEN RAISE EXCEPTION 'wrong phase';END IF;
 IF p_killer NOT IN ('security','influencer','institutional','undetermined')
 OR p_security_role NOT IN ('actual_killer','scene_facilitator','misled_operator','undetermined')
 OR p_cover NOT IN ('postmortem_institutional','altered_security_log','fabricated_access_log','undetermined')
 THEN RAISE EXCEPTION 'invalid hypothesis';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=room_.code
 AND a.player_id=actor.id AND a.cycle=room_.cycle AND a.action_type='hypothesis_019')
 THEN RAISE EXCEPTION 'already submitted';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(room_.code,actor.id,room_.cycle,'hypothesis_019',
 jsonb_build_object('killer',p_killer,'security_role',p_security_role,'cover',p_cover));
 RETURN jsonb_build_object('ok',true);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v665_019_hypothesis_submit(text,uuid,text,text,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v665_019_hypothesis_submit(text,uuid,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v575_019_investigate(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE room_ public.igr_v4_rooms%rowtype;actor public.igr_v4_players%rowtype;pack jsonb;item jsonb;
BEGIN
 IF (igr_private.igr_v571_019_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '019 not published';END IF;
 PERFORM igr_private.rate_limit('019_investigation',p_player_token::text,18,60);
 SELECT * INTO actor FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR actor.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO room_ FROM public.igr_v4_rooms WHERE code=actor.room_code FOR UPDATE;
 IF NOT FOUND OR room_.scenario_id<>'019' OR room_.status<>'playing'
 THEN RAISE EXCEPTION 'not available';END IF;
 IF room_.cycle NOT BETWEEN 1 AND 3 OR NOT(room_.phase IN
 ('investigation_assembly','interrogation_select','interrogation','cycle_debrief') OR room_.phase LIKE 'annex_%')
 THEN RAISE EXCEPTION 'wrong phase'; END IF;
 IF (SELECT count(*) FROM public.igr_v4_actions a WHERE a.room_code=room_.code
  AND a.cycle=room_.cycle AND a.action_type='investigation_019')>=2
 THEN RAISE EXCEPTION 'two-choice cycle limit';END IF;
 pack:=igr_private.igr_v571_019_pinned_pack(room_.code);
 IF pack IS NULL THEN RAISE EXCEPTION 'sealed evidence missing';END IF;
 SELECT e INTO item FROM jsonb_array_elements(coalesce(pack->'investigation_019','[]'::jsonb)) AS t(e)
 WHERE e->>'id'=p_choice AND (e->>'cycle')::int=room_.cycle LIMIT 1;
 IF item IS NULL THEN RAISE EXCEPTION 'unknown lead';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(
  igr_private.igr_v665_019_offered(room_.code,room_.cycle)) AS t(e) WHERE e->>'id'=p_choice)
 THEN RAISE EXCEPTION 'lead not offered';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(room_.code,actor.id,room_.cycle,'investigation_019',
 jsonb_build_object('choice',p_choice,'title',item->>'title'));
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 VALUES(room_.code,'investigation_019','roles',ARRAY['enqueteur','analyste']::text[],room_.cycle,
 jsonb_build_object('choice',p_choice,'title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 RETURN jsonb_build_object('ok',true,'cycle',room_.cycle);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v575_019_investigate(text,uuid,text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v665_019_investigate_choice(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN RETURN public.igr_v575_019_investigate(p_code,p_player_token,p_choice);END $function$;
REVOKE ALL ON FUNCTION public.igr_v665_019_investigate_choice(text,uuid,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v665_019_investigate_choice(text,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v576_019_investigate_index(p_code text,p_player_token uuid,p_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE room_ public.igr_v4_rooms%rowtype;offer jsonb;choice text;
BEGIN
 IF p_index NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'invalid index';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.igr_v4_players p
  WHERE p.room_code=upper(trim(p_code)) AND p.player_token=p_player_token
   AND p.public_role IN ('enqueteur','analyste')) THEN RAISE EXCEPTION 'forbidden';END IF;
 SELECT * INTO room_ FROM public.igr_v4_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND OR room_.scenario_id<>'019' THEN RAISE EXCEPTION 'not available';END IF;
 offer:=igr_private.igr_v665_019_offered(room_.code,room_.cycle);
 SELECT e->>'id' INTO choice FROM jsonb_array_elements(offer) WITH ORDINALITY t(e,ord)
 WHERE ord=p_index LIMIT 1;
 IF choice IS NULL THEN RAISE EXCEPTION 'no choice';END IF;
 RETURN public.igr_v575_019_investigate(p_code,p_player_token,choice);
END $function$;
REVOKE ALL ON FUNCTION public.igr_v576_019_investigate_index(text,uuid,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v576_019_investigate_index(text,uuid,integer) TO anon,authenticated;
