-- 029 v111: private evidence and profile-targeted pressure, only after v108 approval.
-- This migration contains NO plot truths or private messages; reads private authoring data.
create or replace function igr_private.igr_v111_029_release()
returns trigger language plpgsql security definer set search_path='' as $body$
declare v_combo igr_private.igr_v107_029_editorial_matrix%rowtype;
 v_branch text;v_profile text;v_match int;v_evidence jsonb;v_exhibit jsonb;
 v_text text;v_id text;v_to uuid;v_msg jsonb;v_msg_key text;v_public boolean;
begin
 if new.scenario_id<>'029' or new.status<>'playing'
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 if new.cycle not between 1 and 3 or old.cycle is not distinct from new.cycle then return new; end if;
 v_match:=greatest(1,coalesce((new.state->>'match_no')::integer,1));
 select rv.branch,rv.profile into v_branch,v_profile
 from igr_private.igr_v108_029_room_variants rv
 where rv.room_code=new.code and rv.match_no=v_match;
 if not found then raise exception '029 variant not pinned'; end if;
 select * into v_combo from igr_private.igr_v107_029_editorial_matrix
 where branch=v_branch and profile=v_profile and editorial_status='approved' and public_enabled;
 if not found then raise exception '029 draft not approved'; end if;

 for v_exhibit in select value from jsonb_array_elements(coalesce(v_combo.authoring->'evidence','[]'::jsonb)) loop
  v_id:=v_exhibit->>'id';
  v_public:=v_exhibit->>'visibility'='public';
  if (new.cycle=1 and v_id in ('P01','P03'))
  or (new.cycle=2 and v_id in ('P06','P07','P08','P09','P10'))
  or (new.cycle=3 and v_id in ('P11','P12','P13','P14','P15','P16')) then
    v_text:=coalesce(v_exhibit->>'text','');
    if v_id='P14' then v_text:=v_text||' '||
       regexp_replace(coalesce(v_combo.authoring->'witness4'->>'proof',''),
                        '^P14-V[1-5],\s*','');
    elsif v_id='P15' then v_text:=v_text||' '||
       regexp_replace(coalesce(v_combo.authoring->'branch'->>'responsibility',''),
                        '^P15-[ABC],\s*','');
    end if;
    insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
    values(new.code,'trame','roles',array['enqueteur','analyste'],new.cycle,
       jsonb_build_object('title','ÉLÉMENT '||v_id,'text',v_text,'source','enquête','item',v_id,
                         'verified',v_id not in ('P14','P15') or new.cycle=3));
  end if;
 end loop;

 if new.cycle=2 then
   v_msg_key:=case v_profile when 'V1' then 'M11' when 'V2' then 'M12'
       when 'V3' then 'M06' when 'V4' then 'M07' when 'V5' then 'M07b' else null end;
   v_msg:=v_combo.authoring->'pressures'->v_msg_key;
   select p.id into v_to from public.igr_v4_players p
       where p.room_code=new.code and p.public_role='suspect' and p.internal_slot=4;
   if v_to is null or v_msg is null then raise exception '029 witness 4 pressure unavailable'; end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,cycle,payload)
   values(new.code,'message','private',v_to,2,
     jsonb_build_object('title','MESSAGE PRIVÉ · LOS SALCEDO','text',v_msg->>'text',
       'channel','private','source','cartel','verified',false,'threat_not_confirmed',true));
 end if;
 return new;
end $body$;
revoke all on function igr_private.igr_v111_029_release() from public,anon,authenticated;
drop trigger if exists igr_v111_029_release on public.igr_v4_rooms;
create trigger igr_v111_029_release after update of cycle
on public.igr_v4_rooms for each row execute function igr_private.igr_v111_029_release();
