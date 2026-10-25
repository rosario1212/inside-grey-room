-- Private snapshots. Narrative manuscripts are never stored in public GitHub.
CREATE TABLE IF NOT EXISTS igr_private.igr_v601_020_room_snapshots(room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,variant_id text NOT NULL CHECK (variant_id IN ('A','B','C')),pack jsonb NOT NULL,pinned_at timestamptz DEFAULT now());
ALTER TABLE igr_private.igr_v601_020_room_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v601_020_room_snapshots FROM public,anon,authenticated;
