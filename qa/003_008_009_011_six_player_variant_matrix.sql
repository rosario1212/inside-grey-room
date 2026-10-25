-- Reproducible QA: 003/008/009/011 x A/B/C, six players per variant.
-- Use on a QA database with existing scenario releases; requires trusted DB access.
-- A single PostgreSQL transaction is rolled back, including every artificial room.
-- Do NOT remove BEGIN or ROLLBACK; no player data, secrets or verdicts are printed.
BEGIN;
DO $qa_matrix$
DECLARE sid text; variant text; room_id text; host jsonb;
  source_row igr_private.igr_v99_variant_manuscripts%rowtype;
  n integer; sessions integer:=0; synchronizations integer:=0;
  optional_role text; viewer record; secret record; state jsonb; expert_token uuid;
  outcome jsonb; request_id bigint;
BEGIN
 FOR sid IN SELECT unnest(ARRAY['003','008','009','011']) LOOP
  FOR variant IN SELECT unnest(ARRAY['A','B','C']) LOOP
   room_id:='Q'||upper(substr(translate(md5(gen_random_uuid()::text),'01','AB'),1,4));
   host:=public.igr_v4_create_room(room_id,sid,'QA Host');
   FOR n IN 1..5 LOOP PERFORM public.igr_v4_join_room(room_id,'QA Player '||n);END LOOP;
   SELECT * INTO source_row FROM igr_private.igr_v99_variant_manuscripts
     WHERE scenario_id=sid AND variant_id=variant;
   IF NOT FOUND OR md5(source_row.manuscript::text)<>source_row.content_md5 THEN
     RAISE EXCEPTION 'Variant source missing or corrupt for % %',sid,variant;END IF;

   -- Pin exact variant in a disposable room; ordinary player games still use random assignment.
   IF sid='003' THEN
     INSERT INTO igr_private.igr_v99_room_canons(room_code,scenario_id,variant_id,manuscript,manuscript_md5)
     VALUES(room_id,sid,variant,source_row.manuscript,source_row.content_md5);
   ELSIF sid='008' THEN
     INSERT INTO igr_private.igr_v301_008_room_snapshots(room_code,variant_id,pack)
     VALUES(room_id,variant,igr_private.igr_v300_008_build_pack(variant));
   ELSIF sid='009' THEN
     INSERT INTO igr_private.igr_v331_009_room_snapshots(room_code,variant_id,pack)
     VALUES(room_id,variant,igr_private.igr_v330_009_build_pack(variant));
   ELSE
     INSERT INTO igr_private.igr_v371_011_room_snapshots(room_code,variant_id,pack)
     VALUES(room_id,variant,igr_private.igr_v370_011_build_pack(variant));
   END IF;

   PERFORM public.igr_v4_start_game(room_id,(host->>'host_token')::uuid);
   optional_role:=CASE sid WHEN '003' THEN 'expert' WHEN '008' THEN 'juge'
     WHEN '009' THEN 'expert' ELSE 'procureur' END;

   IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=room_id)<>6
     OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=room_id AND public_role='suspect')<>3
     OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=room_id AND public_role='analyste')<>1
     OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=room_id AND public_role='enqueteur')<>1
     OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=room_id AND public_role=optional_role)<>1 THEN
     RAISE EXCEPTION 'Six-player role distribution fails for % %',sid,variant;
   END IF;

   -- Each player's real RPC response must contain their own role, but not other suspects' hide fields.
   FOR viewer IN SELECT id,player_token,public_role FROM public.igr_v4_players WHERE room_code=room_id LOOP
     state:=public.igr_v4_sync(room_id,viewer.player_token);
     IF state->'player'->>'public_role' IS DISTINCT FROM viewer.public_role
       THEN RAISE EXCEPTION 'Wrong sync identity for % %',sid,variant;END IF;
     FOR secret IN SELECT id,private_state->>'hide' as hidden
       FROM public.igr_v4_players WHERE room_code=room_id
        AND public_role='suspect' AND id<>viewer.id LOOP
       IF length(coalesce(secret.hidden,''))>=24 AND position(secret.hidden in state::text)>0
         THEN RAISE EXCEPTION 'Private suspect hide leaked in % %',sid,variant;END IF;
     END LOOP;
     synchronizations:=synchronizations+1;
   END LOOP;

   IF sid IN('003','009') THEN
     SELECT player_token INTO expert_token FROM public.igr_v4_players
        WHERE room_code=room_id AND public_role='expert';
     UPDATE public.igr_v4_rooms SET cycle=1,phase='cycle_debrief' WHERE code=room_id;
     state:=public.igr_v50_expert_state(room_id,expert_token);
     IF jsonb_array_length(state->'catalog')<>4 OR
        (SELECT (e->>'available')::boolean FROM jsonb_array_elements(state->'catalog') e
         WHERE e->>'id'='e2') IS DISTINCT FROM false THEN
       RAISE EXCEPTION 'Future expert clue offered too early in % %',sid,variant;END IF;
     outcome:=public.igr_v50_expert_analyze(room_id,expert_token,'e1');
     IF outcome->>'result' NOT LIKE '%APPLICATION À CETTE VARIANTE%' THEN
       RAISE EXCEPTION 'Missing pinned variant analysis in % %',sid,variant;END IF;
   ELSIF sid='008' THEN
     UPDATE public.igr_v4_rooms SET cycle=1,phase='cycle_debrief' WHERE code=room_id;
     SELECT player_token INTO expert_token FROM public.igr_v4_players
       WHERE room_code=room_id AND public_role='enqueteur';
     outcome:=public.igr_v44_submit_judge_request(room_id,expert_token,'investigation_access','p3','QA');
     request_id:=(outcome->>'request_id')::bigint;
     SELECT player_token INTO expert_token FROM public.igr_v4_players
       WHERE room_code=room_id AND public_role='juge';
     PERFORM public.igr_v44_judge_decide_request(room_id,expert_token,request_id,'protected','QA');
     IF public.igr_v44_protection_count(room_id)<>2
       THEN RAISE EXCEPTION 'Judge cost must be 2 for p3 in variant %',variant;END IF;
   ELSE
     SELECT player_token INTO expert_token FROM public.igr_v4_players
       WHERE room_code=room_id AND public_role='procureur';
     UPDATE public.igr_v4_rooms SET cycle=1,phase='cycle_debrief' WHERE code=room_id;
     state:=public.igr_v47_prosecutor_state(room_id,expert_token);
     IF state->>'case_strategy' IS NULL OR state->>'case_strategy_cycle'<>'1'
       THEN RAISE EXCEPTION 'No prosecutor strategy in 011 %',variant;END IF;
   END IF;
   sessions:=sessions+1;
  END LOOP;
 END LOOP;
 IF sessions<>12 OR synchronizations<>72 THEN RAISE EXCEPTION 'Matrix incomplete';END IF;
END;
$qa_matrix$;
SELECT 'PASS: 12 forced-variant games / 72 real player syncs / 0 durable QA rooms' AS result;
ROLLBACK;
