CREATE OR REPLACE FUNCTION igr_private.igr_v601_020_pinned_pack(p_room text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
 select pack from igr_private.igr_v601_020_room_snapshots
 where room_code=upper(trim(p_room))
$function$
