-- Run inside an outer BEGIN / ROLLBACK after igr_regime_v13_synthetic_qa.sql.
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
VALUES ('QA13SAFE','Archiviste QA',6,'temoin'),
       ('QA13SAFE','Correspondant QA',7,'journaliste');
DO $civic$
DECLARE witness_token uuid;journal_token uuid;enq_token uuid;ref_id text;reply jsonb;pub jsonb;
BEGIN
 UPDATE public.igr_v4_rooms SET state=coalesce(state,'{}'::jsonb)||
 '{"regime_v13_active":true}'::jsonb WHERE code='QA13SAFE';
 SELECT player_token INTO witness_token FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='temoin';
 SELECT player_token INTO journal_token FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='journaliste';
 SELECT player_token INTO enq_token FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 pub:=public.igr_regime_v13_state('QA13SAFE',witness_token);
 IF pub->'my_card'->>'identity' IS NULL THEN RAISE EXCEPTION 'private witness brief missing';END IF;
 SELECT x->>'id' INTO ref_id FROM jsonb_array_elements(pub->'public_evidence') x
 WHERE x->>'kind' IS DISTINCT FROM 'capture' LIMIT 1;
 IF ref_id IS NULL THEN RAISE EXCEPTION 'missing published document';END IF;
 reply:=public.igr_regime_v16_civic_statement('QA13SAFE',witness_token,
 'qa-v16-wit-000001','testimony',ref_id,
 'Je reconnais ce type de dossier. Mais son contenu seul ne suffit pas à identifier le signataire.');
 IF reply->>'ok'<>'true' THEN RAISE EXCEPTION 'witness public statement failed';END IF;
 reply:=public.igr_regime_v16_civic_statement('QA13SAFE',journal_token,
 'qa-v16-press-00001','press',ref_id,
 'Cette archive disponible pose une question au gouvernement, sans prouver la responsabilité pénale.');
 IF reply->>'ok'<>'true' THEN RAISE EXCEPTION 'press statement failed';END IF;
 IF jsonb_array_length((SELECT play_state->'civic_statements'
 FROM igr_private.igr_regime_v13_rooms WHERE room_code='QA13SAFE'))<>2
 THEN RAISE EXCEPTION 'wrong civic statement count';END IF;
 BEGIN
  PERFORM public.igr_regime_v16_civic_statement('QA13SAFE',enq_token,
   'qa-v16-bad-role01','press',ref_id,
   'Ceci constitue un texte assez long, mais mon rôle ne le permet pas.');
  RAISE EXCEPTION 'improper press permission granted';
 EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%improper press permission%' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.igr_regime_v16_civic_statement('QA13SAFE',witness_token,
   'qa-v16-double0001','testimony',ref_id,
   'Deuxième témoignage pendant le même cycle, interdit par le serveur.');
  RAISE EXCEPTION 'duplicate testimony accepted';
 EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%duplicate testimony%' THEN RAISE; END IF;
 END;
 UPDATE public.igr_v4_rooms SET cycle=3,phase='regime_court',
  phase_started_at=now(),phase_ends_at=now()+interval '14 minutes'
 WHERE code='QA13SAFE';
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(play_state,'{court}',jsonb_build_object(
  'started',true,'started_at',now()-interval '7 minutes 5 seconds',
  'duration_minutes',14,'exchanges','[]'::jsonb),true)
 WHERE room_code='QA13SAFE';
 reply:=public.igr_regime_v13_court_exchange('QA13SAFE',witness_token,
 'qa-v16-court-wit1','testimony',
 'Ce document atteste de sa publication, mais pas du responsable de son contenu.',NULL);
 IF reply->>'accepted'<>'true' THEN RAISE EXCEPTION 'witness speech failed';END IF;
 reply:=public.igr_regime_v13_court_exchange('QA13SAFE',journal_token,
 'qa-v16-court-press1','press_question',
 'Qui a authentifié ce document avant son inscription au dossier commun ?',NULL);
 IF reply->>'accepted'<>'true' THEN RAISE EXCEPTION 'journalist court question failed';END IF;
 RAISE NOTICE 'Regime v16 witness and journalist source guard, quota, court rights PASS';
END $civic$;
