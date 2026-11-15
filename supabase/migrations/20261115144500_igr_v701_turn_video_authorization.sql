-- v701: TURN relay credentials require a live, authorized room capability.
-- This RPC returns a BOOLEAN only: no role cards, tokens, or private story data.
-- The Worker issues temporary TURN credentials only after TRUE.
BEGIN;
CREATE OR REPLACE FUNCTION public.igr_v701_turn_authorize(p_code text,p_player_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $body$
DECLARE
  player_ public.igr_v4_players%ROWTYPE;
  room_ public.igr_v4_rooms%ROWTYPE;
  cut_ timestamptz;
BEGIN
  -- Bound even invalid lookups. The limiter stores only a hash of this key.
  PERFORM igr_private.rate_limit('turn_authorize_global','global',600,60);
  IF p_player_token IS NULL OR coalesce(length(trim(p_code)),0) <> 5 THEN RETURN false; END IF;
  PERFORM igr_private.rate_limit('turn_authorize_token',p_player_token::text,12,60);
  SELECT * INTO player_ FROM public.igr_v4_players
   WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO room_ FROM public.igr_v4_rooms WHERE code=player_.room_code;
  IF NOT FOUND OR room_.status <> 'playing' OR room_.phase <> 'interrogation'
    THEN RETURN false; END IF;
  IF player_.public_role NOT IN ('enqueteur','analyste','procureur','juge','inspecteur','officier_liaison')
    THEN RETURN false; END IF;
  -- Only the investigator may obtain a relay before starting transmission.
  -- Observers must be present in an active session, not a lobby.
  IF player_.public_role = 'enqueteur' THEN
    RETURN NOT (coalesce(room_.state,'{}'::jsonb) ? 'lawyer_consultation_suspect');
  END IF;
  IF coalesce((room_.state->>'video_active')::boolean,false) IS NOT TRUE
     OR nullif(room_.state->>'video_session','') IS NULL
     OR room_.state ? 'lawyer_consultation_suspect'
  THEN RETURN false; END IF;
  BEGIN
    cut_ := nullif(room_.state->>'video_cut_until','')::timestamptz;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
    RETURN false;
  END;
  IF cut_ IS NOT NULL AND cut_ > clock_timestamp() THEN RETURN false; END IF;
  IF player_.public_role='officier_liaison' THEN
    IF room_.scenario_id NOT IN ('026','027','028') OR NOT EXISTS(
      SELECT 1 FROM public.igr_v4_actions a
       WHERE a.room_code=room_.code AND a.player_id=player_.id
         AND a.cycle=room_.cycle AND a.action_type='terror_v693_officer_join'
         AND a.payload->>'session_type'='interrogation'
         AND a.payload->>'session_started_at'=room_.phase_started_at::text
    ) THEN RETURN false; END IF;
  END IF;
  RETURN true;
END
$body$;
REVOKE ALL ON FUNCTION public.igr_v701_turn_authorize(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v701_turn_authorize(text,uuid) TO anon;
COMMENT ON FUNCTION public.igr_v701_turn_authorize(text,uuid) IS
'Restricted TURN authorization: active interrogation and authenticated player role; never returns secrets.';
COMMIT;
