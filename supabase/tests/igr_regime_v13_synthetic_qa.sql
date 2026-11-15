-- Disposable test; execute AFTER supabase/candidates/igr_regime_v13_private_runtime.sql
-- inside an outer BEGIN / ROLLBACK. No production data retained.
INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
VALUES('QA13SAFE','032','playing',1,'role_reading');
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
VALUES
 ('QA13SAFE','Enquêteur QA',0,'enqueteur',NULL),
 ('QA13SAFE','Analyste QA',1,'analyste',NULL),
 ('QA13SAFE','Juge QA',2,'juge',NULL),
 ('QA13SAFE','Dir Vahran QA',3,'suspect',1),
 ('QA13SAFE','Intérieur QA',4,'suspect',2),
 ('QA13SAFE','Secrétaire QA',5,'suspect',3);
INSERT INTO igr_private.igr_regime_v13_rooms(room_code,scenario_id,variant_id,private_pack,play_state)
SELECT 'QA13SAFE','032','A',manuscript->'regime_vnext',
 jsonb_build_object('alliance','{}'::jsonb,'decisions','[]'::jsonb,
 'investigations','[]'::jsonb,'disclosed','[]'::jsonb,'arrests','{}'::jsonb,
 'third','{}'::jsonb,'events','[]'::jsonb)
FROM igr_private.igr_v99_variant_manuscripts
WHERE scenario_id='032' AND variant_id='A';
DO $verify$
DECLARE
  investigator uuid; analyst uuid; dir uuid; interior uuid; third uuid;
  response jsonb; own jsonb; second jsonb;
BEGIN
 SELECT player_token INTO investigator FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO analyst FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND public_role='analyste';
 SELECT player_token INTO dir FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=1;
 SELECT player_token INTO interior FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=2;
 SELECT player_token INTO third FROM public.igr_v4_players WHERE room_code='QA13SAFE' AND internal_slot=3;
 own:=public.igr_regime_v13_state('QA13SAFE',dir);
 IF own->>'actor_id'<>'vahran_director' OR own->>'my_mission' IS NOT NULL THEN
   RAISE EXCEPTION 'fugitive card incorrect or third mission exposed'; END IF;
 second:=public.igr_regime_v13_state('QA13SAFE',third);
 IF second->>'actor_id'<>'palace_secretary' OR second->>'my_mission' IS NULL THEN
   RAISE EXCEPTION 'third card missing'; END IF;
 own:=public.igr_regime_v13_state('QA13SAFE',investigator);
 IF own ? 'private_pack' OR own ? 'canonical_truth' OR own->>'my_card' IS NOT NULL THEN
    RAISE EXCEPTION 'truth leaked to investigator'; END IF;
 response:=public.igr_regime_v13_action('QA13SAFE',dir,'alliance','qa-request-0001','{"choice":"together"}');
 IF response->>'ok'<>'true' THEN RAISE EXCEPTION 'first alliance choice failed'; END IF;
 response:=public.igr_regime_v13_action('QA13SAFE',interior,'alliance','qa-request-0002','{"choice":"apart"}');
 response:=public.igr_regime_v13_action('QA13SAFE',dir,'fugitive_choice','qa-request-0003',
  '{"option_id":"032A-vahran_director-C1-1"}');
 IF response->>'accepted'<>'true' THEN RAISE EXCEPTION 'fugitive action failed'; END IF;
 response:=public.igr_regime_v13_action('QA13SAFE',investigator,'investigate','qa-request-0004',
  '{"option_id":"investigate_032A_c1_1"}');
 IF response->>'ok'<>'true' THEN RAISE EXCEPTION 'investigation failed'; END IF;
 response:=public.igr_regime_v13_action('QA13SAFE',third,'third_submission','qa-request-0005','{}');
 IF response->>'accepted'<>'true' THEN RAISE EXCEPTION 'third submission failed'; END IF;
 own:=public.igr_regime_v13_state('QA13SAFE',analyst);
 IF (own->>'investigations_count')::int<>1 THEN RAISE EXCEPTION 'shared evidence state failed'; END IF;
 RAISE NOTICE 'Regime six-role synthetic client/server test PASS';
END $verify$;