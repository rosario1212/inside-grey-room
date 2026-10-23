-- Scenario 007: Boolean release discovery (no private story data leaves the server).
create or replace function public.igr_v291_007_catalog_enabled()
returns boolean language sql stable security definer
set search_path=pg_catalog
as $igr$
 select coalesce((igr_private.igr_v281_007_release_status()->>'eligible')::boolean,false)
$igr$;
revoke all on function public.igr_v291_007_catalog_enabled() from public,anon,authenticated;
grant execute on function public.igr_v291_007_catalog_enabled() to anon,authenticated;

-- Scenario 007: narrow investigation entry point, role/token validation
-- is still enforced by the original igr_v282_007_investigate implementation.
create or replace function public.igr_v292_007_investigate(
 p_code text,p_player_token uuid,p_choice text
)
returns jsonb language plpgsql volatile security definer
set search_path=pg_catalog
as $igr$
begin
 if not coalesce((igr_private.igr_v281_007_release_status()->>'eligible')::boolean,false) then
  raise exception 'Dossier 007 en préparation' using errcode='P0001';
 end if;
 return public.igr_v282_007_investigate(p_code,p_player_token,p_choice);
end;
$igr$;
revoke all on function public.igr_v292_007_investigate(text,uuid,text) from public,anon,authenticated;
grant execute on function public.igr_v292_007_investigate(text,uuid,text) to anon,authenticated;
revoke all on function public.igr_v282_007_investigate(text,uuid,text) from public,anon,authenticated;
