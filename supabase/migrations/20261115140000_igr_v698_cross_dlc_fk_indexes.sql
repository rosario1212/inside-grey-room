-- Cross-DLC performance correction v698.
-- Foreign-key lookups for active live systems; exclude legacy v2/v3 and
-- small editorial backup tables to avoid needless index bloat.
-- Only additive indexes: no row data, secrets, policies or role rules modified.
BEGIN;
CREATE INDEX IF NOT EXISTS igr_v698_casino_owner_idx ON igr_casino_private.casino_rooms (owner_profile_id);
CREATE INDEX IF NOT EXISTS igr_v698_cartel_nominee_idx ON igr_private.igr_v171_031_matches (nominee);
CREATE INDEX IF NOT EXISTS igr_v698_omerta_spy_player_idx ON igr_private.igr_v630_spy_assignments (player_id);
CREATE INDEX IF NOT EXISTS igr_v698_dlc_ent_granter_idx ON public.igr_dlc_entitlements (granted_by);
CREATE INDEX IF NOT EXISTS igr_v698_dlc_inv_creator_idx ON public.igr_dlc_invites (created_by);
CREATE INDEX IF NOT EXISTS igr_v698_omerta_ent_granter_idx ON public.igr_omerta_entitlements (granted_by);
CREATE INDEX IF NOT EXISTS igr_v698_omerta_inv_creator_idx ON public.igr_omerta_invites (created_by);
CREATE INDEX IF NOT EXISTS igr_v698_omerta_campaign_fk_idx ON public.igr_omerta_room_campaigns (campaign_id);
CREATE INDEX IF NOT EXISTS igr_v698_cartel029_editor_idx ON public.igr_v107_029_reports (editor_player);
CREATE INDEX IF NOT EXISTS igr_v698_law_rep_client_idx ON public.igr_v43_lawyer_representations (client_id);
CREATE INDEX IF NOT EXISTS igr_v698_law_rep_lawyer_idx ON public.igr_v43_lawyer_representations (lawyer_id);
CREATE INDEX IF NOT EXISTS igr_v698_law_req_suspect_idx ON public.igr_v43_lawyer_requests (suspect_id);
CREATE INDEX IF NOT EXISTS igr_v698_law_req_decider_idx ON public.igr_v43_lawyer_requests (decided_by);
CREATE INDEX IF NOT EXISTS igr_v698_judge_req_judge_idx ON public.igr_v44_judge_requests (judge_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_req_requester_idx ON public.igr_v44_judge_requests (requester_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_review_analyst_idx ON public.igr_v44_judge_reviews (analyst_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_review_investigator_idx ON public.igr_v44_judge_reviews (investigator_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_review_judge_idx ON public.igr_v44_judge_reviews (judge_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_summon_judge_idx ON public.igr_v44_judge_summons (judge_id);
CREATE INDEX IF NOT EXISTS igr_v698_judge_summon_target_idx ON public.igr_v44_judge_summons (target_id);
CREATE INDEX IF NOT EXISTS igr_v698_consult_lawyer_idx ON public.igr_v44_lawyer_consultations (lawyer_id);
CREATE INDEX IF NOT EXISTS igr_v698_consult_suspect_idx ON public.igr_v44_lawyer_consultations (suspect_id);
CREATE INDEX IF NOT EXISTS igr_v698_notes_author_idx ON public.igr_v87_investigator_notes (author_id);
CREATE INDEX IF NOT EXISTS igr_v698_notes_suspect_idx ON public.igr_v87_investigator_notes (suspect_id);
DO $verify$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='igr_casino_private' AND tablename='casino_rooms' AND indexname='igr_v698_casino_owner_idx' AND indexdef LIKE '%(owner_profile_id)%') THEN RAISE EXCEPTION 'missing v698 covering index casino_owner'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='igr_private' AND tablename='igr_v171_031_matches' AND indexname='igr_v698_cartel_nominee_idx' AND indexdef LIKE '%(nominee)%') THEN RAISE EXCEPTION 'missing v698 covering index cartel_nominee'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='igr_private' AND tablename='igr_v630_spy_assignments' AND indexname='igr_v698_omerta_spy_player_idx' AND indexdef LIKE '%(player_id)%') THEN RAISE EXCEPTION 'missing v698 covering index omerta_spy_player'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_dlc_entitlements' AND indexname='igr_v698_dlc_ent_granter_idx' AND indexdef LIKE '%(granted_by)%') THEN RAISE EXCEPTION 'missing v698 covering index dlc_ent_granter'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_dlc_invites' AND indexname='igr_v698_dlc_inv_creator_idx' AND indexdef LIKE '%(created_by)%') THEN RAISE EXCEPTION 'missing v698 covering index dlc_inv_creator'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_omerta_entitlements' AND indexname='igr_v698_omerta_ent_granter_idx' AND indexdef LIKE '%(granted_by)%') THEN RAISE EXCEPTION 'missing v698 covering index omerta_ent_granter'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_omerta_invites' AND indexname='igr_v698_omerta_inv_creator_idx' AND indexdef LIKE '%(created_by)%') THEN RAISE EXCEPTION 'missing v698 covering index omerta_inv_creator'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_omerta_room_campaigns' AND indexname='igr_v698_omerta_campaign_fk_idx' AND indexdef LIKE '%(campaign_id)%') THEN RAISE EXCEPTION 'missing v698 covering index omerta_campaign_fk'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v107_029_reports' AND indexname='igr_v698_cartel029_editor_idx' AND indexdef LIKE '%(editor_player)%') THEN RAISE EXCEPTION 'missing v698 covering index cartel029_editor'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v43_lawyer_representations' AND indexname='igr_v698_law_rep_client_idx' AND indexdef LIKE '%(client_id)%') THEN RAISE EXCEPTION 'missing v698 covering index law_rep_client'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v43_lawyer_representations' AND indexname='igr_v698_law_rep_lawyer_idx' AND indexdef LIKE '%(lawyer_id)%') THEN RAISE EXCEPTION 'missing v698 covering index law_rep_lawyer'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v43_lawyer_requests' AND indexname='igr_v698_law_req_suspect_idx' AND indexdef LIKE '%(suspect_id)%') THEN RAISE EXCEPTION 'missing v698 covering index law_req_suspect'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v43_lawyer_requests' AND indexname='igr_v698_law_req_decider_idx' AND indexdef LIKE '%(decided_by)%') THEN RAISE EXCEPTION 'missing v698 covering index law_req_decider'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_requests' AND indexname='igr_v698_judge_req_judge_idx' AND indexdef LIKE '%(judge_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_req_judge'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_requests' AND indexname='igr_v698_judge_req_requester_idx' AND indexdef LIKE '%(requester_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_req_requester'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_reviews' AND indexname='igr_v698_judge_review_analyst_idx' AND indexdef LIKE '%(analyst_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_review_analyst'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_reviews' AND indexname='igr_v698_judge_review_investigator_idx' AND indexdef LIKE '%(investigator_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_review_investigator'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_reviews' AND indexname='igr_v698_judge_review_judge_idx' AND indexdef LIKE '%(judge_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_review_judge'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_summons' AND indexname='igr_v698_judge_summon_judge_idx' AND indexdef LIKE '%(judge_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_summon_judge'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_judge_summons' AND indexname='igr_v698_judge_summon_target_idx' AND indexdef LIKE '%(target_id)%') THEN RAISE EXCEPTION 'missing v698 covering index judge_summon_target'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_lawyer_consultations' AND indexname='igr_v698_consult_lawyer_idx' AND indexdef LIKE '%(lawyer_id)%') THEN RAISE EXCEPTION 'missing v698 covering index consult_lawyer'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v44_lawyer_consultations' AND indexname='igr_v698_consult_suspect_idx' AND indexdef LIKE '%(suspect_id)%') THEN RAISE EXCEPTION 'missing v698 covering index consult_suspect'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v87_investigator_notes' AND indexname='igr_v698_notes_author_idx' AND indexdef LIKE '%(author_id)%') THEN RAISE EXCEPTION 'missing v698 covering index notes_author'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='igr_v87_investigator_notes' AND indexname='igr_v698_notes_suspect_idx' AND indexdef LIKE '%(suspect_id)%') THEN RAISE EXCEPTION 'missing v698 covering index notes_suspect'; END IF;
END $verify$;
COMMIT;
