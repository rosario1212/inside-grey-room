-- CARTEL 029 v143 · give witnesses 2/3 their cycle-1 threats and
-- witnesses 1/2 their cycle-3 threats without leaking another role's message.
-- M01/M05/M08 are already public in igr_v107_029_public_pressure.
-- M02 and the conditional witness-4 message already exist; never double-send.
create or replace function igr_private.igr_v143_029_personal_threats()
returns trigger language plpgsql security definer set search_path='' as $body$
declare v_slot integer; v_target uuid; v_match integer; v_branch text; v_profile text;
        v_pressures jsonb; v_id text; v_msg jsonb;
begin
 if new.scenario_id<>'029' or new.status<>'playing'
    or not coalesce((new.state->>'cartel029_ready')::boolean,false)
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 v_id:=null;
 if old.phase='interrogation' and new.phase in ('interrogation_select','cycle_debrief')
    and new.cycle=1 then
   v_target:=nullif(old.state->>'current_target','')::uuid;
   select internal_slot into v_slot from public.igr_v4_players
    where id=v_target and room_code=new.code and public_role='suspect';
   if v_slot=2 then v_id:='M03'; elsif v_slot=3 then v_id:='M04'; end if;
 elsif old.cycle is distinct from new.cycle and new.cycle=3 then
   -- Send separately to each matching witness, not as a general broadcast.
   null;
 else return new; end if;
 v_match:=greatest(1,coalesce((new.state->>'match_no')::int,1));
 select branch,profile into v_branch,v_profile
 from igr_private.igr_v108_029_room_variants
 where room_code=new.code and match_no=v_match;
 if not found then raise exception '029 variant not pinned for private messages'; end if;
 select authoring->'pressures' into v_pressures
 from igr_private.igr_v107_029_editorial_matrix
 where branch=v_branch and profile=v_profile and editorial_status='approved' and public_enabled;
 if v_pressures is null then raise exception '029 pressure manuscript unavailable'; end if;
 if v_id is not null then
   v_msg:=v_pressures->v_id;
   if v_msg is null or length(trim(coalesce(v_msg->>'text','')))=0 then
      raise exception 'missing 029 message %',v_id; end if;
   if not exists(select 1 from public.igr_v4_events
       where room_code=new.code and event_type='message'
        and target_player_id=v_target and payload->>'pressure_id'=v_id) then
     insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
     values(new.code,'message','private',v_target,new.cycle,
       jsonb_build_object('title','MESSAGE PRIVÉ · LOS SALCEDO','text',v_msg->>'text',
        'pressure_id',v_id,'channel','private','source','cartel',
        'verified',false,'threat_not_confirmed',true));
   end if;
 end if;
 if old.cycle is distinct from new.cycle and new.cycle=3 then
   for v_slot in 1..2 loop
     v_id:=case v_slot when 1 then 'M09' else 'M10' end;
     select id into v_target from public.igr_v4_players
        where room_code=new.code and public_role='suspect' and internal_slot=v_slot;
     v_msg:=v_pressures->v_id;
     if v_target is null or v_msg is null or length(trim(coalesce(v_msg->>'text','')))=0 then
       raise exception 'missing 029 cycle-3 private pressure %',v_id; end if;
     if not exists(select 1 from public.igr_v4_events
       where room_code=new.code and event_type='message'
         and target_player_id=v_target and payload->>'pressure_id'=v_id) then
       insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
       values(new.code,'message','private',v_target,3,
          jsonb_build_object('title','MESSAGE PRIVÉ · LOS SALCEDO','text',v_msg->>'text',
           'pressure_id',v_id,'channel','private','source','cartel',
           'verified',false,'threat_not_confirmed',true));
     end if;
   end loop;
 end if;
 return new;
end $body$;
revoke all on function igr_private.igr_v143_029_personal_threats() from public,anon,authenticated;
drop trigger if exists igr_v143_029_personal_threats on public.igr_v4_rooms;
create trigger igr_v143_029_personal_threats
after update of phase,cycle on public.igr_v4_rooms for each row
execute function igr_private.igr_v143_029_personal_threats();
