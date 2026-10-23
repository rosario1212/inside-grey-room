-- Dossier 007 : protection de toutes les créations de salons,
-- y compris RPC directes et anciens clients qui ignorent le bouton désactivé.
create or replace function igr_private.igr_v293_007_room_release_guard()
returns trigger language plpgsql security invoker
set search_path=pg_catalog
as $$
begin
 if new.scenario_id='007' and not coalesce(
   (igr_private.igr_v281_007_release_status()->>'eligible')::boolean,
   false) then
  raise exception 'Dossier 007 indisponible : publication non validée'
    using errcode='P0001';
 end if;
 return new;
end;
$$;
revoke all on function igr_private.igr_v293_007_room_release_guard() from public,anon,authenticated;
drop trigger if exists igr_v293_007_room_release_guard on public.igr_v4_rooms;
create trigger igr_v293_007_room_release_guard
before insert or update of scenario_id on public.igr_v4_rooms
for each row execute function igr_private.igr_v293_007_room_release_guard();