-- Remove an interim parallel 029 experiment, superseded by the official
-- v117 leader cards and v118 leader-only safe messages. No live 029 is enabled.
drop trigger if exists igr_v118_cartel_leaders on public.igr_v4_rooms;
drop function if exists igr_private.igr_v118_cartel_leaders();
revoke all on function public.igr_v118_cartel_correspondence(text,uuid,uuid,text) from public,anon,authenticated;
drop function if exists public.igr_v118_cartel_correspondence(text,uuid,uuid,text);
