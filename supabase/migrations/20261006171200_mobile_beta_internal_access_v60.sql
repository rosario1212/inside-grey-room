-- Internal helpers are called by token-authenticated SECURITY DEFINER RPCs.
-- They must not be exposed as unauthenticated PostgREST entry points.
revoke execute on function public.igr_v4_tick(text) from public, anon, authenticated;
revoke execute on function public.igr_v35_room_mode(text) from public, anon, authenticated;
revoke execute on function public.igr_v35_room_seconds(text,text) from public, anon, authenticated;
revoke execute on function public.igr_dlc_has_access(uuid,text) from public, anon, authenticated;
grant execute on function public.igr_v4_tick(text), public.igr_v35_room_mode(text), public.igr_v35_room_seconds(text,text), public.igr_dlc_has_access(uuid,text) to service_role;
