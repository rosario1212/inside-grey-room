-- Prevent prior match decisions from affecting a new CARTEL 029 session.
create or replace function igr_private.igr_v126_029_reset_choices()
returns trigger language plpgsql security definer set search_path='' as $body$
begin
 if new.scenario_id<>'029' or old.status<>'lobby' or new.status<>'playing'
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 delete from public.igr_v4_actions
 where room_code=new.code and action_type in ('cartel029_protection','cartel029_position');
 return new;
end $body$;
revoke all on function igr_private.igr_v126_029_reset_choices() from public,anon,authenticated;
drop trigger if exists igr_v126_029_reset_choices on public.igr_v4_rooms;
create trigger igr_v126_029_reset_choices after update of status
on public.igr_v4_rooms for each row execute function igr_private.igr_v126_029_reset_choices();
