-- Regime v14 cross-variant six-player multiplayer C1 smoke QA.
-- Run after all v14 candidates in an outer BEGIN / ROLLBACK, never on live.
DO $nine$
DECLARE
 src record;
 room_id text;d jsonb;actor1 text;actor2 text;
 enq uuid;jud uuid;fugitive uuid;third uuid;
 a jsonb;e1 jsonb;e2 jsonb;obj jsonb;state jsonb;result jsonb;
 i integer;tested integer:=0;third_path text;opts jsonb;correct_location text;
BEGIN
 FOR src IN
  SELECT scenario_id sid,variant_id variant,manuscript->'regime_vnext' d
  FROM igr_private.igr_v99_variant_manuscripts
  WHERE scenario_id IN ('032','033','034') AND
        manuscript->'regime_vnext'->>'status'='draft'
  ORDER BY scenario_id,variant_id
 LOOP
   d:=src.d;room_id:='QA14'||src.sid||src.variant;
   actor1:=d->'private_cards'->0->>'actor_id';
   actor2:=d->'private_cards'->1->>'actor_id';
   INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
   VALUES(room_id,src.sid,'playing',1,'role_reading');
   INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
   VALUES (room_id,'QA enqueteur',0,'enqueteur',NULL),
     (room_id,'QA analyste',1,'analyste',NULL),
     (room_id,'QA juge',2,'juge',NULL),
     (room_id,'QA dirigeant 1',3,'suspect',1),
     (room_id,'QA dirigeant 2',4,'suspect',2),
     (room_id,'QA troisième',5,'suspect',3);
   INSERT INTO igr_private.igr_regime_v13_rooms(
     room_code,scenario_id,variant_id,private_pack,play_state)
   VALUES(room_id,src.sid,src.variant,d,
     jsonb_build_object(
        'strict_alias_only',true,'alliance',
        jsonb_build_object(actor1,'apart',actor2,'apart'),
        'decisions','[]'::jsonb,'investigations','[]'::jsonb,
        'disclosed','[]'::jsonb,'arrests','{}'::jsonb,
        'mandates','[]'::jsonb,'reconstructions','{}'::jsonb,
        'track_overrides','{}'::jsonb,'capture_clue_tracks','{}'::jsonb,
        'scheduled_disclosures','[]'::jsonb,'extra_capture_leads','[]'::jsonb,
        'third','{}'::jsonb,'court','{}'::jsonb,'events','[]'::jsonb));
   SELECT player_token INTO enq FROM public.igr_v4_players
    WHERE room_code=room_id AND public_role='enqueteur';
   SELECT player_token INTO jud FROM public.igr_v4_players
    WHERE room_code=room_id AND public_role='juge';
   SELECT player_token INTO fugitive FROM public.igr_v4_players
    WHERE room_code=room_id AND internal_slot=1;
   SELECT player_token INTO third FROM public.igr_v4_players
    WHERE room_code=room_id AND internal_slot=3;
   state:=public.igr_regime_v13_state(room_id,enq);
   IF state::text ~ '(032|033|034)[ABC]([-_]|")' THEN
      RAISE EXCEPTION 'variant code leaked for % %',src.sid,src.variant; END IF;
   IF jsonb_array_length(state->'public_networks')<>5 OR
      state->'scene'->>'text' IS NULL OR
      jsonb_array_length(state->'cast')<>3 OR
      jsonb_array_length(state->'events')<1 THEN
      RAISE EXCEPTION 'missing public game or horror scenes for % %',src.sid,src.variant;
   END IF;
   opts:=public.igr_regime_v13_state(room_id,fugitive)->'my_fugitive_options';
   SELECT x.value INTO obj FROM jsonb_array_elements(opts) x
    WHERE x.value ? 'reveals_capture_evidence_id' LIMIT 1;
   IF obj IS NULL THEN RAISE EXCEPTION 'C1 risk action absent';END IF;
   result:=public.igr_regime_v13_action(room_id,fugitive,'fugitive_choice',
     'qa-risk-'||src.sid||'-'||src.variant||'-001',
     jsonb_build_object('option_id',obj->>'id'));
   IF result->>'accepted'<>'true' THEN
      RAISE EXCEPTION 'C1 decision rejected % %',src.sid,src.variant;END IF;
   state:=public.igr_regime_v13_state(room_id,enq);
   SELECT x.value INTO e1 FROM jsonb_array_elements(state->'public_evidence') x
    WHERE x.value->>'kind'='capture' AND x.value->>'target_id'=actor1
    ORDER BY x.value->>'id' LIMIT 1;
   SELECT x.value INTO e2 FROM jsonb_array_elements(state->'public_evidence') x
    WHERE x.value->>'kind'='capture' AND x.value->>'target_id'=actor1
       AND x.value->>'id'<>e1->>'id'
       AND x.value->>'source'<>e1->>'source'
       AND x.value->>'network_id'=e1->>'network_id'
     LIMIT 1;
   IF e1 IS NULL OR e2 IS NULL THEN
       RAISE EXCEPTION 'two same-place independent C1 leads missing for % %',src.sid,src.variant;
   END IF;
   correct_location:=e1->>'network_id';
   result:=public.igr_regime_v13_warrant(room_id,enq,
       'qa-warrant-'||src.sid||'-'||src.variant||'-001',actor1,correct_location,
       jsonb_build_array(e1->>'id',e2->>'id'));
   IF result->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'warrant failure';END IF;
   result:=public.igr_regime_v13_judge_review(room_id,jud,
       'qa-judge-'||src.sid||'-'||src.variant||'-001',
       'qa-warrant-'||src.sid||'-'||src.variant||'-001','allow');
   IF result->>'status'<>'captured' THEN
       RAISE EXCEPTION 'first fugitive not caught in % %',src.sid,src.variant;
   END IF;
   third_path:=d->'third_suspect_mission'->>'assigned_path';
   result:=public.igr_regime_v13_action(room_id,third,'third_submission',
      'qa-third-'||src.sid||'-'||src.variant||'-001',
      jsonb_build_object('defense','Je conteste la portée de ces transmissions et le degré de responsabilité qui me sont attribués.'));
   IF result->>'accepted'<>'true' THEN RAISE EXCEPTION 'third action refused % %',src.sid,src.variant;END IF;
   state:=public.igr_regime_v13_state(room_id,third);
   IF state::text ~ '(032|033|034)[ABC]([-_]|")'
     OR state->>'third_submitted'<>'true' THEN
     RAISE EXCEPTION 'third file leaked or missing % %',src.sid,src.variant;
   END IF;
   tested:=tested+1;
 END LOOP;
 IF tested<>9 THEN RAISE EXCEPTION 'expected nine variant tests, got %',tested;END IF;
 RAISE NOTICE 'All 9 A/B/C packs: anonymous six-player C1, 5 hideouts, atmosphere, 2 clues, arrest, judge and third suspect PASS';
END $nine$;