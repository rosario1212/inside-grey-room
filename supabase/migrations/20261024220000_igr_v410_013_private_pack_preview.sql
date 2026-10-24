CREATE OR REPLACE FUNCTION igr_private.igr_v410_013_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; cards jsonb; relations jsonb; lv jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 013 variant' using errcode='P0001';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='013' and variant_id=p_variant;
 if m is null then raise exception '013 private manuscript missing' using errcode='P0001';end if;
 t=m->'v410_runtime_trames';choices=m->'v410_investigations';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>3 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>9 or
   jsonb_typeof(m->'v410_verdict')<>'object' or
   not ((m->'v410_verdict') ?& array['knowledge','command','security']) or
   (select count(*) from jsonb_object_keys(m->'v410_verdict'))<>3
 then raise exception '013 incomplete private evidence pack' using errcode='P0001';end if;
 for num in 1..3 loop
  if (select count(*) from jsonb_array_elements(t) e where
    (e->>'min_cycle')::int=num and coalesce((e->>'guaranteed')::boolean,false)
     and length(coalesce(e->>'source',''))>20)<>1
    or (select count(*) from jsonb_array_elements(choices) e where
      (e->>'cycle')::int=num and length(coalesce(e->>'result',''))>45)<>3
  then raise exception '013 missing mandatory proof in cycle %',num using errcode='P0001';end if;
 end loop;
 if (select count(distinct e->>'id') from jsonb_array_elements(choices) e)<>9
 then raise exception '013 duplicate investigation IDs' using errcode='P0001';end if;
 select pack into base from public.igr_v4_scenario_packs where scenario_id='013';
 if base is null or jsonb_array_length(base->'suspects')<>3
 then raise exception '013 original pack missing' using errcode='P0001';end if;
 select jsonb_agg(jsonb_build_object(
   'place',e->>'identity','chronology',e->>'your_chronology',
   'hide',e->>'what_you_hide','anchors',e->>'what_you_know',
   'position',e->>'objective','slot',(e->>'slot')::int)
   order by (e->>'slot')::int)
 into cards from jsonb_array_elements(m->'private_cards') e;
 if jsonb_array_length(cards)<>3 then raise exception '013 private suspects incomplete';end if;
 select jsonb_object_agg(k,
   (select jsonb_agg(jsonb_build_object('slot',(a->>'target_slot')::int,
      'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
      order by (a->>'target_slot')::int)
    from jsonb_array_elements(v) a))
 into relations from jsonb_each(m->'relationships') x(k,v);
 if (select count(*) from jsonb_object_keys(relations))<>3
 then raise exception '013 private relationships incomplete';end if;
 lv=jsonb_build_array(
 (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
 (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
 (m#>>'{canonical_truth,responsibility_by_slot,3}')::int);
 return base||jsonb_build_object(
  'context',m->>'public_briefing',
  'suspects',cards,
  'relations',relations,
  'trames',t,
  'investigation_013',choices,
  'truth',(base->'truth')||jsonb_build_object(
   'summary',m->'canonical_truth'->>'summary',
   'levels',lv,
   'reconstruction_013',m->'v410_verdict',
   'cinematic',jsonb_build_object('final_line',m->>'final_reveal')));
end;
$function$
;
revoke all on function igr_private.igr_v410_013_build_pack(text) from public,anon,authenticated;
