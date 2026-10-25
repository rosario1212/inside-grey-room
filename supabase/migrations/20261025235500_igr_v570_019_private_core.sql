-- 019 confidential variants, immutable room snapshots. Narrative source is retained only in the private database.
CREATE TABLE IF NOT EXISTS igr_private.igr_v571_019_room_snapshots (
 room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
 variant_id text NOT NULL CHECK (variant_id IN ('A','B','C')),
 pack jsonb NOT NULL, pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_v571_019_room_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_v571_019_room_snapshots FROM public,anon,authenticated;
CREATE OR REPLACE FUNCTION igr_private.igr_v570_019_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; witness_cards jsonb; private_cards jsonb; relation_map jsonb; lvl jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 017 variant';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='019' and variant_id=p_variant;
 if m is null then raise exception 'Private manuscript missing';end if;
 t=m->'v570_runtime_trames';choices=m->'v570_investigations';witness_cards=m->'witnesses';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>3 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>9 or

   jsonb_typeof(m->'v570_verdict')<>'object' or
   not ((m->'v570_verdict') ?& array['mandate','knowledge','cover']) or
   (select count(*) from jsonb_object_keys(m->'v570_verdict'))<>3
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
 select pack into base from public.igr_v4_scenario_packs where scenario_id='019';
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
  'witnesses',coalesce(witness_cards,'[]'::jsonb),
  'relations',relation_map,
  'trames',t,
  'investigation_019',choices,
  'truth',(base->'truth')||jsonb_build_object(
    'summary',m->'canonical_truth'->>'summary',
    'levels',lvl,
    'reconstruction_019',m->'v570_verdict',
    'cinematic',jsonb_build_object('final_line',m->>'final_reveal')
  )
 );
end;
$function$


CREATE OR REPLACE FUNCTION igr_private.igr_v570_019_safe_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE p jsonb;m jsonb;
BEGIN
 p:=igr_private.igr_v570_019_build_pack(p_variant);
 SELECT manuscript INTO m FROM igr_private.igr_v99_variant_manuscripts
 WHERE scenario_id='019' AND variant_id=p_variant;
 IF m IS NULL OR jsonb_typeof(m->'v570_verdict')<>'object'
  OR NOT (m->'v570_verdict') ?& ARRAY['mandate','knowledge','cover']
  OR (SELECT count(*) FROM jsonb_object_keys(m->'v570_verdict'))<>3

 THEN RAISE EXCEPTION '017 incomplete narrative or expert evidence';END IF;
 p:=jsonb_set(p,'{truth,reconstruction_019}',m->'v570_verdict',true);
 RETURN p || jsonb_build_object(
 'expert_actions','[]'::jsonb,
 'news',jsonb_build_array(
  jsonb_build_object('id','017-news-1','title','LE GALA A ÉTÉ INTERROMPU','text','Un lanceur d’alerte a été retrouvé mort avant son intervention. Ses accusations exigent une enquête indépendante.'),
  jsonb_build_object('id','017-news-2','title','UNE COMMANDE, PLUSIEURS DÉCISIONS','text','Une mission de pression ne prouve pas automatiquement un ordre d’homicide. Les communications doivent être vérifiées.'),
  jsonb_build_object('id','017-news-3','title','DES ARCHIVES MODIFIÉES','text','La suppression de documents après une mort ne suffit pas à identifier le commanditaire. Le dossier doit être reconstitué.')
 ),
 'journalist_leads','[]'::jsonb);
END $function$


CREATE OR REPLACE FUNCTION igr_private.igr_v571_019_release_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r record; n int:=0; ok int:=0; seen text[]:=array[]::text[];b jsonb;secure boolean;
begin
 for r in select variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 from igr_private.igr_v99_variant_manuscripts where scenario_id='019' and variant_id in ('A','B','C') loop
  n:=n+1;
  begin
   b=igr_private.igr_v570_019_safe_pack(r.variant_id);
   if r.content_md5=md5(r.manuscript::text)
     and jsonb_array_length(b->'trames')=3
     and jsonb_array_length(b->'investigation_019')=9
     and jsonb_array_length(b->'suspects')=3
     and jsonb_typeof(b->'truth'->'reconstruction_019')='object'
     and not ((b->'truth'->'reconstruction_019')::text=any(seen)) then
      seen=array_append(seen,(b->'truth'->'reconstruction_019')::text);
      if r.editorial_status='ready' and r.approved_at is not null
        and r.approved_by='owner_authorized_release_019'
        and r.manuscript->'v571_approval'->>'owner_authorized'='true'
        then ok:=ok+1;
      end if;
   end if;
  exception when others then null;
  end;
 end loop;
 secure=not has_function_privilege('anon','igr_private.igr_v570_019_safe_pack(text)','EXECUTE')
  and not has_function_privilege('authenticated','igr_private.igr_v570_019_safe_pack(text)','EXECUTE');
 return jsonb_build_object(
  'eligible',n=3 and ok=3 and array_length(seen,1)=3 and secure
    and public.igr_v4_min_players('019')=9 and public.igr_v4_max_players('019')=9,
  'found',n,'approved',ok,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false);
end;
$function$


CREATE OR REPLACE FUNCTION igr_private.igr_v571_019_pin_room(p_room text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r public.igr_v4_rooms%rowtype;v text; p jsonb;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room)) for update;
 if not found or r.scenario_id<>'019' then return false;end if;
 if exists(select 1 from igr_private.igr_v571_019_room_snapshots where room_code=r.code) then return true;end if;
 if r.status<>'lobby' or (igr_private.igr_v571_019_release_status()->>'eligible')::boolean is distinct from true then return false;end if;
 select variant_id into v from igr_private.igr_v99_variant_manuscripts
 where scenario_id='019' and editorial_status='ready' and approved_by='owner_authorized_release_019'
 and approved_at is not null and manuscript->'v571_approval'->>'owner_authorized'='true'
 order by gen_random_uuid() limit 1;
 if v is null then return false;end if;
 p=igr_private.igr_v570_019_safe_pack(v);
 insert into igr_private.igr_v571_019_room_snapshots(room_code,variant_id,pack)
 values(r.code,v,p);
 return true;
end;
$function$


CREATE OR REPLACE FUNCTION igr_private.igr_v571_019_pinned_pack(p_room text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
 select pack from igr_private.igr_v571_019_room_snapshots
 where room_code=upper(trim(p_room))
$function$

REVOKE ALL ON FUNCTION igr_private.igr_v570_019_build_pack(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v570_019_safe_pack(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v571_019_release_status() FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v571_019_pin_room(text) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v571_019_pinned_pack(text) FROM public,anon,authenticated;
