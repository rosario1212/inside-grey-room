-- v833: a lightweight, player-authorized launch signal for independent phones.
-- This does not return roles, dossiers, player identities, host tokens or secrets.
CREATE OR REPLACE FUNCTION public.igr_v833_launch_probe(p_code text,p_player_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
 v_status text;
 v_phase text;
BEGIN
 SELECT r.status,r.phase INTO v_status,v_phase
 FROM public.igr_v4_rooms r
 JOIN public.igr_v4_players p ON p.room_code=r.code
 WHERE r.code=pg_catalog.upper(pg_catalog.btrim(p_code))
   AND p.player_token=p_player_token;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'unauthorized';
 END IF;
 RETURN pg_catalog.jsonb_build_object('status',v_status,'phase',v_phase);
END;
$function$;
REVOKE ALL ON FUNCTION public.igr_v833_launch_probe(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.igr_v833_launch_probe(text,uuid) TO anon,authenticated,service_role;
