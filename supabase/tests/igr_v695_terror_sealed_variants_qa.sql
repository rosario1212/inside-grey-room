-- Execute with v694 + v695 inside one transaction ending ROLLBACK.
DO $test$
DECLARE d record; pack_ jsonb;code_ text;enq_id uuid;enq_token uuid;
 s_id uuid;host_ uuid;slot_ int;r jsonb;results_ jsonb;cnt int;guarantee int;
 needs text; actual text; expected text; k int;
BEGIN
 IF NOT igr_private.igr_v695_release_eligible() THEN RAISE EXCEPTION 'draft release audit failed';END IF;
 FOR d IN SELECT scenario_id,variant_id,proposed_manuscript AS m
   FROM igr_private.igr_v680_terror_editorial_drafts
   WHERE scenario_id IN ('026','027','028') ORDER BY 1,2 LOOP
  pack_:=igr_private.igr_v695_build_pack(d.scenario_id,d.m);
  IF jsonb_array_length(pack_->'suspects')<>3 OR
     jsonb_array_length(pack_->'trames')<>11 OR
     pack_->'truth'->>'summary'<>d.m->'canonical_truth'->>'summary'
  THEN RAISE EXCEPTION 'variant pack wrong %/%',d.scenario_id,d.variant_id;END IF;
  FOR slot_ IN 1..3 LOOP
    IF (pack_->'truth'->'levels'->>(slot_-1))::int <>
       (d.m->'v680_verdict'->'levels'->>slot_::text)::int
    THEN RAISE EXCEPTION 'wrong responsibilities %/%/%',d.scenario_id,d.variant_id,slot_;END IF;
  END LOOP;
  code_:='TV95'||d.scenario_id||d.variant_id;
  INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(code_,d.scenario_id)
  RETURNING host_token INTO host_;
  PERFORM public.igr_v681_terror_set_city(code_,host_,'Capitale QA');
  INSERT INTO igr_private.igr_v695_terror_room_packs(room_code,scenario_id,variant_id,pack,manuscript_md5)
  VALUES(code_,d.scenario_id,d.variant_id,pack_,md5(pack_::text));
  INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role)
  VALUES(code_,'Enquêteur QA',0,'enqueteur'),
        (code_,'Analyste QA',1,'analyste'),
        (code_,'Officier QA',2,'officier_liaison');
  FOR slot_ IN 1..3 LOOP
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
    VALUES(code_,'Suspect '||slot_,slot_+2,'suspect',slot_) RETURNING id INTO s_id;
    r:=public.igr_v4_build_private_card(code_,s_id);
    IF r->>'place'<>(pack_->'suspects'->(slot_-1))->>'place'
    THEN RAISE EXCEPTION 'private suspect card mismatch %/%/%',d.scenario_id,d.variant_id,slot_;END IF;
  END LOOP;
  SELECT id,player_token INTO enq_id,enq_token FROM public.igr_v4_players
  WHERE room_code=code_ AND public_role='enqueteur';
  UPDATE public.igr_v4_rooms
    SET status='playing',cycle=1,phase='trame',phase_started_at=now(),
      phase_ends_at=now()+interval '3 minutes'
    WHERE code=code_;
  FOR k IN 1..3 LOOP
    UPDATE public.igr_v4_rooms SET cycle=k,phase='trame',
      phase_started_at=now(),phase_ends_at=now()+interval '3 minutes'
    WHERE code=code_;
    PERFORM public.igr_v4_emit_trame(code_);
    SELECT count(*) INTO guarantee FROM public.igr_v4_events
    WHERE room_code=code_ AND cycle=k AND event_type='trame'
       AND payload->>'investigation_type'='guaranteed';
    IF guarantee<>3 THEN RAISE EXCEPTION 'missing 3 guaranteed for %/% cycle % got %',
       d.scenario_id,d.variant_id,k,guarantee;END IF;
  END LOOP;
  SELECT count(*) INTO cnt FROM public.igr_v4_events
  WHERE room_code=code_ AND event_type='trame'
     AND payload->>'investigation_type'='guaranteed';
  IF cnt<>9 THEN RAISE EXCEPTION 'expected 9 guaranteed investigations %/%',d.scenario_id,d.variant_id;END IF;
  r:=public.igr_v4_sync(code_,enq_token);
  IF r#>'{scenario,truth}' IS DISTINCT FROM 'null'::jsonb
  THEN RAISE EXCEPTION 'truth leaked before reveal %/%',d.scenario_id,d.variant_id;END IF;
  IF r#>>'{room,state,variant_id}' IS NOT NULL OR
    r#>>'{scenario,variant_id}' IS NOT NULL
  THEN RAISE EXCEPTION 'variant identifier leaked %/%',d.scenario_id,d.variant_id;END IF;
  results_:=public.igr_v4_make_reveal(code_);
  FOR slot_ IN 1..3 LOOP
    SELECT x->>'truth_level' INTO actual FROM
      jsonb_array_elements(results_->'responsibilities') x
    JOIN public.igr_v4_players pp ON pp.id=(x->>'player_id')::uuid
    WHERE pp.room_code=code_ AND pp.internal_slot=slot_;
    expected:=(d.m->'v680_verdict'->'levels'->>slot_::text);
    IF actual IS DISTINCT FROM expected THEN
      RAISE EXCEPTION 'reveal mismatch %/%/% actual % expected %',
        d.scenario_id,d.variant_id,slot_,actual,expected;
    END IF;
  END LOOP;
  -- v52's authoritative result is built through v50, not only the v4 reveal.
  results_:=public.igr_v50_reveal_legacy(code_);
  FOR slot_ IN 1..3 LOOP
    SELECT x->>'truth_level' INTO actual FROM
      jsonb_array_elements(results_->'responsibilities') x
    JOIN public.igr_v4_players pp ON pp.id=(x->>'player_id')::uuid
    WHERE pp.room_code=code_ AND pp.internal_slot=slot_;
    expected:=(d.m->'v680_verdict'->'levels'->>slot_::text);
    IF actual IS DISTINCT FROM expected THEN
      RAISE EXCEPTION 'authoritative v50 verdict mismatch %/%/% actual % expected %',
       d.scenario_id,d.variant_id,slot_,actual,expected;
    END IF;
  END LOOP;
 END LOOP;
END $test$;
