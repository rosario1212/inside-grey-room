-- 017 private engine and rosters. Public GitHub contains NO secret A/B/C manuscripts.
-- Confidential content and its approval remain inside protected Supabase schema igr_private.
CREATE TABLE IF NOT EXISTS igr_private.igr_v521_017_room_snapshots (
 room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 variant_id text NOT NULL CHECK (variant_id IN ('A','B','C')),
 pack jsonb NOT NULL,
 pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v521_017_room_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v521_017_room_snapshots FROM public,anon,authenticated;
CREATE OR REPLACE FUNCTION igr_private.igr_v320_017_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; witness_cards jsonb; private_cards jsonb; relation_map jsonb; lvl jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 017 variant';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='017' and variant_id=p_variant;
 if m is null then raise exception 'Private manuscript missing';end if;
 t=m->'v320_runtime_trames';choices=m->'v320_investigations';witness_cards=m->'v320_witnesses';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>3 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>9 or
   jsonb_array_length(coalesce(witness_cards,'[]'::jsonb))<>2 or
   jsonb_typeof(m->'v320_verdict')<>'object' or
   not ((m->'v320_verdict') ?& array['act','decision','cover']) or
   (select count(*) from jsonb_object_keys(m->'v320_verdict'))<>3
 then raise exception 'Private evidence pack is incomplete';end if;
 for num in 1..3 loop
  if (select count(*) from jsonb_array_elements(t) e
    where (e->>'min_cycle')::int=num
    and coalesce((e->>'guaranteed')::boolean,false)=true
    and length(coalesce(e->>'source',''))>20)<>1
    or (select count(*) from jsonb_array_elements(choices) e where (e->>'cycle')::int=num)<>3
  then raise exception '017 unsolvable cycle %',num;end if;
 end loop;
 if (select count(distinct e->>'id') from jsonb_array_elements(choices) e)<>9
 then raise exception '017 duplicate investigation IDs';end if;
 select pack into base from public.igr_v4_scenario_packs where scenario_id='017';
 if base is null or jsonb_array_length(coalesce(base->'suspects','[]'::jsonb))<>3 then
   raise exception '017 base case missing';end if;
 select jsonb_agg(
   jsonb_build_object(
    'place',e->>'identity',
    'chronology',e->>'your_chronology',
    'hide',e->>'what_you_hide',
    'anchors',e->>'what_you_know',
    'position',e->>'objective',
    'slot',(e->>'slot')::int
   ) order by (e->>'slot')::int
 ) into private_cards from jsonb_array_elements(m->'private_cards') e;
 if jsonb_array_length(coalesce(private_cards,'[]'::jsonb))<>3 then
   raise exception '017 incomplete suspect cards';end if;
 select jsonb_object_agg(k,
  (select jsonb_agg(jsonb_build_object(
     'slot',(a->>'target_slot')::int,
     'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
     order by (a->>'target_slot')::int)
   from jsonb_array_elements(v) a)
 ) into relation_map
 from jsonb_each(m->'relationships') z(k,v);
 if (select count(*) from jsonb_object_keys(relation_map))<>3 then
   raise exception '017 missing private relationships';end if;
 lvl=jsonb_build_array(
  (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,3}')::int);
 return base || jsonb_build_object(
  'context',m->>'public_briefing',
  'suspects',private_cards,
  'witnesses',witness_cards,
  'relations',relation_map,
  'trames',t,
  'investigation_017',choices,
  'truth',(base->'truth')||jsonb_build_object(
    'summary',m->'canonical_truth'->>'summary',
    'levels',lvl,
    'reconstruction_017',m->'v320_verdict',
    'cinematic',jsonb_build_object('final_line',m->>'final_reveal')
  )
 );
end;
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v520_017_safe_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v320_017_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='017' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v520_verdict')<>'object'
  OR NOT (m->'v520_verdict') ?& ARRAY['act','decision','cover']
  OR (SELECT count(*) FROM jsonb_object_keys(m->'v520_verdict'))<>3
  OR jsonb_array_length(coalesce(m->'v520_expert_actions','[]'::jsonb))<>3
 THEN RAISE EXCEPTION '017 incomplete narrative or expert evidence';END IF;
 p:=jsonb_set(p,'{truth,reconstruction_017}',m->'v520_verdict',true);
 RETURN p || jsonb_build_object(
 'expert_actions',m->'v520_expert_actions',
 'news',jsonb_build_array(
  jsonb_build_object('id','017-news-1','title','DEUX ENLEVÉS','text','Deux personnes ont été détenues. Une seule a été libérée.'),
  jsonb_build_object('id','017-news-2','title','INTERVALLE CRITIQUE','text','Les pièces doivent distinguer les violences, les décisions et les possibilités d’assistance.'),
  jsonb_build_object('id','017-news-3','title','ACCORD DE SILENCE','text','Une somme et des menaces ont accompagné la libération du survivant, sans démontrer qui avait causé la mort.')
 ),
 'journalist_leads','[]'::jsonb);
END $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v521_017_release_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r record; n int:=0; ok int:=0; seen text[]:=array[]::text[];b jsonb;secure boolean;
begin
 for r in select variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 from igr_private.igr_v99_variant_manuscripts where scenario_id='017' and variant_id in ('A','B','C') loop
  n:=n+1;
  begin
   b=igr_private.igr_v520_017_safe_pack(r.variant_id);
   if r.content_md5=md5(r.manuscript::text)
     and jsonb_array_length(b->'trames')=3
     and jsonb_array_length(b->'investigation_017')=9
     and jsonb_array_length(b->'suspects')=3
     and jsonb_typeof(b->'truth'->'reconstruction_017')='object'
     and not ((b->'truth'->'reconstruction_017')::text=any(seen)) then
      seen=array_append(seen,(b->'truth'->'reconstruction_017')::text);
      if r.editorial_status='ready' and r.approved_at is not null
        and r.approved_by='owner_authorized_release_017'
        and r.manuscript->'v521_approval'->>'owner_authorized'='true'
        then ok:=ok+1;
      end if;
   end if;
  exception when others then null;
  end;
 end loop;
 secure=not has_function_privilege('anon','igr_private.igr_v520_017_safe_pack(text)','EXECUTE')
  and not has_function_privilege('authenticated','igr_private.igr_v520_017_safe_pack(text)','EXECUTE');
 return jsonb_build_object(
  'eligible',n=3 and ok=3 and array_length(seen,1)=3 and secure
    and public.igr_v4_min_players('017')=7 and public.igr_v4_max_players('017')=10,
  'found',n,'approved',ok,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false);
end;
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v521_017_pin_room(p_room text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r public.igr_v4_rooms%rowtype;v text; p jsonb;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room)) for update;
 if not found or r.scenario_id<>'017' then return false;end if;
 if exists(select 1 from igr_private.igr_v521_017_room_snapshots where room_code=r.code) then return true;end if;
 if r.status<>'lobby' or (igr_private.igr_v521_017_release_status()->>'eligible')::boolean is distinct from true then return false;end if;
 select variant_id into v from igr_private.igr_v99_variant_manuscripts
 where scenario_id='017' and editorial_status='ready' and approved_by='owner_authorized_release_017'
 and approved_at is not null and manuscript->'v521_approval'->>'owner_authorized'='true'
 order by gen_random_uuid() limit 1;
 if v is null then return false;end if;
 p=igr_private.igr_v520_017_safe_pack(v);
 insert into igr_private.igr_v521_017_room_snapshots(room_code,variant_id,pack)
 values(r.code,v,p);
 return true;
end;
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v521_017_pinned_pack(p_room text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
 select pack from igr_private.igr_v521_017_room_snapshots
 where room_code=upper(trim(p_room))
$function$;

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
 when p_scenario in ('001','004','005','006') then 5
 when p_scenario in ('003','008','009','011') then 6
 when p_scenario='002' then 6
 when p_scenario in ('007','010','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 9
 when p_scenario='017' then 10 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 11 then raise exception 'four witness roster requires 6 to 11 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'])[p_seat+1];
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
 
elsif p_scenario='003' then
   if p_count=6 then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
   elsif p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 
elsif p_scenario in ('007','010','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='008' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='009' then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
 elsif p_scenario='011' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge','expert'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin','maitre','expert'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
  case (case when r='avocat' then 'maitre' else r end)
    when 'enqueteur' then return 1;
    when 'analyste' then return 1;
    when 'suspect' then return 4;
    when 'procureur' then return case when p_count>=7 then 1 else 0 end;
    when 'juge' then return case when p_count>=8 then 1 else 0 end;
    when 'journaliste' then return case when p_count>=9 then 1 else 0 end;
    when 'don' then return case when p_count>=10 then 1 else 0 end;
    when 'bras_droit' then return case when p_count>=11 then 1 else 0 end;
    when 'maitre' then return 0;
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
   when p_scenario='016' and p_count>=6 then 1 when p_scenario='017' and p_count>=9 then 1
   when p_scenario='029' then case when p_count>=8 then 2 when p_count>=6 then 1 else 0 end
   when p_scenario='030' and p_count>=8 then 1
   when p_scenario='031' and p_count>=6 then 1
   else 0 end;
 elsif r='inspecteur' then return case when p_scenario in ('018','020','027') then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
 elsif r='expert' then return case when p_scenario in ('020','026','028') then 1 when p_scenario='027' and p_count>=8 then 1 when p_scenario='016' and p_count>=9 then 1 when p_scenario='017' and p_count>=10 then 1 else 0 end;
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
$function$;

REVOKE ALL ON FUNCTION igr_private.igr_v320_017_build_pack(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v520_017_safe_pack(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v521_017_release_status() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v521_017_pin_room(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v521_017_pinned_pack(text) FROM public,anon,authenticated;
