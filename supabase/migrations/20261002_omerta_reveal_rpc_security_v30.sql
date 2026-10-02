-- Inside Grey Room v30 — OMERTÀ reveal RPC hardening.
-- The reveal builder is an internal helper invoked by igr_v4_lock_final(),
-- which already authenticates the player token and validates the caller's role.
-- It must never be directly callable through the public Data API.
revoke execute on function public.igr_omerta_make_reveal(text) from public, anon, authenticated;
