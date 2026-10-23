-- 007 LE TESTAMENT GRIS: keep the investigation RPC closed until private editorial release.
-- The user-facing 007 scenario is NOT released by this migration.
-- A later, separately reviewed release migration may grant EXECUTE after 3/3 approved
-- private packs, successful end-to-end gameplay QA, and a passing release gate.
REVOKE EXECUTE ON FUNCTION public.igr_v282_007_investigate(text, uuid, text)
  FROM PUBLIC, anon, authenticated;
