-- v700 · Two brief, fact-grounded psychological answers per suspect and cycle.
-- The Analyst alone writes them. All players may consult after a finished game.
-- No clinical diagnosis, invented clues, scoring change, or premature disclosure.
-- Each match is isolated, including consecutive games within the same room.

CREATE OR REPLACE FUNCTION public.igr_v700_psych_profiles(
 p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 match_ integer; visible_ boolean; roster_ jsonb:='[]'::jsonb; rows_ jsonb:='[]'::jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'room not found';END IF;
 match_:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 visible_:=(r.status='finished' OR p.public_role='analyste');
 -- Privacy boundary: players other than the Analyst cannot see any draft.
 IF NOT visible_ THEN
  RETURN jsonb_build_object('enabled',false,'published',false,
   'can_write',false,'cycle',r.cycle,'suspects','[]'::jsonb,
   'profiles','[]'::jsonb);
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'pseudo',pseudo)
  ORDER BY seat_index),'[]'::jsonb)
 INTO roster_ FROM public.igr_v4_players
 WHERE room_code=r.code AND public_role='suspect';
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'cycle',a.cycle,'suspect_id',a.payload->>'suspect_id',
   'suspect_pseudo',a.payload->>'suspect_pseudo',
   'answer_one',a.payload->>'answer_one',
   'answer_two',a.payload->>'answer_two') ORDER BY a.cycle,a.id),'[]'::jsonb)
 INTO rows_
 FROM public.igr_v4_actions a
 WHERE a.room_code=r.code AND a.action_type='igr_v700_psych_profile'
 AND coalesce((a.payload->>'match_no')::integer,1)=match_;
 RETURN jsonb_build_object('enabled',true,'published',r.status='finished',
   'can_write',p.public_role='analyste' AND r.status='playing' AND
     r.cycle BETWEEN 1 AND 3 AND r.phase NOT IN
      ('briefing','role_reading','pre_investigation','investigation_assembly',
       'cycle_debrief','trame','provisional_orals','provisional_lock',
       'defense','final_debrief','final_audience','final_suspect_defenses',
       'judge_speech','judge_integrity_vote','locking','reveal','closed'),
   'cycle',r.cycle,'match_no',match_,
   'suspects',roster_,'profiles',rows_,
   'canonical_evidence',false);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v700_psych_profiles(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v700_psych_profiles(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v700_submit_psych_profile(
 p_code text,p_player_token uuid,p_suspect_id uuid,
 p_answer_one text,p_answer_two text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 suspect_ public.igr_v4_players%rowtype; match_ integer;
 a1 text;a2 text;
BEGIN
 PERFORM igr_private.rate_limit('psych_profile_v700',
  coalesce(p_player_token::text,''),16,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role='analyste';
 IF NOT FOUND THEN RAISE EXCEPTION 'analyst role required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3 OR
  r.phase IN ('briefing','role_reading','pre_investigation',
   'investigation_assembly','cycle_debrief','trame','provisional_orals',
   'provisional_lock','defense','final_debrief','final_audience',
   'final_suspect_defenses','judge_speech','judge_integrity_vote',
   'locking','reveal','closed')
 THEN RAISE EXCEPTION 'profiling phase closed';END IF;
 SELECT * INTO suspect_ FROM public.igr_v4_players
 WHERE room_code=r.code AND id=p_suspect_id AND public_role='suspect';
 IF NOT FOUND THEN RAISE EXCEPTION 'suspect not in this game';END IF;
 match_:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a
  WHERE a.room_code=r.code AND a.player_id=p.id AND a.cycle=r.cycle
   AND a.action_type='igr_v700_psych_profile'
   AND coalesce((a.payload->>'match_no')::integer,1)=match_
   AND a.payload->>'suspect_id'=p_suspect_id::text)
 THEN RAISE EXCEPTION 'suspect profile already recorded this cycle';END IF;
 a1:=trim(coalesce(p_answer_one,''));
 a2:=trim(coalesce(p_answer_two,''));
 IF char_length(a1) NOT BETWEEN 12 AND 180
    OR char_length(a2) NOT BETWEEN 12 AND 180
    OR a1 ~ '[<>]' OR a2 ~ '[<>]'
 THEN RAISE EXCEPTION 'each answer must contain 12 to 180 plain text characters';END IF;
 IF a1 ~ '[\r\t]' OR a2 ~ '[\r\t]'
   OR char_length(a1)-char_length(replace(a1,E'\n',''))>1
   OR char_length(a2)-char_length(replace(a2,E'\n',''))>1
 THEN RAISE EXCEPTION 'each answer has a maximum of two explicit lines';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'igr_v700_psych_profile',
  jsonb_build_object('match_no',match_,'suspect_id',p_suspect_id::text,
   'suspect_pseudo',suspect_.pseudo,'answer_one',a1,'answer_two',a2,
   'canonical_evidence',false,'verified',false));
 -- Intentionally no event, room.state mutation or public broadcast.
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,
  'suspect_id',p_suspect_id::text);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v700_submit_psych_profile(text,uuid,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v700_submit_psych_profile(text,uuid,uuid,text,text)
 TO anon,authenticated;