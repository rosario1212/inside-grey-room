-- LE RÉGIME v16 30-room startup matrix: 032/033 6/7/8, 034 6/7/8/9, all A/B/C.
-- Execute only inside BEGIN / ROLLBACK, after all v13 and v14 candidate SQL.
UPDATE igr_private.igr_v99_variant_manuscripts
SET editorial_status='ready',approved_by='QA_ROLLBACK_MATRIX_ONLY',approved_at=now(),
 manuscript=jsonb_set(jsonb_set(manuscript,'{regime_vnext,status}',
   to_jsonb('ready'::text),true),'{regime_vnext,human_review_approved}','true'::jsonb,true)
WHERE scenario_id IN ('032','033','034') AND variant_id IN ('A','B','C')
AND editorial_status='review';
UPDATE igr_private.igr_regime_v13_release SET enabled=true,
 approved_by='QA_ROLLBACK_MATRIX_ONLY',approved_at=now() WHERE release_key='regime';
DO $matrix$
DECLARE
 sid text;variant text;size integer;qa_code text;v_host uuid;
 expected jsonb;actual jsonb;rv jsonb;player_rec record;
 started jsonb;primary_role text;pack jsonb;room_state jsonb;
 count_rooms integer:=0;count_cards integer:=0;
BEGIN
 IF NOT igr_private.igr_regime_v13_release_eligible() THEN
  RAISE EXCEPTION 'rollback test release eligibility failed';END IF;
 FOR sid IN SELECT unnest(ARRAY['032','033','034']) LOOP
  FOR variant IN SELECT unnest(ARRAY['A','B','C']) LOOP
   FOR size IN SELECT unnest(ARRAY[6,7,8,9]) LOOP
    IF size>public.igr_v4_max_players(sid) THEN CONTINUE;END IF;
    qa_code:='R'||sid||variant||size;
    INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
      VALUES(qa_code,sid,'lobby',0,'lobby') RETURNING host_token INTO v_host;
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,preferred_role,is_host)
    SELECT qa_code, 'QA seat '||g::text,g,'en_attente',
       CASE g WHEN 0 THEN 'enqueteur' WHEN 1 THEN 'analyste'
          WHEN 2 THEN 'juge' WHEN 3 THEN 'suspect' WHEN 4 THEN 'suspect'
          WHEN 5 THEN 'suspect' WHEN 6 THEN 'procureur'
          WHEN 7 THEN 'temoin' ELSE 'journaliste' END,g=0
    FROM generate_series(0,size-1) g;
    INSERT INTO igr_private.igr_regime_v13_rooms(
      room_code,scenario_id,variant_id,private_pack,play_state)
    SELECT qa_code,sid,variant,manuscript->'regime_vnext',
       jsonb_build_object('strict_alias_only',true,
         'alliance','{}'::jsonb,'arrests','{}'::jsonb,
         'disclosed','[]'::jsonb,'investigations','[]'::jsonb,
         'decisions','[]'::jsonb,'court','{}'::jsonb,'mandates','[]'::jsonb,
         'third','{}'::jsonb,'events','[]'::jsonb,
         'reconstructions','{}'::jsonb)
    FROM igr_private.igr_v99_variant_manuscripts
    WHERE scenario_id=sid AND variant_id=variant;
    started:=public.igr_v4_start_game(qa_code,v_host);
    IF started->>'ok'<>'true' THEN RAISE EXCEPTION 'start refused in %',qa_code;END IF;
    SELECT vr.state INTO room_state FROM public.igr_v4_rooms vr WHERE vr.code=qa_code;
    IF NOT coalesce((room_state->>'regime_v13_active')::boolean,false) THEN
      RAISE EXCEPTION 'not marked v13 %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code)<>size
      THEN RAISE EXCEPTION 'wrong participant count %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='juge')<>1
      THEN RAISE EXCEPTION 'judge missing %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='suspect')<>3
      THEN RAISE EXCEPTION 'wrong suspect count %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='procureur')<>(CASE WHEN size>=7 THEN 1 ELSE 0 END)
      THEN RAISE EXCEPTION 'optional prosecutor wrong %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='temoin')<>(CASE WHEN size>=8 THEN 1 ELSE 0 END)
      THEN RAISE EXCEPTION 'optional witness missing %',qa_code;END IF;
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='journaliste')<>(CASE WHEN sid='034' AND size=9 THEN 1 ELSE 0 END)
      THEN RAISE EXCEPTION 'optional journalist missing %',qa_code;END IF;
    SELECT private_pack INTO pack FROM igr_private.igr_regime_v13_rooms WHERE room_code=qa_code;
    IF pack->>'scenarioId'<>sid OR pack->>'id'<>variant THEN
      RAISE EXCEPTION 'variant mismatch in pinned pack %',qa_code;END IF;
    FOR player_rec IN
      SELECT * FROM public.igr_v4_players WHERE room_code=qa_code
      AND public_role='suspect' ORDER BY internal_slot LOOP
      expected:=pack->'private_cards'->(player_rec.internal_slot-1);
      IF player_rec.private_state->>'actor_id' IS DISTINCT FROM expected->>'actor_id'
        THEN RAISE EXCEPTION 'wrong private card at % seat %',qa_code,player_rec.internal_slot;END IF;
      count_cards:=count_cards+1;
    END LOOP;
    count_rooms:=count_rooms+1;
   END LOOP;
  END LOOP;
 END LOOP;
 IF count_rooms<>30 OR count_cards<>90
   THEN RAISE EXCEPTION 'incorrect matrix cardinality';END IF;
 RAISE NOTICE '30 rooms all variants x 6/7/8 and 034 nine players, 90 private suspect cards, optional witness/press PASS';
END $matrix$;