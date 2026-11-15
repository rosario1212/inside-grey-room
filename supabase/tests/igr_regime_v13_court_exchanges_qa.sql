-- Synthetic courtroom exchange + timeline QA. Execute in BEGIN/ROLLBACK
-- AFTER private/judicial/final scoring/court exchanges and 032 six-role synthetic QA.
DO $trial$
DECLARE
 enq uuid;judge uuid;suspect uuid;second uuid;
 answer jsonb;state jsonb;caught boolean;
BEGIN
 SELECT player_token INTO enq FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 SELECT player_token INTO suspect FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND internal_slot=1;
 SELECT player_token INTO second FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND internal_slot=2;
 UPDATE public.igr_v4_rooms SET cycle=3,phase='regime_court'
 WHERE code='QA13SAFE';
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=
 jsonb_set(
   jsonb_set(play_state,ARRAY['arrests','vahran_director'],
    '{"cycle":2,"mandate":"qa-test"}'::jsonb,true),
   '{court}',jsonb_build_object('started',true,
     'started_at',now()-interval '8 minutes',
     'duration_minutes',14,'exchanges','[]'::jsonb,
     'stage','confrontation','called','["vahran_director"]'::jsonb),true)
 WHERE room_code='QA13SAFE';
 state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF state->'court'->>'stage_actual'<>'confrontation'
 THEN RAISE EXCEPTION 'stage derived incorrectly';END IF;
 answer:=public.igr_regime_v13_court_exchange(
 'QA13SAFE',enq,'qa-exch-001','question',
 'Pourquoi la directive ne couvrait-elle pas ces transferts ?',NULL);
 IF answer->>'accepted'<>'true' THEN RAISE EXCEPTION 'question not accepted';END IF;
 answer:=public.igr_regime_v13_court_exchange(
 'QA13SAFE',suspect,'qa-exch-002','reply',
 'Les dates du registre ne correspondent pas au visa initial.',NULL);
 answer:=public.igr_regime_v13_court_exchange(
 'QA13SAFE',suspect,'qa-exch-003','objection',
 'Cette question attribue une intention sans pièce authentifiée.',NULL);
 answer:=public.igr_regime_v13_court_exchange(
 'QA13SAFE',judge,'qa-exch-004','ruling','sustained','qa-exch-003');
 IF answer->>'accepted'<>'true' THEN RAISE EXCEPTION 'judge could not rule';END IF;
 state:=public.igr_regime_v13_state('QA13SAFE',enq);
 IF jsonb_array_length(state->'court'->'exchanges')<>4 THEN
 RAISE EXCEPTION 'clients do not share the same four interventions';END IF;
 BEGIN
 PERFORM public.igr_regime_v13_court_exchange(
 'QA13SAFE',judge,'qa-exch-005','ruling','overruled','qa-exch-003');
 RAISE EXCEPTION 'double ruling incorrectly accepted';
 EXCEPTION WHEN others THEN IF SQLERRM='double ruling incorrectly accepted' THEN RAISE;END IF;END;
 BEGIN
 PERFORM public.igr_regime_v13_court_exchange(
 'QA13SAFE',second,'qa-exch-006','reply','Je conteste cette lecture des dates.',NULL);
 RAISE EXCEPTION 'uncaptured fugitive incorrectly participated in the courtroom';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%incorrectly participated%' THEN RAISE;END IF;END;
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=
 jsonb_set(play_state,ARRAY['court','started_at'],
  to_jsonb((now()-interval '2 minutes')::text),true)
 WHERE room_code='QA13SAFE';
 BEGIN
 PERFORM public.igr_regime_v13_court_exchange(
 'QA13SAFE',enq,'qa-exch-007','question',
 'Une question en dehors des cinq minutes doit être refusée.',NULL);
 RAISE EXCEPTION 'outside-stage question incorrectly accepted';
 EXCEPTION WHEN others THEN IF SQLERRM LIKE '%incorrectly accepted%' THEN RAISE;END IF;END;
 RAISE NOTICE 'Regime shared court, 5min window, question/reply/objection/judge ruling, fugitive exclusion: PASS';
END $trial$;