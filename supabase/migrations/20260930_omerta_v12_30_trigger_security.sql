-- OMERTÀ v12.30: trigger-only hardening.
-- The casting function is invoked by PostgreSQL's room-status trigger and must not be exposed as an RPC.
revoke execute on function public.igr_omerta_cast_players_v1230() from public, anon, authenticated;
