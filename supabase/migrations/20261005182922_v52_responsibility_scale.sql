-- Inside Grey Room v52 — responsibility scale 0..2
-- 0 = aucune, 1 = secondaire, 2 = principale.
-- Legacy conversion: 0->0, 1/2->1, 3->2.

update public.igr_v4_scenario_packs sp
set pack=jsonb_set(sp.pack,'{truth,levels}',coalesce((
  select jsonb_agg(case when x.value::int<=0 then 0 when x.value::int>=3 then 2 else 1 end order by x.ord)
  from jsonb_array_elements_text(coalesce(sp.pack->'truth'->'levels','[]'::jsonb)) with ordinality x(value,ord)
),'[]'::jsonb),true)
where jsonb_typeof(sp.pack->'truth'->'levels')='array';

update public.igr_v3_scenario_packs sp
set pack=jsonb_set(sp.pack,'{truth,levels}',coalesce((
  select jsonb_agg(case when x.value::int<=0 then 0 when x.value::int>=3 then 2 else 1 end order by x.ord)
  from jsonb_array_elements_text(coalesce(sp.pack->'truth'->'levels','[]'::jsonb)) with ordinality x(value,ord)
),'[]'::jsonb),true)
where jsonb_typeof(sp.pack->'truth'->'levels')='array';

do $$
declare d text;
begin
 select pg_get_functiondef(p.oid) into d
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='igr_v3_build_private_card'
 limit 1;
 if d is not null then
   d:=replace(d,'À la fin, attribue à chaque suspect un niveau de responsabilité de 0 à 3.','À la fin, attribue à chaque suspect : 0 aucune responsabilité, 1 responsabilité secondaire, 2 responsabilité principale.');
   execute d;
 end if;
end$$;

create or replace function public.igr_v52_investigation_role(p_role text)
returns boolean language sql immutable set search_path='public'
as $$select p_role=any(array['enqueteur','analyste','inspecteur','expert','procureur','juge']::text[])$$;

create or replace function public.igr_v52_validate_levels(p_room text,p_levels jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare s public.igr_v4_players%rowtype; lvl int; outv jsonb='{}'::jsonb;
begin
 if jsonb_typeof(p_levels)<>'object' then raise exception 'invalid levels'; end if;
 for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot nulls last,seat_index loop
   if not (p_levels ? s.id::text) then raise exception 'missing suspect'; end if;
   begin lvl:=(p_levels->>s.id::text)::int; exception when others then raise exception 'invalid level'; end;
   if lvl<0 or lvl>2 then raise exception 'invalid level'; end if;
   outv:=outv||jsonb_build_object(s.id::text,lvl);
 end loop;
 if exists(select 1 from jsonb_object_keys(p_levels) k where not exists(select 1 from public.igr_v4_players p where p.room_code=p_room and p.public_role='suspect' and p.id::text=k)) then raise exception 'unknown suspect'; end if;
 return outv;
end$$;

revoke all on function public.igr_v52_validate_levels(text,jsonb) from public,anon,authenticated;
