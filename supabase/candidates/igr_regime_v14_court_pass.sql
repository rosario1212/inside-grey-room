-- LE RÉGIME v14 — opt-out of an automatically guaranteed defense turn.
-- Passing is never fabricated by the Judge; only the affected player can
-- submit it. The turn's time is fixed and the evidence remains intact.
CREATE OR REPLACE FUNCTION public.igr_regime_v14_pass_speech(
 p_code text,p_player_token uuid,p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 old igr_private.igr_regime_v13_ledger%rowtype;
 secs integer;slot_no integer;who text;elapsed integer;
 passes jsonb;result jsonb;state jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'suspect' OR p.internal_slot NOT IN (1,2,3)
 THEN RAISE EXCEPTION 'suspect identity required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.phase<>'regime_court' THEN RAISE EXCEPTION 'not in court';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128
 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF old.actor_player<>p.id OR old.action_kind<>'court_pass'
  THEN RAISE EXCEPTION 'request conflict';END IF;
  RETURN old.response;
 END IF;
 secs:=CASE WHEN (m.play_state->'court'->>'duration_minutes')::integer=14
 THEN 120 ELSE 60 END;
 elapsed:=floor(extract(epoch FROM now()-
  (m.play_state->'court'->>'started_at')::timestamptz))::integer;
 IF elapsed<60 OR elapsed>=60+3*secs THEN
  RAISE EXCEPTION 'no active defense statement window';END IF;
 slot_no:=(elapsed-60)/secs;
 who:=m.private_pack->'private_cards'->slot_no->>'actor_id';
 IF who IS DISTINCT FROM
    m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
 THEN RAISE EXCEPTION 'this is not your assigned statement slot';END IF;
 IF p.internal_slot IN (1,2) AND NOT (m.play_state->'arrests' ? who)
 THEN RAISE EXCEPTION 'a free fugitive cannot appear in court';END IF;
 passes:=coalesce(m.play_state->'court'->'passes','[]'::jsonb);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(passes) e
   WHERE e->>'actor_id'=who AND (e->>'slot')::integer=slot_no)
 THEN RAISE EXCEPTION 'statement already passed';END IF;
 passes:=passes||jsonb_build_array(jsonb_build_object(
   'actor_id',who,'player_id',p.id::text,'slot',slot_no,'at',now()));
 state:=jsonb_set(m.play_state,ARRAY['court','passes'],passes,true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=state WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'passed',true,'actor_id',who);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_pass',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v14_pass_speech(text,uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v14_pass_speech(text,uuid,text)
 TO anon,authenticated;
