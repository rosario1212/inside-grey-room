-- Public boolean only, never expose variant choice or draft content.
CREATE OR REPLACE FUNCTION igr_private.igr_v108_029_seed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare selected igr_private.igr_v107_029_editorial_matrix%rowtype;
        n integer; t text; witness jsonb; specific jsonb; actor_id uuid;
        content jsonb; slot_id integer;
begin
 if new.scenario_id<>'029' or not (old.status='lobby' and new.status='playing')
   or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 n:=greatest(1,coalesce((new.state->>'match_no')::integer,1));
 select * into selected from igr_private.igr_v107_029_editorial_matrix
 where editorial_status='approved' and public_enabled
 order by random() limit 1;
 if not found then raise exception '029 private narrative unavailable'; end if;
 insert into igr_private.igr_v108_029_room_variants(room_code,match_no,branch,profile)
 values(new.code,n,selected.branch,selected.profile) on conflict do nothing;
 for slot_id in 1..4 loop
   select id into actor_id from public.igr_v4_players
   where room_code=new.code and public_role='suspect' and internal_slot=slot_id;
   if actor_id is null then raise exception 'missing compulsory 029 witness'; end if;
   t:='T'||slot_id::text;
   witness:=selected.authoring->'witnesses'->t;
   specific:=case when slot_id=4 then selected.authoring->'witness4' else '{}'::jsonb end;
   if witness is null then raise exception 'missing private 029 witness card'; end if;
   content:=jsonb_build_object(
      'place',coalesce(witness->>'title','Témoin'),
      'anchors',coalesce(witness->>'knows',''),
      'hide',coalesce(witness->>'secret','')||case when slot_id=4 then ' '||coalesce(specific->>'secret','') else '' end,
      'position',coalesce(witness->>'history','')||case when slot_id=4 then ' '||coalesce(specific->>'cover','') else '' end,
      'objective_main',coalesce(witness->>'goal','')||case when slot_id=4 then ' '||coalesce(specific->>'real','') else '' end,
      'chronology',coalesce(witness->>'history',''),
      'unknown',coalesce(witness->>'unknown','')
   );
   update public.igr_v4_players set private_state=private_state||content where id=actor_id;
 end loop;
 update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{cartel029_ready}','true'::jsonb,true) where code=new.code;
 return new;
end $function$;
