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
   RETURN p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id)
     OR (p_real_id !~ '(^|_)0[0-9]{2}[ABC]([-_]|$)' AND p_input=p_real_id);
 END IF;
 RETURN p_input=p_real_id OR
   p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_matches_input(text,text,text)
 FROM PUBLIC,anon,authenticated;

-- Recursively redact every variant-bearing technical identifier in an
-- authorized player's JSON response. Private scenario text remains intact.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_sanitize_json(
 p_code text,p_value jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 strict_mode boolean;
 val jsonb;entry record;out_value jsonb;
 encoded text;
BEGIN
 SELECT coalesce((m.play_state->>'strict_alias_only')::boolean,false)
 INTO strict_mode FROM igr_private.igr_regime_v13_rooms m
 WHERE m.room_code=upper(trim(p_code));
 IF NOT coalesce(strict_mode,false) OR p_value IS NULL THEN RETURN p_value;END IF;
 IF jsonb_typeof(p_value)='string' THEN
   encoded:=p_value#>>'{}';
   IF encoded ~ '(^|_)0[0-9]{2}[ABC]([-_]|$)' THEN
     RETURN to_jsonb(igr_private.igr_regime_v14_public_id(p_code,encoded));
   END IF;
   RETURN p_value;
 ELSIF jsonb_typeof(p_value)='array' THEN
   out_value:='[]'::jsonb;
   FOR val IN SELECT jsonb_array_elements(p_value) LOOP
      out_value:=out_value||jsonb_build_array(
        igr_private.igr_regime_v14_sanitize_json(p_code,val));
   END LOOP;
   RETURN out_value;
 ELSIF jsonb_typeof(p_value)='object' THEN
   out_value:='{}'::jsonb;
   FOR entry IN SELECT key,value FROM jsonb_each(p_value) LOOP
      out_value:=out_value||jsonb_build_object(entry.key,
       igr_private.igr_regime_v14_sanitize_json(p_code,entry.value));
   END LOOP;
   RETURN out_value;
 END IF;
 RETURN p_value;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_sanitize_json(text,jsonb)
 FROM PUBLIC,anon,authenticated;
