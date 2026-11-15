-- v699 · Analyst's progressive psychological responsibility assessment.
-- A private and revisable *across cycles* hypothesis, never canonical evidence.
-- One immutable assessment per Analyst and cycle; no effect on sealed truth or verdict.
-- Avoid clinical diagnosis: judgments must be based on case facts and reasoning.

CREATE OR REPLACE FUNCTION public.igr_v699_analyst_profile_state(
 p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE who public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
 roster jsonb; history_ jsonb; submitted_ boolean; match_ integer;
 allowed_ boolean;
BEGIN
 SELECT * INTO who FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role IN ('analyste','enqueteur');
 IF NOT FOUND THEN RAISE EXCEPTION 'analyst or investigator role required'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=who.room_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'room not found'; END IF;
 match_:=greatest(1,coalesce((r.state->>'match_no')::integer,1));

 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo)
     ORDER BY seat_index),'[]'::jsonb)
 INTO roster FROM public.igr_v4_players
 WHERE room_code=r.code AND public_role='suspect';

 -- This private RPC is never added to public events or the shared room state.
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'cycle',a.cycle,'author',author.pseudo,
   'levels',a.payload->'levels','focus',a.payload->>'focus',
   'note',a.payload->>'note','confidence',(a.payload->>'confidence')::integer,
   'created_at',a.created_at) ORDER BY a.cycle,a.created_at),'[]'::jsonb)
 INTO history_
 FROM public.igr_v4_actions a
 JOIN public.igr_v4_players author ON author.id=a.player_id AND author.room_code=a.room_code
 WHERE a.room_code=r.code AND a.action_type='igr_v699_analyst_profile'
 AND author.public_role='analyste'
 AND coalesce((a.payload->>'match_no')::integer,1)=match_;

 SELECT EXISTS(SELECT 1 FROM public.igr_v4_actions a
 WHERE a.room_code=r.code AND a.player_id=who.id
 AND a.cycle=r.cycle AND a.action_type='igr_v699_analyst_profile'
 AND coalesce((a.payload->>'match_no')::integer,1)=match_)
 INTO submitted_;

 allowed_:=who.public_role='analyste' AND r.status='playing'
  AND r.cycle BETWEEN 1 AND 3
  AND r.phase NOT IN ('briefing','role_reading','pre_investigation',
   'investigation_assembly','cycle_debrief','trame','provisional_orals',
   'provisional_lock','defense','final_debrief','final_audience',
   'final_suspect_defenses','judge_speech','judge_integrity_vote',
   'locking','reveal','closed')
  AND jsonb_array_length(roster)>0 AND NOT submitted_;

 RETURN jsonb_build_object('enabled',true,'role',who.public_role,
  'cycle',r.cycle,'match_no',match_,'phase',r.phase,'can_submit',coalesce(allowed_,false),
  'submitted_this_cycle',submitted_,'suspects',roster,'history',history_,
  'readers','analyste,enqueteur','canonical_evidence',false);
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v699_analyst_profile_state(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v699_analyst_profile_state(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v699_analyst_profile_submit(
 p_code text,p_player_token uuid,p_levels jsonb,p_focus text,p_note text,p_confidence integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE who public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 levels_ jsonb;note_ text;focus_ text;match_ integer;
BEGIN
 PERFORM igr_private.rate_limit('analyst_profile_v699',
   coalesce(p_player_token::text,''),6,60);
 SELECT * INTO who FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token
 AND public_role='analyste';
 IF NOT FOUND THEN RAISE EXCEPTION 'analyst role required'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=who.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
  OR r.phase IN ('briefing','role_reading','pre_investigation',
   'investigation_assembly','cycle_debrief','trame','provisional_orals',
   'provisional_lock','defense','final_debrief','final_audience',
   'final_suspect_defenses','judge_speech','judge_integrity_vote',
   'locking','reveal','closed')
 THEN RAISE EXCEPTION 'assessment phase closed'; END IF;
 match_:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code
  AND a.player_id=who.id AND a.cycle=r.cycle
  AND a.action_type='igr_v699_analyst_profile'
  AND coalesce((a.payload->>'match_no')::integer,1)=match_)
 THEN RAISE EXCEPTION 'assessment already submitted this cycle'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.igr_v4_players
  WHERE room_code=r.code AND public_role='suspect')
 THEN RAISE EXCEPTION 'no suspects to assess'; END IF;

 -- The same 0/1/2 scale and complete roster contract as the final verdict.
 levels_:=public.igr_v52_validate_levels(r.code,p_levels);
 focus_:=lower(trim(coalesce(p_focus,'')));
 IF focus_ NOT IN ('connaissance','intention','contrainte','recit','dissimulation')
 THEN RAISE EXCEPTION 'invalid reasoning axis'; END IF;
 IF p_confidence IS NULL OR p_confidence NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'invalid confidence'; END IF;
 note_:=regexp_replace(trim(coalesce(p_note,'')),'[<>&]','','g');
 IF char_length(note_) NOT BETWEEN 45 AND 320
 THEN RAISE EXCEPTION 'reasoned explanation must contain 45 to 320 characters'; END IF;

 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,who.id,r.cycle,'igr_v699_analyst_profile',
   jsonb_build_object('match_no',match_,'levels',levels_,'focus',focus_,
    'note',note_,'confidence',p_confidence,'verified',false,
    'canonical_evidence',false));
 -- No broadcast: only the Analyst and Investigator may read this hypothesis
 -- through igr_v699_analyst_profile_state; all other public roles are denied.
 RETURN jsonb_build_object('ok',true,'cycle',r.cycle,
  'match_no',match_,'notice','Avis analytique transmis à l Enquêteur. Hypothèse non vérifiée.');
END;
$body$;
REVOKE ALL ON FUNCTION public.igr_v699_analyst_profile_submit(text,uuid,jsonb,text,text,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v699_analyst_profile_submit(text,uuid,jsonb,text,text,integer)
 TO anon,authenticated;

DO $check$
BEGIN
 IF has_function_privilege('anon',
  'igr_private.igr_v694_commit(text,uuid,integer,integer,text,boolean)','EXECUTE')
 THEN RAISE EXCEPTION 'private military calculations exposed';END IF;
END $check$;