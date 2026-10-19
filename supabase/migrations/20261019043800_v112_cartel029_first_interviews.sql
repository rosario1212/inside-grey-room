-- 029 v112: private first-cycle testimony notices, and public parcel record.
-- Strictly inactive until v108 private release control passes.
create or replace function igr_private.igr_v112_029_interview_hooks()
returns trigger language plpgsql security definer set search_path='' as $body$
declare v_slot int;v_target uuid;v_match int;v_authoring jsonb;v_piece jsonb;
        v_pressure jsonb;v_branch text;v_profile text;
begin
 if new.scenario_id<>'029' or new.status<>'playing' or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 if old.phase<>'interrogation' or new.phase not in ('interrogation_select','cycle_debrief')
   or new.cycle<>1 then return new; end if;
 v_target:=nullif(old.state->>'current_target','')::uuid;
 if v_target is null then return new; end if;
 select p.internal_slot into v_slot from public.igr_v4_players p
  where p.id=v_target and p.room_code=new.code and p.public_role='suspect';
 if not found then return new; end if;
 v_match:=greatest(1,coalesce((new.state->>'match_no')::integer,1));
 select rv.branch,rv.profile into v_branch,v_profile
 from igr_private.igr_v108_029_room_variants rv where rv.room_code=new.code and rv.match_no=v_match;
 select authoring into v_authoring from igr_private.igr_v107_029_editorial_matrix
 where branch=v_branch and profile=v_profile and editorial_status='approved' and public_enabled;
 if v_authoring is null then raise exception 'missing 029 role authoring'; end if;
 if v_slot in (1,2) then
  select value into v_piece from jsonb_array_elements(v_authoring->'evidence') z(value)
   where value->>'id'=case v_slot when 1 then 'P04' else 'P05' end;
  if v_piece is not null then
   insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
   values(new.code,'trame','roles',array['enqueteur','analyste'],1,
    jsonb_build_object('title','ÉLÉMENT '||v_piece->>'id','text',v_piece->>'text',
      'source','témoignage','verified',false));
  end if;
 end if;
 if v_slot=1 then
   v_pressure:=v_authoring->'pressures'->'M02';
   if v_pressure is not null then
    insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
      values(new.code,'message','private',v_target,1,
       jsonb_build_object('title','MESSAGE PRIVÉ · LOS SALCEDO','text',v_pressure->>'text',
         'channel','private','verified',false,'threat_not_confirmed',true));
   end if;
 end if;
 return new;
end $body$;
revoke all on function igr_private.igr_v112_029_interview_hooks() from public,anon,authenticated;
drop trigger if exists igr_v112_029_interview_hooks on public.igr_v4_rooms;
create trigger igr_v112_029_interview_hooks after update of phase
on public.igr_v4_rooms for each row execute function igr_private.igr_v112_029_interview_hooks();

create or replace function igr_private.igr_v112_029_parcel()
returns trigger language plpgsql security definer set search_path='' as $body$
declare v_text text;
begin
 if new.scenario_id<>'029' or not (old.status='lobby' and new.status='playing')
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 values(new.code,'public_announcement','public',1,
 jsonb_build_object('title','PIÈCE P02 · LE COLIS','text',
 'La Grey Room reçoit une preuve médico-légale fictive liée au quatrième fugitif repris, accompagnée d’un message concernant les trois demandes de protection.',
 'source','constat officiel','verified',true,'public_broadcast',true));
 return new;
end $body$;
revoke all on function igr_private.igr_v112_029_parcel() from public,anon,authenticated;
drop trigger if exists igr_v112_029_parcel on public.igr_v4_rooms;
create trigger igr_v112_029_parcel after update of status
on public.igr_v4_rooms for each row execute function igr_private.igr_v112_029_parcel();
