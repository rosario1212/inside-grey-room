-- IGR 001 weighted report: 60% responsibility judgements, 40% reconstructive axes.
-- Preserves all existing opt-in / legacy guards and server-side room-pinned truth.
CREATE OR REPLACE FUNCTION igr_private.igr_v639_001_report_score(p_room text, p_reveal jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  canonical jsonb;
  submitted jsonb;
  camp jsonb;
  score_exact integer;
  score_total integer;
  rec_exact integer:=0;
  rec_total integer:=3;
  level_exact integer;
  level_total integer;
  adjust_points integer;
  result_pct integer;
  responsibility_pct integer;
  reconstruction_pct integer;
  canonical_intent text;
  stated_intent text;
BEGIN
  SELECT (igr_private.igr_v181_001_pinned_game_pack(r.code)->'truth'->'reconstruction_001')
    INTO canonical
    FROM public.igr_v4_rooms r
    WHERE r.code=upper(trim(p_room)) AND r.scenario_id='001';
  IF canonical IS NULL OR coalesce(canonical->>'gesture','') NOT IN
    ('s1_intentional','s2_intentional','s3_accident') THEN
    RETURN p_reveal; -- Preserve historical/non-pinned rooms.
  END IF;

  SELECT a.payload->'reconstruction_001' INTO submitted
    FROM public.igr_v4_actions a
    JOIN public.igr_v4_players p ON p.id=a.player_id
    WHERE a.room_code=upper(trim(p_room))
      AND a.action_type='final_lock'
      AND p.public_role IN ('enqueteur','analyste')
    ORDER BY CASE WHEN p.public_role='enqueteur' THEN 0 ELSE 1 END,a.id DESC
    LIMIT 1;
  IF submitted IS NULL OR jsonb_typeof(submitted)<>'object'
     OR coalesce(submitted->>'intent','') NOT IN ('voluntary_act','involuntary_act','undetermined') THEN
    RETURN p_reveal; -- Old/ongoing rooms: do not change an existing final score.
  END IF;

  camp:=coalesce(p_reveal->'camp_investigation','{}'::jsonb);
  level_exact:=coalesce((camp->>'exact')::integer,0);
  level_total:=coalesce((camp->>'total')::integer,0);
  IF level_total=0 THEN RETURN p_reveal; END IF;

  rec_exact:=(CASE WHEN submitted->>'moment'=canonical->>'moment' THEN 1 ELSE 0 END)
            +(CASE WHEN submitted->>'gesture'=canonical->>'gesture' THEN 1 ELSE 0 END)
            +(CASE WHEN submitted->>'reframe'=canonical->>'reframe' THEN 1 ELSE 0 END);
  canonical_intent:=CASE WHEN canonical->>'gesture'='s3_accident'
    THEN 'involuntary_act' ELSE 'voluntary_act' END;
  stated_intent:=submitted->>'intent';
  rec_total:=4;
  rec_exact:=rec_exact+CASE WHEN stated_intent=canonical_intent THEN 1 ELSE 0 END;

  score_exact:=level_exact+rec_exact;
  score_total:=level_total+rec_total;
  responsibility_pct:=round(100.0*level_exact/level_total)::integer;
  reconstruction_pct:=round(100.0*rec_exact/rec_total)::integer;
  -- Weighted dossier report: three suspect judgements occupy 60%, four fact axes 40%.
  -- The intention question therefore accounts for 10% of the full report.
  result_pct:=round(60.0*level_exact/level_total+40.0*rec_exact/rec_total)::integer;
  adjust_points:=coalesce((camp->>'score_adjustment')::integer,0);
  camp:=camp||jsonb_build_object(
    'responsibility_score_percent',responsibility_pct,
    'reconstruction_score_percent',reconstruction_pct,
    'responsibility_weight_percent',60,
    'reconstruction_weight_percent',40,
    'reconstruction_score_exact',rec_exact,
    'reconstruction_score_total',rec_total,
    'reconstruction_intent_correct',CASE WHEN rec_total=4 THEN (stated_intent=canonical_intent) ELSE NULL END,
    'report_score_exact',score_exact,
    'report_score_total',score_total,
    'report_score_percent',result_pct,
    'base_score_percent',result_pct,
    'score_percent',greatest(0,least(100,result_pct+adjust_points))
  );
  RETURN jsonb_set(p_reveal,'{camp_investigation}',camp,true);
END
$function$
;
REVOKE ALL ON FUNCTION igr_private.igr_v639_001_report_score(text,jsonb) FROM PUBLIC;
