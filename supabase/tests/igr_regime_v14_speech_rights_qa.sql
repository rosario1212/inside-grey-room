-- Role-independent allocation of three court speech slots and genuine
-- opt-out. Run inside BEGIN/ROLLBACK after the synthetic 6-person room setup.
DO $speech$
DECLARE
 judge uuid;director uuid;minister uuid;third uuid;
 result jsonb;state jsonb;
BEGIN
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 SELECT player_token INTO director FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=1;
 SELECT player_token INTO minister FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=2;
 SELECT player_token INTO third FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='suspect' AND internal_slot=3;
 UPDATE public.igr_v4_rooms SET phase='regime_court',cycle=3
 WHERE code='QA13SAFE';
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(
 jsonb_set(
 jsonb_set(play_state,ARRAY['arrests','vahran_director'],
   '{"cycle":1,"mandate":"qa-speaker"}'::jsonb,true),
   ARRAY['arrests','interior_minister'],
   '{"cycle":3,"mandate":"qa-speaker-2"}'::jsonb,true),
   '{court}',jsonb_build_object('started',true,
    'duration_minutes',14,'started_at',now()-interval '61 seconds',
    'stage','defenses','called','[]'::jsonb),true)
 WHERE room_code='QA13SAFE';
 state:=public.igr_regime_v13_state('QA13SAFE',director);
 IF state->'court'->>'slot_actor_id'<>'vahran_director'
 THEN RAISE EXCEPTION 'first defendant not automatically in court';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_court_call(
 'QA13SAFE',judge,'qa-bad-call-0001','palace_secretary');
 RAISE EXCEPTION 'judge could arbitrarily skip first defendant';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%arbitrarily skip%' THEN RAISE;END IF;END;
 result:=public.igr_regime_v14_pass_speech(
 'QA13SAFE',director,'qa-director-pass');
 IF result->>'passed'<>'true' THEN RAISE EXCEPTION 'defendant could not pass';END IF;
 BEGIN
 PERFORM public.igr_regime_v14_pass_speech(
 'QA13SAFE',minister,'qa-wrong-pass');
 RAISE EXCEPTION 'minister could pass during another defendant slot';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%minister could%' THEN RAISE;END IF;END;
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,ARRAY['court','started_at'],
  to_jsonb((now()-interval '181 seconds')::text),true)
 WHERE room_code='QA13SAFE';
 state:=public.igr_regime_v13_state('QA13SAFE',minister);
 IF state->'court'->>'slot_actor_id'<>'interior_minister'
 THEN RAISE EXCEPTION 'minister slot lost';END IF;
 result:=public.igr_regime_v14_pass_speech(
 'QA13SAFE',minister,'qa-minister-pass');
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,ARRAY['court','started_at'],
  to_jsonb((now()-interval '301 seconds')::text),true)
 WHERE room_code='QA13SAFE';
 state:=public.igr_regime_v13_state('QA13SAFE',third);
 IF state->'court'->>'slot_actor_id'<>'palace_secretary'
 THEN RAISE EXCEPTION 'third suspect slot lost';END IF;
 result:=public.igr_regime_v14_pass_speech(
 'QA13SAFE',third,'qa-third-pass');
 state:=public.igr_regime_v13_state('QA13SAFE',director);
 IF jsonb_array_length(state->'court'->'passes')<>3
 THEN RAISE EXCEPTION 'missing defendant opt-out records';END IF;
 RAISE NOTICE 'Three automatically guaranteed defense slots, valid pass and no judge veto: PASS';
END $speech$;