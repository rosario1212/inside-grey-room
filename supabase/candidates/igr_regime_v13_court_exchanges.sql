-- LE RÉGIME — v13 theatrical contradiction under Juge.
-- Trusted server controls 5-min confrontation stage, avoids unbounded chat
-- and does not let a procedural ruling change historical truths.

CREATE OR REPLACE FUNCTION public.igr_regime_v13_court_exchange(
 p_code text,p_player_token uuid,p_request_id text,
 p_kind text,p_message text,p_reply_to text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;
 p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 prior igr_private.igr_regime_v13_ledger%rowtype;
 elapsed integer;confront_start integer;confront_end integer;
 actor text;chosen jsonb;exchanges jsonb;response jsonb;
 n integer;referred jsonb;record jsonb;published jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'courtroom unavailable';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128 THEN
 RAISE EXCEPTION 'invalid request id';END IF;
 SELECT * INTO prior FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF prior.actor_player<>p.id OR prior.action_kind<>'court_exchange'
   THEN RAISE EXCEPTION 'request collision';END IF;
  RETURN prior.response;
 END IF;
 IF r.status<>'playing' OR r.phase<>'regime_court' THEN RAISE EXCEPTION 'courtroom closed';END IF;
 elapsed:=floor(extract(epoch FROM
   now()-(m.play_state->'court'->>'started_at')::timestamptz))::integer;
 confront_start:=CASE WHEN
   (m.play_state->'court'->>'duration_minutes')::int=14 THEN 420 ELSE 240 END;
 confront_end:=CASE WHEN
   (m.play_state->'court'->>'duration_minutes')::int=14 THEN 720 ELSE 360 END;
 IF elapsed<confront_start OR elapsed>=confront_end THEN
   RAISE EXCEPTION 'confrontation window is not active';END IF;
 IF p_kind NOT IN ('question','objection','reply','ruling') THEN
   RAISE EXCEPTION 'unsupported court intervention';END IF;
 actor:=CASE WHEN p.public_role='suspect'
 THEN m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
 ELSE NULL END;
 IF p.public_role='suspect' AND p.internal_slot IN (1,2)
   AND NOT m.play_state->'arrests' ? actor
 THEN RAISE EXCEPTION 'fugitive not present at court';END IF;
 IF p_kind='ruling' THEN
  IF p.public_role<>'juge' OR p_message NOT IN ('sustained','overruled')
   OR coalesce(length(p_reply_to),0)<8 THEN
    RAISE EXCEPTION 'invalid judicial ruling';END IF;
 ELSIF p_kind='question' THEN
  IF p.public_role NOT IN ('enqueteur','analyste','procureur')
   THEN RAISE EXCEPTION 'question reserved for accusation';END IF;
 ELSIF p_kind='reply' THEN
  IF p.public_role<>'suspect' THEN RAISE EXCEPTION 'reply reserved for suspects';END IF;
 ELSE
  IF p.public_role NOT IN ('enqueteur','analyste','procureur','suspect')
   THEN RAISE EXCEPTION 'objection unavailable';END IF;
 END IF;
 IF p_kind<>'ruling' AND (length(btrim(coalesce(p_message,'')))<6
  OR length(p_message)>280) THEN RAISE EXCEPTION 'text must be 6 to 280 characters';END IF;
 exchanges:=coalesce(m.play_state->'court'->'exchanges','[]'::jsonb);
 SELECT count(*) INTO n FROM jsonb_array_elements(exchanges) e
 WHERE e->>'player_id'=p.id::text AND e->>'kind'<>'ruling';
 IF n>=5 AND p_kind<>'ruling' THEN RAISE EXCEPTION 'confrontation intervention quota exhausted';END IF;
 IF p_kind='ruling' THEN
  SELECT value INTO referred FROM jsonb_array_elements(exchanges) value
  WHERE value->>'id'=p_reply_to AND value->>'kind'='objection';
  IF NOT FOUND THEN RAISE EXCEPTION 'objection not found';END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(exchanges) e
   WHERE e->>'kind'='ruling' AND e->>'reply_to'=p_reply_to)
  THEN RAISE EXCEPTION 'objection already resolved';END IF;
 END IF;
 record:=jsonb_build_object('id',p_request_id,'kind',p_kind,
 'text',CASE WHEN p_kind='ruling' THEN
  CASE WHEN p_message='sustained' THEN 'Objection accueillie' ELSE 'Objection rejetée' END
  ELSE btrim(p_message) END,
 'player_id',p.id::text,'pseudo',p.pseudo,
 'role',p.public_role,'actor_id',actor,'reply_to',p_reply_to,
 'at',now());
 exchanges:=exchanges||jsonb_build_array(record);
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(m.play_state,ARRAY['court','exchanges'],exchanges,true)
 WHERE room_code=m.room_code;
 response:=jsonb_build_object('ok',true,'accepted',true,'id',p_request_id,'type',p_kind);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_exchange',r.cycle,response);
 RETURN response;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_court_exchange(
 text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_court_exchange(
 text,uuid,text,text,text,text) TO anon,authenticated;
