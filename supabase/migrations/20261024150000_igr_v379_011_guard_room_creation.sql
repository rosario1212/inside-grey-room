create or replace function igr_private.igr_v379_011_room_release_guard()
returns trigger language plpgsql security invoker set search_path=pg_catalog
as $f$
begin
 if new.scenario_id='011'
   and coalesce((igr_private.igr_v371_011_release_status()->>'eligible')::boolean,false) is not true then
   raise exception 'Dossier 011 non publié' using errcode='P0001';
 end if;
 return new;
end;
$f$;
revoke all on function igr_private.igr_v379_011_room_release_guard() from public,anon,authenticated;
drop trigger if exists igr_v379_011_room_release_guard on public.igr_v4_rooms;
create trigger igr_v379_011_room_release_guard
before insert or update of scenario_id on public.igr_v4_rooms
for each row execute function igr_private.igr_v379_011_room_release_guard();