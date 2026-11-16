-- Migration already applied to the production Supabase project at 2026-11-16 11:35:33 UTC.
-- Align repository migration history with the live schema.
-- These player_id indexes complement each table's (room_code, player_id)
-- primary key and cover the foreign key on player_id independently.
-- CREATE INDEX IF NOT EXISTS makes replay and local setup safe.
SET LOCAL lock_timeout = '3s';

CREATE INDEX IF NOT EXISTS igr_heritage_cendres_votes_player_fk_idx
  ON public.igr_heritage_online_cendres_votes(player_id);

CREATE INDEX IF NOT EXISTS igr_heritage_kuroi_votes_player_fk_idx
  ON public.igr_heritage_online_kuroi_votes(player_id);

CREATE INDEX IF NOT EXISTS igr_heritage_maitre_votes_player_fk_idx
  ON public.igr_heritage_online_maitre_votes(player_id);
