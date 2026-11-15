-- LE RÉGIME v14 - sealed, actor-specific network locator.
-- This private helper is callable only by privileged Regime RPCs. It never
-- exposes which of the five publicly known refuges is currently occupied.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_active_track(
 p_code text,p_actor_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 m igr_private.igr_regime_v13_rooms%rowtype;
 actor1 text;actor2 text;choice1 text;choice2 text;
 t text;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 actor1:=m.private_pack->'private_cards'->0->>'actor_id';
 actor2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_actor_id NOT IN (actor1,actor2) THEN RETURN NULL;END IF;
 t:=m.play_state->'track_overrides'->>p_actor_id;
 IF t IS NOT NULL THEN RETURN t;END IF;
 choice1:=m.play_state->'alliance'->>actor1;
 choice2:=m.play_state->'alliance'->>actor2;
 IF choice1='together' AND choice2='together' THEN
    RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
      'together'->>'joint';
 END IF;
 RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
   'apart'->>(CASE WHEN p_actor_id=actor1 THEN 'first' ELSE 'second' END);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_active_track(text,text)
 FROM PUBLIC,anon,authenticated;

-- C1 leads are an immutable snapshot of the initial network. Later fugitive
-- relocations do not silently rewrite a previously published contact.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_base_track(
 p_code text,p_actor_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 m igr_private.igr_regime_v13_rooms%rowtype;
 actor1 text;actor2 text;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 actor1:=m.private_pack->'private_cards'->0->>'actor_id';
 actor2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_actor_id NOT IN (actor1,actor2) THEN RETURN NULL;END IF;
 IF m.play_state->'alliance'->>actor1='together'
    AND m.play_state->'alliance'->>actor2='together' THEN
    RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
      'together'->>'joint';
 END IF;
 RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
   'apart'->>(CASE WHEN p_actor_id=actor1 THEN 'first' ELSE 'second' END);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_base_track(text,text)
 FROM PUBLIC,anon,authenticated;
