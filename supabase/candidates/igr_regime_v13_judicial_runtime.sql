-- LE RÉGIME v13 - transaction-safe warrant, court and reconstruction
-- DEPENDS ON: supabase/candidates/igr_regime_v13_private_runtime.sql
-- STAGED CANDIDATE ONLY, gated by absent v13_room snapshots until release.

CREATE OR REPLACE FUNCTION public.igr_regime_v13_warrant(
 p_code text,p_player_token uuid,p_request_id text,p_target_id text,
 p_track_choice text,p_evidence_ids jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 e jsonb; evidence jsonb; origins text[]:=ARRAY[]::text[];
 eid text; ids text[]:=ARRAY[]::text[];
 old igr_private.igr_regime_v13_ledger%rowtype;
 warrants jsonb; result jsonb; target1 text;target2 text;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'enqueteur' THEN RAISE EXCEPTION 'not authorized to request warrants';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3 OR
 r.phase IN ('closed','final_audience','final_suspect_defenses','locking','regime_court')
 THEN RAISE EXCEPTION 'warrants unavailable';END IF;
 IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF old.actor_player<>p.id OR old.action_kind<>'mandate' THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old.response;
 END IF;
 target1:=m.private_pack->'private_cards'->0->>'actor_id';
 target2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_target_id NOT IN (target1,target2) THEN RAISE EXCEPTION 'unknown fugitive';END IF;
 IF m.play_state->'arrests' ? p_target_id THEN RAISE EXCEPTION 'fugitive already captured';END IF;
 IF p_track_choice NOT IN ('together','apart') THEN RAISE EXCEPTION 'invalid trace hypothesis';END IF;
 IF jsonb_typeof(p_evidence_ids)<>'array' OR jsonb_array_length(p_evidence_ids)<>2
 THEN RAISE EXCEPTION 'two independent pieces required';END IF;
 SELECT ARRAY(SELECT jsonb_array_elements_text(p_evidence_ids)) INTO ids;
 IF ids[1]=ids[2] THEN RAISE EXCEPTION 'two distinct pieces required';END IF;
 FOREACH eid IN ARRAY ids LOOP
   SELECT value INTO e FROM jsonb_array_elements(m.private_pack->'capture_evidence') value
   WHERE value->>'id'=eid AND value->>'targetId'=p_target_id
     AND (value->>'cycle')::integer<=r.cycle LIMIT 1;
   IF NOT FOUND OR NOT ((e->>'revealed_at'='cycle_start') OR
       (coalesce(m.play_state->'disclosed','[]'::jsonb) ? eid)
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(
         coalesce(m.play_state->'scheduled_disclosures','[]'::jsonb)) x
         WHERE x->>'id'=eid AND (x->>'cycle')::integer<=r.cycle)) THEN
     RAISE EXCEPTION 'unpublished or unrelated capture evidence';END IF;
   origins:=origins||ARRAY[e->>'origin'];
 END LOOP;
 IF origins[1] IS NULL OR origins[1]=origins[2] THEN RAISE EXCEPTION 'dependent sources';END IF;
 warrants:=coalesce(m.play_state->'mandates','[]'::jsonb);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(warrants) j
   WHERE j->>'target_id'=p_target_id AND (j->>'cycle')::integer=r.cycle)
 THEN RAISE EXCEPTION 'one warrant per fugitive per cycle'; END IF;
 warrants:=warrants||jsonb_build_array(
   jsonb_build_object('id',p_request_id,'cycle',r.cycle,
      'target_id',p_target_id,'track_choice',p_track_choice,
      'evidence_ids',p_evidence_ids,'status','awaiting_judge','requested_at',now()));
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(m.play_state,'{mandates}',warrants,true) WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'status','awaiting_judge','mandate_id',p_request_id);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'mandate',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_warrant(text,uuid,text,text,text,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_warrant(text,uuid,text,text,text,jsonb)
 TO anon,authenticated;

-- Judge can accept or lodge a bounded objection. Once a request has two
-- independent disclosed documents, the server applies a neutral evidentiary
-- check; no judge can change the sealed track or arbitrarily veto a capture.
-- Investigation roles can trigger recovery after 90 seconds of judge absence.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_judge_review(
 p_code text,p_player_token uuid,p_request_id text,p_mandate_id text,p_decision text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 old igr_private.igr_regime_v13_ledger%rowtype;
 warrants jsonb;w jsonb;idx integer:=0;i integer;
 party text;actual text;target text;outcome text;reviewed text;
 state jsonb;event jsonb;result jsonb;start_at timestamptz;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' THEN RAISE EXCEPTION 'regime feature unavailable'; END IF;
 IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF old.actor_player<>p.id OR old.action_kind<>'judge_review' THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old.response;
 END IF;
 warrants:=coalesce(m.play_state->'mandates','[]'::jsonb);
 FOR i IN 0..jsonb_array_length(warrants)-1 LOOP
  IF warrants->i->>'id'=p_mandate_id THEN w:=warrants->i;idx:=i;EXIT;END IF;
 END LOOP;
 IF w IS NULL OR w->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'no pending warrant'; END IF;
 start_at:=(w->>'requested_at')::timestamptz;
 IF p.public_role='juge' THEN
  IF p_decision NOT IN ('allow','contest') THEN RAISE EXCEPTION 'judge decision invalid';END IF;
  reviewed:=p_decision;
 ELSIF p.public_role IN ('enqueteur','analyste') AND now()>=start_at+interval '90 seconds' THEN
  reviewed:='automatic_fallback';
 ELSE RAISE EXCEPTION 'judge review not permitted or too early'; END IF;
 target:=w->>'target_id';
 party:=CASE WHEN coalesce(m.play_state->'alliance'->>
   (m.private_pack->'private_cards'->0->>'actor_id'),'apart')='together'
  AND coalesce(m.play_state->'alliance'->>
   (m.private_pack->'private_cards'->1->>'actor_id'),'apart')='together'
 THEN 'together' ELSE 'apart' END;
 actual:=party;
 outcome:=CASE WHEN w->>'track_choice'=actual THEN 'captured' ELSE 'not_found' END;
 IF m.play_state->'arrests' ? target THEN outcome:='already_captured';END IF;
 w:=jsonb_set(w,'{status}',to_jsonb(outcome),true);
 w:=jsonb_set(w,'{judge_review}',to_jsonb(reviewed),true);
 warrants:=jsonb_set(warrants,ARRAY[idx::text],w,true);
 state:=jsonb_set(m.play_state,'{mandates}',warrants,true);
 IF outcome='captured' THEN
   state:=jsonb_set(state,ARRAY['arrests',target],jsonb_build_object('cycle',r.cycle,'mandate',p_mandate_id),true);
   event:=jsonb_build_object('type','capture_confirmed','target_id',target,'cycle',r.cycle,'id','capture:'||p_mandate_id);
   state:=jsonb_set(state,'{events}',coalesce(state->'events','[]'::jsonb)||jsonb_build_array(event),true);
   IF m.scenario_id='034' AND target='fallen_president' THEN
     event:=jsonb_build_object('type','public_bulletin','id','bulletin:'||p_mandate_id,
       'title','LE PRÉSIDENT DÉCHU CAPTURÉ',
       'text','À Darsen, des habitants célèbrent la nouvelle. Les familles des disparus exigent un procès et la publication des archives; des fidèles du régime contestent l arrestation. La culpabilité individuelle reste à établir.');
     state:=jsonb_set(state,'{events}',coalesce(state->'events','[]'::jsonb)||jsonb_build_array(event),true);
   END IF;
 END IF;
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=state WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'status',outcome,'target_id',target,'judge_review',reviewed);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'judge_review',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_judge_review(text,uuid,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_judge_review(text,uuid,text,text,text)
 TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_begin_court(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;m igr_private.igr_regime_v13_rooms%rowtype;
 t1 text;t2 text;c1 integer;c2 integer;minutes integer;
 st jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle<>3 OR r.phase<>'closed' THEN RETURN false;END IF;
 IF m.play_state->'court' ? 'started' THEN RETURN false;END IF;
 t1:=m.private_pack->'private_cards'->0->>'actor_id';
 t2:=m.private_pack->'private_cards'->1->>'actor_id';
 c1:=(m.play_state->'arrests'->t1->>'cycle')::int;
 c2:=(m.play_state->'arrests'->t2->>'cycle')::int;
 minutes:=CASE WHEN c1 IS NOT NULL AND c2 IS NOT NULL AND greatest(c1,c2)=3 THEN 14 ELSE 8 END;
 st:=jsonb_set(m.play_state,'{court}',jsonb_build_object(
    'started',true,'started_at',now(),'duration_minutes',minutes,
    'stage','opening','called','[]'::jsonb,'current',NULL,'phase','tribunal'),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=st WHERE room_code=m.room_code;
 UPDATE public.igr_v4_rooms SET phase='regime_court',phase_started_at=now(),
   phase_ends_at=now()+make_interval(mins=>minutes),updated_at=now() WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,payload)
 VALUES(r.code,'phase','public',jsonb_build_object(
   'title','TRIBUNAL DE KARSANE',
   'text','Tous les joueurs rejoignent la salle commune. Le Juge appelle les personnes présentes à la barre. L audience finale ne sera pas rejouée.',
   'duration_minutes',minutes));
 RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_begin_court(text)
 FROM PUBLIC,anon,authenticated;

-- Judge starts each real confrontation by calling ONLY a captured player or
-- the third suspect, never a fugitive who is still on the run.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_court_call(
 p_code text,p_player_token uuid,p_request_id text,p_actor_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 called jsonb;count_seconds integer;st jsonb;res jsonb;allowed boolean;
 prev igr_private.igr_regime_v13_ledger%rowtype;
 elapsed_seconds integer;slot_no integer;last_called_slot integer;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'juge' THEN RAISE EXCEPTION 'Judge required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.phase<>'regime_court' THEN RAISE EXCEPTION 'courtroom unavailable';END IF;
 allowed:=p_actor_id=m.private_pack->'private_cards'->2->>'actor_id'
   OR (m.play_state->'arrests' ? p_actor_id);
 IF NOT allowed THEN RAISE EXCEPTION 'person not present before court';END IF;
 called:=coalesce(m.play_state->'court'->'called','[]'::jsonb);
 IF called ? p_actor_id THEN RAISE EXCEPTION 'already called to the bar'; END IF;
 IF length(coalesce(p_request_id,''))<8 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO prev FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF prev.actor_player<>p.id OR prev.action_kind<>'court_call'
    THEN RAISE EXCEPTION 'court request conflict';END IF;
  RETURN prev.response;
 END IF;
 count_seconds:=CASE WHEN (m.play_state->'court'->>'duration_minutes')::int=14 THEN 120 ELSE 60 END;
 elapsed_seconds:=floor(extract(epoch from (
   now()-(m.play_state->'court'->>'started_at')::timestamptz)))::integer;
 -- A judge may call only one accused in a guaranteed statement slot.
 -- Opening is 60s; then exactly three 120s/60s defence slots.
 IF elapsed_seconds<60 OR elapsed_seconds>=60+3*count_seconds THEN
   RAISE EXCEPTION 'the defense statement window is not active';
 END IF;
 slot_no:=(elapsed_seconds-60)/count_seconds;
 last_called_slot:=coalesce((m.play_state->'court'->>'last_called_slot')::integer,-1);
 IF last_called_slot=slot_no THEN
   RAISE EXCEPTION 'only one speaker may be called per defense slot';
 END IF;
 st:=jsonb_set(m.play_state,ARRAY['court','called'],called||jsonb_build_array(p_actor_id),true);
 st:=jsonb_set(st,ARRAY['court','last_called_slot'],to_jsonb(slot_no),true);
 st:=jsonb_set(st,ARRAY['court','current'],jsonb_build_object(
   'actor_id',p_actor_id,'started_at',now(),'seconds',count_seconds),true);
 st:=jsonb_set(st,ARRAY['court','stage'],to_jsonb('defenses'::text),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=st WHERE room_code=m.room_code;
 res:=jsonb_build_object('ok',true,'actor_id',p_actor_id,'seconds',count_seconds);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_call',r.cycle,res)
 ;
 RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_court_call(text,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_court_call(text,uuid,text,text)
 TO anon,authenticated;

-- Private judgement of four acts. A source is credible only when revealed
-- in this room, authentic and independent of the second source. Returns no truth
-- or score until after the results phase.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_reconstruct(
 p_code text,p_player_token uuid,p_request_id text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 act jsonb;ans jsonb;eid text;piece jsonb;
 sources text[];i integer;accurate integer:=0;
 correct boolean;declared jsonb;res jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'investigation only';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.phase<>'regime_court' THEN RAISE EXCEPTION 'not a courtroom phase';END IF;
 IF jsonb_typeof(p_answers)<>'array' OR jsonb_array_length(p_answers)<>4 THEN
   RAISE EXCEPTION 'four judicial attributions required';END IF;
 IF m.play_state->'reconstructions' ? (p.id::text) THEN RAISE EXCEPTION 'already submitted';END IF;
 FOR act IN SELECT value FROM jsonb_array_elements(m.private_pack->'acts') LOOP
   SELECT value INTO ans FROM jsonb_array_elements(p_answers) value WHERE value->>'actId'=act->>'id';
   IF NOT FOUND THEN RAISE EXCEPTION 'missing judicial act';END IF;
   sources:=ARRAY[]::text[];
   IF jsonb_typeof(ans->'evidenceIds')='array' THEN
     FOR eid IN SELECT jsonb_array_elements_text(ans->'evidenceIds') LOOP
       SELECT value INTO piece FROM jsonb_array_elements(m.private_pack->'revelations') value
       WHERE value->>'id'=eid AND value->'act_ids' ? (act->>'id') LIMIT 1;
       IF NOT FOUND THEN
         piece:=m.private_pack->'third_suspect_mission'->'public_on_submission';
         IF NOT (piece->>'id'=eid AND piece->'act_ids' ? (act->>'id'))
           THEN piece:=NULL;END IF;
       END IF;
       IF piece IS NOT NULL AND
         ((piece->>'kind'='guaranteed' AND (piece->>'min_cycle')::int<=r.cycle)
           OR (coalesce(m.play_state->'disclosed','[]'::jsonb) ? eid))
       THEN sources:=array_append(sources,piece->>'origin');END IF;
     END LOOP;
   END IF;
   SELECT count(distinct t) >= 2 INTO correct FROM unnest(sources) t;
   correct:=correct AND ans->>'orderedBy'=act->>'orderedBy'
     AND ans->>'transmittedBy'=act->>'transmittedBy'
     AND ans->>'executedBy'=act->>'executedBy'
     AND ans->>'knewAndControlledBy'=act->>'knewAndControlledBy';
   IF correct THEN accurate:=accurate+1;END IF;
 END LOOP;
 declared:=jsonb_build_object('accurate',accurate,'passed',accurate>=3,'submitted_at',now());
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(m.play_state,'{reconstructions}',
 coalesce(m.play_state->'reconstructions','{}'::jsonb)||
 jsonb_build_object(p.id::text,declared),true)
 WHERE room_code=m.room_code;
 res:=jsonb_build_object('ok',true,'received',true,'final_score_sealed',true);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'judicial_reconstruction',r.cycle,res);
 RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_reconstruct(text,uuid,text,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_reconstruct(text,uuid,text,jsonb)
 TO anon,authenticated;

-- This is the one transition the v4 ticking flow must call for Regime only.
-- It skips duplicate speeches and retains the EXISTING v52 final 0/1/2 vote.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_finish_court(p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE r public.igr_v4_rooms%rowtype;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms
 WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR r.phase<>'regime_court' THEN RETURN;END IF;
 IF now()<r.phase_ends_at THEN RETURN;END IF;
 PERFORM public.igr_v52_begin_stage(r.code,'locking');
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_finish_court(text)
 FROM PUBLIC,anon,authenticated;
