-- Editorial-only chain of custody for Santoro cycle 3.
-- The story sources are inserted directly into the private schema,
-- never into this public migration or frontend assets.
CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_v29_c3_review(
 scenario_id text NOT NULL CHECK(scenario_id IN('021','022','023','024','025')),
 variant_id text NOT NULL CHECK(variant_id IN('A','B','C')),
 sources jsonb NOT NULL CHECK(jsonb_typeof(sources)='array'),
 manuscript_md5 text NOT NULL,
 structurally_independent boolean NOT NULL DEFAULT false,
 review_status text NOT NULL DEFAULT 'review'
 CHECK(review_status IN('review','verified','rejected')),
 review_notes text,
 reviewed_by text, reviewed_at timestamptz,
 PRIMARY KEY(scenario_id,variant_id),
 CHECK((review_status='verified')=(reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
ALTER TABLE igr_private.igr_omerta_v29_c3_review ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE igr_private.igr_omerta_v29_c3_review FROM public,anon,authenticated;
