-- v108: fully OFF until all 15 private authoring combinations and A/B/C
-- manuscripts receive explicit approval. No plot truth is stored in the repo.
create or replace function igr_private.igr_v108_029_is_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select (select count(*) from igr_private.igr_v107_029_editorial_matrix
         where editorial_status='approved' and public_enabled)=15
   and (select count(*) from igr_private.igr_v99_variant_manuscripts
        where scenario_id='029' and editorial_status='approved' and approved_at is not null)=3
$$;
revoke all on function igr_private.igr_v108_029_is_enabled() from public,anon,authenticated;

-- The legacy casting, capacity and interrogation flow remain unchanged
-- until the private activation predicate is satisfied.
CREATE OR REPLACE FUNCTION public.igr_v4_min_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 6
 when p_scenario between '035' and '039' then 5
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 4
 when p_scenario='026' then 6 when p_scenario='027' then 7 when p_scenario='028' then 6
 when p_scenario='029' then 5 when p_scenario='030' then 7 when p_scenario='031' then 6
 when p_scenario='032' then 6 when p_scenario='033' then 6 when p_scenario='034' then 7
 when p_scenario in ('001','003','004','005','006') then 4
 when p_scenario='002' then 5
 when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5
 when p_scenario='017' then 7 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 13 else 5 end
$function$

CREATE OR REPLACE FUNCTION public.igr_v4_max_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 11
 when p_scenario between '035' and '039' then 7
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 8
 when p_scenario='026' then 7 when p_scenario='027' then 8 when p_scenario='028' then 8
 when p_scenario='029' then 8 when p_scenario='030' then 9 when p_scenario='031' then 8
 when p_scenario='032' then 8 when p_scenario='033' then 8 when p_scenario='034' then 9
 when p_scenario in ('001','003','004','005','006') then 5
 when p_scenario='002' then 6
 when p_scenario in ('007','008','009','010','011','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 8
 when p_scenario='017' then 8 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$

CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 11 then raise exception 'four witness roster requires 6 to 11 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','maitre','maitre'])[p_seat+1];
 end if;
 if p_scenario between '035' and '039' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario between '040' and '044' then
   return (array['enqueteur','analyste','maitre','suspect','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='026' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='027' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','inspecteur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','inspecteur','expert','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='028' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','expert','inspecteur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','expert','inspecteur','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='029' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','maitre','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='030' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','maitre','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','maitre','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='031' then
   if p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='032' then
   if p_count=6 then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='033' then
   if p_count=6 then return (array['enqueteur','analyste','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','juge','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','juge','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='034' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','003','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario in ('007','008','009','010','011','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$

CREATE OR REPLACE FUNCTION public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
  case r
    when 'enqueteur' then return 1;
    when 'analyste' then return 1;
    when 'suspect' then return 4;
    when 'procureur' then return case when p_count>=7 then 1 else 0 end;
    when 'juge' then return case when p_count>=8 then 1 else 0 end;
    when 'journaliste' then return case when p_count>=9 then 1 else 0 end;
    when 'maitre' then return case when p_count>=11 then 2 when p_count>=10 then 1 else 0 end;
    else return 0;
  end case;
 end if;
 if r='avocat' then r:='maitre'; end if;
 if r='enqueteur' then return 1;
 elsif r='analyste' then return case when p_scenario in ('001','003','004','005','006') and p_count=4 then 0 else 1 end;
 elsif r='suspect' then return case when p_scenario='002' then 4 when p_scenario='020' then 4 else 3 end;
 elsif r='procureur' then return case
   when p_scenario in ('017','019','020','027','030','032','034') then 1
   when p_scenario='013' and p_count>=6 then 1 when p_scenario='026' and p_count>=7 then 1 when p_scenario='028' and p_count>=8 then 1
   when p_scenario in ('029','031','033') and p_count>=7 then 1 else 0 end;
 elsif r='juge' then return case
   when p_scenario in ('019','020','030','033','034') then 1
   when p_scenario='032' and p_count>=7 then 1
   when p_scenario='014' and p_count>=6 then 1 when p_scenario='015' and p_count>=7 then 1 when p_scenario='016' and p_count>=8 then 1 else 0 end;
 elsif r='journaliste' then return case
   when p_scenario='019' then 1 when p_scenario='020' then case when p_count>=15 then 2 else 1 end
   when p_scenario='015' and p_count>=6 then 1 when p_scenario='016' and p_count>=7 then 1
   when p_scenario='030' and p_count>=9 then 1 when p_scenario='034' and p_count>=9 then 1 else 0 end;
 elsif r='maitre' then return case
   when p_scenario='019' then 1
   when p_scenario='020' then case when p_count>=14 then 2 else 1 end
   when p_scenario='016' and p_count>=6 then 1
   when p_scenario='029' then case when p_count>=8 then 2 when p_count>=6 then 1 else 0 end
   when p_scenario='030' and p_count>=8 then 1
   when p_scenario='031' and p_count>=6 then 1
   else 0 end;
 elsif r='inspecteur' then return case when p_scenario in ('018','020','027') then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
 elsif r='expert' then return case when p_scenario in ('020','026','028') then 1 when p_scenario='027' and p_count>=8 then 1 else 0 end;
 elsif r='temoin' then return case
   when p_scenario='017' then case when p_count>=8 then 2 else 1 end
   when p_scenario='020' then case when p_count>=16 then 2 else 1 end
   when p_scenario='031' and p_count>=8 then 1
   when p_scenario='032' and p_count>=8 then 1
   when p_scenario='033' and p_count>=8 then 1
   when p_scenario='034' and p_count>=8 then 1
   else 0 end;
 end if;
 return 0;
end
$function$

CREATE OR REPLACE FUNCTION public.igr_v13_interrogation_limit(p_room text, p_cycle integer)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_cycle=1 and exists(select 1 from public.igr_v4_rooms r where r.code=p_room and r.scenario_id='029') and igr_private.igr_v108_029_is_enabled() then return 4; end if;
  if p_cycle=1 then return 3; end if;
  if p_cycle=2 then return 2; end if;
  if p_cycle=3 then return 1; end if;
  return 0;
end
$function$


create table if not exists igr_private.igr_v108_029_room_variants(
 room_code text not null references public.igr_v4_rooms(code) on delete cascade,
 match_no integer not null check(match_no>=1),
 branch text not null check(branch in ('A','B','C')),
 profile text not null check(profile in ('V1','V2','V3','V4','V5')),
 chosen_at timestamptz not null default now(),
 primary key(room_code,match_no));
alter table igr_private.igr_v108_029_room_variants enable row level security;
revoke all on igr_private.igr_v108_029_room_variants from public,anon,authenticated;

-- Seed, server-side, exactly one immutable two-axis combination for a match.
-- Public room state contains no A/B/C seed or V1–V5 key.
create or replace function igr_private.igr_v108_029_seed()
returns trigger language plpgsql security definer set search_path='' as $$
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
 return new;
end $$;
revoke all on function igr_private.igr_v108_029_seed() from public,anon,authenticated;
drop trigger if exists igr_v108_029_seed on public.igr_v4_rooms;
create trigger igr_v108_029_seed after update of status
on public.igr_v4_rooms for each row execute function igr_private.igr_v108_029_seed();
