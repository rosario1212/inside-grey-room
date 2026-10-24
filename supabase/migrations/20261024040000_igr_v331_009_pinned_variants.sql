create table if not exists igr_private.igr_v331_009_room_snapshots(
  room_code text primary key references public.igr_v4_rooms(code) on delete cascade,
  variant_id text not null check(variant_id in ('A','B','C')),
  pack jsonb not null,
  pinned_at timestamptz not null default now()
);
revoke all on igr_private.igr_v331_009_room_snapshots from public,anon,authenticated;
create or replace function igr_private.igr_v331_009_release_status()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog
as $f$
declare r record; n int:=0; ok int:=0; seen text[]:=array[]::text[];b jsonb;secure boolean;
begin
 for r in select variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 from igr_private.igr_v99_variant_manuscripts where scenario_id='009' and variant_id in ('A','B','C') loop
  n:=n+1;
  begin
   b=igr_private.igr_v330_009_build_pack(r.variant_id);
   if r.content_md5=md5(r.manuscript::text)
     and jsonb_array_length(b->'trames')=3
     and jsonb_array_length(b->'investigation_009')=9
     and jsonb_array_length(b->'suspects')=3
     and jsonb_typeof(b->'truth'->'reconstruction_009')='object'
     and not ((b->'truth'->'reconstruction_009')::text=any(seen)) then
      seen=array_append(seen,(b->'truth'->'reconstruction_009')::text);
      if r.editorial_status='ready' and r.approved_at is not null
        and r.approved_by='owner_authorized_release_009'
        and r.manuscript->'v331_approval'->>'owner_authorized'='true'
        then ok:=ok+1;
      end if;
   end if;
  exception when others then null;
  end;
 end loop;
 secure=not has_function_privilege('anon','igr_private.igr_v330_009_build_pack(text)','EXECUTE')
  and not has_function_privilege('authenticated','igr_private.igr_v330_009_build_pack(text)','EXECUTE');
 return jsonb_build_object(
  'eligible',n=3 and ok=3 and array_length(seen,1)=3 and secure
    and public.igr_v4_min_players('009')=5 and public.igr_v4_max_players('009')=5,
  'found',n,'approved',ok,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false);
end;
$f$;
revoke all on function igr_private.igr_v331_009_release_status() from public,anon,authenticated;
create or replace function igr_private.igr_v331_009_pin_room(p_room text)
returns boolean language plpgsql volatile security definer set search_path=pg_catalog
as $f$
declare r public.igr_v4_rooms%rowtype;v text; p jsonb;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room)) for update;
 if not found or r.scenario_id<>'009' then return false;end if;
 if exists(select 1 from igr_private.igr_v331_009_room_snapshots where room_code=r.code) then return true;end if;
 if r.status<>'lobby' or (igr_private.igr_v331_009_release_status()->>'eligible')::boolean is distinct from true then return false;end if;
 select variant_id into v from igr_private.igr_v99_variant_manuscripts
 where scenario_id='009' and editorial_status='ready' and approved_by='owner_authorized_release_009'
 and approved_at is not null and manuscript->'v331_approval'->>'owner_authorized'='true'
 order by gen_random_uuid() limit 1;
 if v is null then return false;end if;
 p=igr_private.igr_v330_009_build_pack(v);
 insert into igr_private.igr_v331_009_room_snapshots(room_code,variant_id,pack)
 values(r.code,v,p);
 return true;
end;
$f$;
revoke all on function igr_private.igr_v331_009_pin_room(text) from public,anon,authenticated;
create or replace function igr_private.igr_v331_009_pinned_pack(p_room text)
returns jsonb language sql stable security definer set search_path=pg_catalog
as $f$
 select pack from igr_private.igr_v331_009_room_snapshots
 where room_code=upper(trim(p_room))
$f$;
revoke all on function igr_private.igr_v331_009_pinned_pack(text) from public,anon,authenticated;
