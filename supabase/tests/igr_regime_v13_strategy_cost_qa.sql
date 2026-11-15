-- Strictly rollback-only scenario: a safe C1 contact protection
-- temporarily shields a fugitive but automatically exposes independent C2
-- evidence. No public evidence is leaked a cycle early.
DO $shield$
DECLARE suspect uuid;investigator uuid;judge uuid;
 response jsonb; before_state jsonb; after_state jsonb;
BEGIN
 SELECT player_token INTO suspect FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND internal_slot=2;
 SELECT player_token INTO investigator FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='enqueteur';
 SELECT player_token INTO judge FROM public.igr_v4_players
 WHERE room_code='QA13SAFE' AND public_role='juge';
 response:=public.igr_regime_v13_action('QA13SAFE',suspect,
  'fugitive_choice','qa-shield-safe-01',
  '{"option_id":"032A-interior_minister-C1-2"}'::jsonb);
 IF response->>'accepted'<>'true' THEN RAISE EXCEPTION 'shield action rejected';END IF;
 before_state:=public.igr_regime_v13_state('QA13SAFE',investigator);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(before_state->'public_evidence') e
   WHERE e->>'id'='032A-H23') THEN
   RAISE EXCEPTION 'C2 cost leaked into C1';END IF;
 UPDATE public.igr_v4_rooms SET cycle=2,phase='role_reading'
 WHERE code='QA13SAFE';
 after_state:=public.igr_regime_v13_state('QA13SAFE',investigator);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(after_state->'public_evidence') e
   WHERE e->>'id'='032A-H23') THEN
   RAISE EXCEPTION 'C1 safety cost not actually applied in C2';END IF;
 response:=public.igr_regime_v13_warrant('QA13SAFE',investigator,
  'qa-shield-warrant-02','interior_minister','apart',
  '["032A-H21","032A-H23"]'::jsonb);
 response:=public.igr_regime_v13_judge_review('QA13SAFE',judge,
  'qa-shield-review-02','qa-shield-warrant-02','allow');
 IF response->>'status'<>'captured' THEN
   RAISE EXCEPTION 'later exposure is not a real capture proof';END IF;
 RAISE NOTICE 'Contact shield C1, hidden cost, public C2 proof, judicial capture: PASS';
END $shield$;