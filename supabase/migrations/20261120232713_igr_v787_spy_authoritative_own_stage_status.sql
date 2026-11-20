-- Authoritative, self-only status for the two-stage espion mission.
-- Never return a route, chosen answer, correctness, evidence, or any other player's data.
-- A fresh room start invalidates old signals via v786's replay cleanup.
CREATE OR REPLACE FUNCTION public.igr_v787_spy_status(p_code text, p_player_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  actor_ public.igr_v4_players%rowtype;
  room_ public.igr_v4_rooms%rowtype;
  match_ integer;
BEGIN
  SELECT * INTO actor_
  FROM public.igr_v4_players
  WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;

  IF actor_.id IS NULL OR actor_.secret_role IS DISTINCT FROM 'espion' THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501';
  END IF;

  SELECT * INTO room_ FROM public.igr_v4_rooms
  WHERE code=actor_.room_code;
  IF room_.code IS NULL OR room_.status NOT IN ('playing','finished') THEN
    RAISE EXCEPTION 'spy mission unavailable' USING ERRCODE='42501';
  END IF;

  match_:=greatest(1,coalesce((room_.state->>'match_no')::integer,1));
  IF NOT EXISTS (
    SELECT 1 FROM igr_private.igr_v630_spy_assignments a
    WHERE a.room_code=room_.code AND a.player_id=actor_.id
      AND a.match_no=match_
  ) THEN
    RAISE EXCEPTION 'spy mission unavailable' USING ERRCODE='42501';
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'match_no',match_,
    'early_sealed',EXISTS (
      SELECT 1 FROM igr_private.igr_v630_spy_signals s
      WHERE s.room_code=room_.code AND s.player_id=actor_.id AND s.cycle IN (1,2)
    ),
    'final_sealed',EXISTS (
      SELECT 1 FROM igr_private.igr_v630_spy_signals s
      WHERE s.room_code=room_.code AND s.player_id=actor_.id AND s.cycle=3
    )
  );
END
$function$;
-- Accessible to game clients only with an unguessable player-token check.
REVOKE ALL ON FUNCTION public.igr_v787_spy_status(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v787_spy_status(text,uuid) TO anon, authenticated;
