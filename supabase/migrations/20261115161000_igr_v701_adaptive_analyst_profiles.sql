-- v701 · 10 meaningful words minimum per answer, two event-aware
-- psychological prompts per suspect and cycle, no verdict/gameplay effects.
-- All prompts remain hypotheses and are revealed only with the finished match.

DO $patch$
DECLARE definition text; marker text;
BEGIN
 SELECT pg_get_functiondef('public.igr_v700_submit_psych_profile(text,uuid,uuid,text,text)'::regprocedure) INTO definition;
 IF position('v701 ten-word minimum' IN definition)=0 THEN
  marker:=' IF char_length(a1) NOT BETWEEN 12 AND 180';
  IF position(marker IN definition)=0 THEN RAISE EXCEPTION 'v700 profile word anchor changed';END IF;
  definition:=replace(definition,marker,$new$ -- v701 ten-word minimum; whitespace-delimited for FR/EN, both answers independently.
 IF cardinality(regexp_split_to_array(a1,'[[:space:]]+'))<10
    OR cardinality(regexp_split_to_array(a2,'[[:space:]]+'))<10
 THEN RAISE EXCEPTION 'each psychological answer needs at least 10 words';END IF;
 IF char_length(a1) NOT BETWEEN 12 AND 180$new$);
  EXECUTE definition;
 END IF;
 SELECT pg_get_functiondef('public.igr_v700_psych_profiles(text,uuid)'::regprocedure) INTO definition;
 IF position('v701 question keys' IN definition)=0 THEN
  marker:=$old$'answer_two',a.payload->>'answer_two') ORDER BY a.cycle,a.id)$old$;
  IF position(marker IN definition)=0 THEN RAISE EXCEPTION 'v700 profile reader anchor changed';END IF;
  definition:=replace(definition,marker,$new$-- v701 question keys are stored with every profile, not recalculated at the end.
   'answer_two',a.payload->>'answer_two',
   'question_one_code',a.payload->>'question_one_code',
   'question_two_code',a.payload->>'question_two_code') ORDER BY a.cycle,a.id)$new$);
  EXECUTE definition;
 END IF;
END $patch$;

-- New endpoint validates contextual question *identifiers*. The legacy
-- five-argument RPC remains available and enforces ten words as well.
CREATE OR REPLACE FUNCTION public.igr_v701_submit_psych_profile(
 p_code text,p_player_token uuid,p_suspect_id uuid,
 p_answer_one text,p_answer_two text,
 p_question_one_code text,p_question_two_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE who public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype; k text; expected_ text; response_ jsonb;
 current_match integer; updated_count integer;
BEGIN
 SELECT * INTO who FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role='analyste';
 IF NOT FOUND THEN RAISE EXCEPTION 'analyst role required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=who.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'unknown room';END IF;
 IF p_question_one_code IS NULL OR p_question_two_code IS NULL OR
    p_question_one_code !~ '^c[123]_(base|statement|interview|confrontation|evidence)_1
 THEN RAISE EXCEPTION 'invalid first psychological question';END IF;
 k:=substring(p_question_one_code FROM '^c[123]_(base|statement|interview|confrontation|evidence)_1
 expected_:='c'||r.cycle||'_'||k||'_1';
 IF p_question_one_code IS DISTINCT FROM expected_
 OR p_question_two_code IS DISTINCT FROM ('c'||r.cycle||'_'||k||'_2')
 THEN RAISE EXCEPTION 'questions must match the current cycle and context';END IF;
 current_match:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 response_:=public.igr_v700_submit_psych_profile(p_code,p_player_token,
  p_suspect_id,p_answer_one,p_answer_two);
 UPDATE public.igr_v4_actions a
 SET payload=payload||jsonb_build_object(
  'question_one_code',p_question_one_code,
  'question_two_code',p_question_two_code)
 WHERE a.room_code=r.code AND a.player_id=who.id
  AND a.cycle=r.cycle AND a.action_type='igr_v700_psych_profile'
  AND a.payload->>'suspect_id'=p_suspect_id::text
  AND coalesce((a.payload->>'match_no')::integer,1)=current_match;
 GET DIAGNOSTICS updated_count=ROW_COUNT;
 IF updated_count<>1 THEN RAISE EXCEPTION 'profile question binding failed';END IF;
 RETURN response_||jsonb_build_object('question_one_code',p_question_one_code,
   'question_two_code',p_question_two_code);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 TO anon,authenticated;
 THEN RAISE EXCEPTION 'invalid first psychological question';END IF;
 k:=substring(p_question_one_code FROM '^c[123]_(base|statement|interview|confrontation|evidence)_1$');
 expected_:='c'||r.cycle||'_'||k||'_1';
 IF p_question_one_code IS DISTINCT FROM expected_
 OR p_question_two_code IS DISTINCT FROM ('c'||r.cycle||'_'||k||'_2')
 THEN RAISE EXCEPTION 'questions must match the current cycle and context';END IF;
 current_match:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 response_:=public.igr_v700_submit_psych_profile(p_code,p_player_token,
  p_suspect_id,p_answer_one,p_answer_two);
 UPDATE public.igr_v4_actions a
 SET payload=payload||jsonb_build_object(
  'question_one_code',p_question_one_code,
  'question_two_code',p_question_two_code)
 WHERE a.room_code=r.code AND a.player_id=who.id
  AND a.cycle=r.cycle AND a.action_type='igr_v700_psych_profile'
  AND a.payload->>'suspect_id'=p_suspect_id::text
  AND coalesce((a.payload->>'match_no')::integer,1)=current_match;
 GET DIAGNOSTICS updated_count=ROW_COUNT;
 IF updated_count<>1 THEN RAISE EXCEPTION 'profile question binding failed';END IF;
 RETURN response_||jsonb_build_object('question_one_code',p_question_one_code,
   'question_two_code',p_question_two_code);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 TO anon,authenticated;);
 IF k IS NULL THEN RAISE EXCEPTION 'invalid context';END IF;
 expected_:='c'||r.cycle||'_'||k||'_1';
 IF p_question_one_code IS DISTINCT FROM expected_
 OR p_question_two_code IS DISTINCT FROM ('c'||r.cycle||'_'||k||'_2')
 THEN RAISE EXCEPTION 'questions must match the current cycle and context';END IF;
 current_match:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 response_:=public.igr_v700_submit_psych_profile(p_code,p_player_token,
  p_suspect_id,p_answer_one,p_answer_two);
 UPDATE public.igr_v4_actions a
 SET payload=payload||jsonb_build_object(
  'question_one_code',p_question_one_code,
  'question_two_code',p_question_two_code)
 WHERE a.room_code=r.code AND a.player_id=who.id
  AND a.cycle=r.cycle AND a.action_type='igr_v700_psych_profile'
  AND a.payload->>'suspect_id'=p_suspect_id::text
  AND coalesce((a.payload->>'match_no')::integer,1)=current_match;
 GET DIAGNOSTICS updated_count=ROW_COUNT;
 IF updated_count<>1 THEN RAISE EXCEPTION 'profile question binding failed';END IF;
 RETURN response_||jsonb_build_object('question_one_code',p_question_one_code,
   'question_two_code',p_question_two_code);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 TO anon,authenticated;
 THEN RAISE EXCEPTION 'invalid first psychological question';END IF;
 k:=substring(p_question_one_code FROM '^c[123]_(base|statement|interview|confrontation|evidence)_1$');
 expected_:='c'||r.cycle||'_'||k||'_1';
 IF p_question_one_code IS DISTINCT FROM expected_
 OR p_question_two_code IS DISTINCT FROM ('c'||r.cycle||'_'||k||'_2')
 THEN RAISE EXCEPTION 'questions must match the current cycle and context';END IF;
 current_match:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 response_:=public.igr_v700_submit_psych_profile(p_code,p_player_token,
  p_suspect_id,p_answer_one,p_answer_two);
 UPDATE public.igr_v4_actions a
 SET payload=payload||jsonb_build_object(
  'question_one_code',p_question_one_code,
  'question_two_code',p_question_two_code)
 WHERE a.room_code=r.code AND a.player_id=who.id
  AND a.cycle=r.cycle AND a.action_type='igr_v700_psych_profile'
  AND a.payload->>'suspect_id'=p_suspect_id::text
  AND coalesce((a.payload->>'match_no')::integer,1)=current_match;
 GET DIAGNOSTICS updated_count=ROW_COUNT;
 IF updated_count<>1 THEN RAISE EXCEPTION 'profile question binding failed';END IF;
 RETURN response_||jsonb_build_object('question_one_code',p_question_one_code,
   'question_two_code',p_question_two_code);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v701_submit_psych_profile(text,uuid,uuid,text,text,text,text)
 TO anon,authenticated;