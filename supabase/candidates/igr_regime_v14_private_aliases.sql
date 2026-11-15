-- LE RÉGIME v14 — secret per-room ID aliases.
-- Never deliver raw 032A/033B/034C asset IDs or refuge IDs to a live client.
-- Two different sessions with the same variant receive unrelated IDs.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_public_id(
 p_code text,p_raw text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT CASE WHEN p_raw IS NULL THEN NULL ELSE
  'ref-'||substr(md5(m.alias_salt::text||':'||p_raw),1,18) END
 FROM igr_private.igr_regime_v13_rooms m
 WHERE m.room_code=upper(trim(p_code))
$$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_public_id(text,text)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_visible_id(
 p_code text,p_raw text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m igr_private.igr_regime_v13_rooms%rowtype;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF coalesce((m.play_state->>'strict_alias_only')::boolean,false) THEN
  RETURN igr_private.igr_regime_v14_public_id(p_code,p_raw);
 END IF;
 RETURN p_raw;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_visible_id(text,text)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_matches_input(
 p_code text,p_input text,p_real_id text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m igr_private.igr_regime_v13_rooms%rowtype;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND OR p_input IS NULL OR p_real_id IS NULL THEN RETURN false;END IF;
 IF coalesce((m.play_state->>'strict_alias_only')::boolean,false) THEN
   RETURN p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id);
 END IF;
 RETURN p_input=p_real_id OR
   p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_matches_input(text,text,text)
 FROM PUBLIC,anon,authenticated;
