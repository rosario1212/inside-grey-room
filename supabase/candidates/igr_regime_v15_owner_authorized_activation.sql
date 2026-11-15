-- LE RÉGIME v15: owner-directed activation. Run only AFTER v13/v14 functions
-- are installed, current web client deployed, and server QA has passed.
-- Owner authorized publication in chat; no human playtest is being claimed.
DO $preflight$
BEGIN
 IF to_regclass('igr_private.igr_regime_v13_release') IS NULL
   OR to_regclass('igr_private.igr_regime_v13_rooms') IS NULL THEN
   RAISE EXCEPTION 'Regime v13 server must be installed before activation';
 END IF;
 IF (SELECT count(*) FROM igr_private.igr_v99_variant_manuscripts
     WHERE scenario_id IN ('032','033','034'))<>9 THEN
   RAISE EXCEPTION 'exactly nine sealed manuscripts required';
 END IF;
 IF (SELECT count(*) FROM igr_private.igr_v99_variant_manuscripts
     WHERE scenario_id IN ('032','033','034') AND
       jsonb_array_length(manuscript#>'{regime_vnext,private_cards}')=3
       AND jsonb_array_length(manuscript#>'{regime_vnext,acts}')=4
       AND jsonb_array_length(manuscript#>'{regime_vnext,scene_beats}')=3)<>9 THEN
   RAISE EXCEPTION 'incomplete private manuscripts, release rejected';
 END IF;
 IF (SELECT count(*) FROM igr_private.igr_v99_variant_manuscripts
     WHERE scenario_id='032'
       AND manuscript#>>'{regime_vnext,public_briefing}' LIKE
       '%Les archives recensent 14 600 disparitions liées%')<>3 THEN
   RAISE EXCEPTION 'Vahran briefings changed unexpectedly: review required';
 END IF;
END $preflight$;

CREATE TABLE IF NOT EXISTS igr_private.igr_regime_v15_pre_release_backup (
 scenario_id text NOT NULL,
 variant_id text NOT NULL,
 editorial_status text,
 approved_by text,
 approved_at timestamptz,
 content_md5 text,
 manuscript jsonb NOT NULL,
 saved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(scenario_id,variant_id)
);
ALTER TABLE igr_private.igr_regime_v15_pre_release_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_regime_v15_pre_release_backup FROM PUBLIC,anon,authenticated;
INSERT INTO igr_private.igr_regime_v15_pre_release_backup
 (scenario_id,variant_id,editorial_status,approved_by,approved_at,content_md5,manuscript)
SELECT scenario_id,variant_id,editorial_status,approved_by,approved_at,content_md5,manuscript
FROM igr_private.igr_v99_variant_manuscripts
WHERE scenario_id IN ('032','033','034')
ON CONFLICT (scenario_id,variant_id) DO NOTHING;

WITH fixed AS (
 SELECT scenario_id,variant_id,
 CASE WHEN scenario_id='032' THEN
  jsonb_set(manuscript,'{regime_vnext,public_briefing}',
   to_jsonb(replace(manuscript#>>'{regime_vnext,public_briefing}',
    'Les archives recensent 14 600 disparitions liées à l''appareil pénitentiaire.',
    'Les registres de Vahran recensent 14 600 personnes détenues au fil des années ; le nombre exact de morts et de disparus reste à établir.')),true)
 ELSE manuscript END AS normalized
 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id IN ('032','033','034')
)
UPDATE igr_private.igr_v99_variant_manuscripts v
SET editorial_status='ready',
    approved_by='OWNER_EXPLICIT_RELEASE_REQUEST_20261115',
    approved_at=now(),
    manuscript=jsonb_set(
      jsonb_set(
       jsonb_set(
        jsonb_set(fixed.normalized,
          '{regime_vnext,status}','"ready"'::jsonb,true),
         '{regime_vnext,author_release_authorized}','true'::jsonb,true),
        '{regime_vnext,release_flags}',
        '["Propriétaire : publication expressément autorisée","Aucun playtest humain certifié à cette date"]'::jsonb,true),
       '{status}','"ready"'::jsonb,true)
FROM fixed WHERE v.scenario_id=fixed.scenario_id AND v.variant_id=fixed.variant_id;

UPDATE igr_private.igr_regime_v13_release
SET enabled=true,
    approved_by='OWNER_EXPLICIT_RELEASE_REQUEST_20261115',
    approved_at=now(),
    updated_at=now()
WHERE release_key='regime';

DO $verify$
BEGIN
 IF NOT igr_private.igr_regime_v13_release_eligible() THEN
   RAISE EXCEPTION 'Regime did not pass final release gate';
 END IF;
 IF (SELECT count(*) FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id IN ('032','033','034')
 AND manuscript#>>'{regime_vnext,author_release_authorized}'='true'
 AND manuscript#>>'{regime_vnext,human_review_approved}'='false')<>9 THEN
   RAISE EXCEPTION 'owner authority or human-playtest transparency mismatch';
 END IF;
 IF EXISTS(SELECT 1 FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='032' AND manuscript#>>'{regime_vnext,public_briefing}'
 LIKE '%14 600 disparitions%') THEN
   RAISE EXCEPTION 'Vahran numerical description inconsistency remains';
 END IF;
END $verify$;
