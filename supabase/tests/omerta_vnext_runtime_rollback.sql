-- OMERTÀ vNext live-contract smoke test.
-- Execute ONLY wrapped by BEGIN + the four candidate migrations + ROLLBACK.
-- Test rooms exist solely in the transaction; no player data remains afterward.
DO $omerta_test$
DECLARE
  sc text;
  room_code2 text;
  investigator public.igr_v4_players%rowtype;
  suspect public.igr_v4_players%rowtype;
  offer jsonb;
  options jsonb;
  vote jsonb;
  ending jsonb;
  fact text;
  should_pass boolean;
  actual_pass boolean;
  fail_rejected boolean;
BEGIN
  FOREACH sc IN ARRAY ARRAY['021','022','023','024','025'] LOOP
    room_code2 := 'QATOM'||sc;
    INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
    VALUES(room_code2,sc,'playing',2,'interrogation','{"match_no":1}'::jsonb);
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
    VALUES(room_code2,'QA investigator',1,'enqueteur','enqueteur') RETURNING * INTO investigator;
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot,private_state)
    SELECT room_code2,'QA suspect',2,'suspect','pentito',1,
      jsonb_build_object('hide',pack->'suspects'->0->>'hide',
        'chronology',pack->'suspects'->0->>'chronology')
    FROM public.igr_v4_scenario_packs WHERE scenario_id=sc
    RETURNING * INTO suspect;

    -- A mere suspect must not see informant cards.
    options:=public.igr_omerta_money_intel_options(room_code2,suspect.player_token);
    IF coalesce((options->>'available')::boolean,false) THEN RAISE EXCEPTION 'card accessible before consent %',sc; END IF;

    -- A suspect cannot offer cooperation on behalf of an investigator.
    fail_rejected:=false;
    BEGIN
      PERFORM public.igr_omerta_indic_offer(room_code2,suspect.player_token,suspect.id);
    EXCEPTION WHEN OTHERS THEN fail_rejected:=true; END;
    IF NOT fail_rejected THEN RAISE EXCEPTION 'suspect forged investigator offer %',sc; END IF;

    offer:=public.igr_omerta_indic_offer(room_code2,investigator.player_token,suspect.id);
    IF offer->>'ok' <> 'true' THEN RAISE EXCEPTION 'offer rejected %',sc; END IF;
    PERFORM public.igr_omerta_indic_respond(room_code2,suspect.player_token,true);
    options:=public.igr_omerta_money_intel_options(room_code2,suspect.player_token);
    IF jsonb_array_length(options->'cards') <> 3 THEN RAISE EXCEPTION 'not 3 cards % %',sc,options; END IF;
    fact:=options->'cards'->0->>'id';

    -- Signals aren't credit. A "yes" vote is sufficient even with no card.
    IF sc='021' THEN
      PERFORM public.igr_omerta_money_intel_signal(room_code2,suspect.player_token,fact);
      IF EXISTS(SELECT 1 FROM public.igr_v4_actions WHERE room_code=room_code2 AND action_type='omerta_verified_intel') THEN
        RAISE EXCEPTION 'signal credited as verified intel';
      END IF;
      PERFORM public.igr_omerta_money_intel_send(room_code2,suspect.player_token,fact);
      options:=public.igr_omerta_money_intel_options(room_code2,suspect.player_token);
      IF options->'cards'->0->>'logged'<>'true' THEN RAISE EXCEPTION 'logged state missing'; END IF;
      fail_rejected:=false;
      BEGIN
        PERFORM public.igr_omerta_money_intel_send(room_code2,suspect.player_token,fact);
      EXCEPTION WHEN OTHERS THEN fail_rejected:=true;END;
      IF NOT fail_rejected THEN RAISE EXCEPTION 'duplicate formal intelligence accepted';END IF;
    ELSIF sc='025' THEN
      -- Generic authored hint remains unassessed; no automatic win by ticking the app.
      PERFORM public.igr_omerta_money_intel_send(room_code2,suspect.player_token,fact);
    END IF;

    UPDATE public.igr_v4_rooms SET phase='locking' WHERE code=room_code2;
    -- 021: vote NO but verified canonical card => yes; 022–023 vote YES with zero cards => yes;
    -- 024: vote NO and no card => no; 025: vote NO and unassessed card => no.
    vote:=public.igr_omerta_indic_assess(room_code2,investigator.player_token,
      sc IN ('022','023'));
    IF vote->>'ok'<>'true' THEN RAISE EXCEPTION 'vote broken %',sc; END IF;
    fail_rejected:=false;
    BEGIN
      PERFORM public.igr_omerta_indic_assess(room_code2,investigator.player_token,true);
    EXCEPTION WHEN OTHERS THEN fail_rejected:=true;END;
    IF NOT fail_rejected THEN RAISE EXCEPTION 'duplicate vote allowed %',sc;END IF;

    ending:=public.igr_omerta_make_reveal(room_code2);
    SELECT coalesce((v->'indic'->>'second_condition_met')::boolean,false)
    INTO actual_pass FROM jsonb_array_elements(ending->'results') AS v
    WHERE v->>'player_id'=suspect.id::text;
    should_pass:=sc IN ('021','022','023');
    IF actual_pass IS DISTINCT FROM should_pass THEN
      RAISE EXCEPTION 'wrong cooperation % expected %, got %',sc,should_pass,actual_pass;
    END IF;
  END LOOP;
END;
$omerta_test$;
SELECT 'five_canonical_cases_passed' AS outcome;
