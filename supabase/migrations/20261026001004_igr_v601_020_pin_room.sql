CREATE OR REPLACE FUNCTION igr_private.igr_v601_020_pin_room(p_room text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r public.igr_v4_rooms%rowtype;v text; p jsonb;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room)) for update;
 if not found or r.scenario_id<>'020' then return false;end if;
 if exists(select 1 from igr_private.igr_v601_020_room_snapshots where room_code=r.code) then return true;end if;
 if r.status<>'lobby' or (igr_private.igr_v601_020_release_status()->>'eligible')::boolean is distinct from true then return false;end if;
 select variant_id into v from igr_private.igr_v99_variant_manuscripts
 where scenario_id='020' and editorial_status='ready' and approved_by='owner_authorized_release_020'
 and approved_at is not null and manuscript->'v601_approval'->>'owner_authorized'='true'
 order by gen_random_uuid() limit 1;
 if v is null then return false;end if;
 p=igr_private.igr_v600_020_safe_pack(v);
 insert into igr_private.igr_v601_020_room_snapshots(room_code,variant_id,pack)
 values(r.code,v,p);
 return true;
end;
$function$
