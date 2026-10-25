CREATE OR REPLACE FUNCTION igr_private.igr_v600_020_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare m jsonb; base jsonb; t jsonb; choices jsonb; witness_cards jsonb; private_cards jsonb; relation_map jsonb; lvl jsonb; num int;
begin
 if p_variant not in ('A','B','C') then raise exception 'Invalid 017 variant';end if;
 select manuscript into m from igr_private.igr_v99_variant_manuscripts
 where scenario_id='020' and variant_id=p_variant;
 if m is null then raise exception 'Private manuscript missing';end if;
 t=m->'v600_runtime_trames';choices=m->'v600_investigations';witness_cards=m->'v600_witnesses';
 if jsonb_array_length(coalesce(t,'[]'::jsonb))<>6 or
   jsonb_array_length(coalesce(choices,'[]'::jsonb))<>12 or

   jsonb_typeof(m->'v600_verdict')<>'object' or
   not ((m->'v600_verdict') ?& array['ignition','exits','maintenance','evacuation']) or
   (select count(*) from jsonb_object_keys(m->'v600_verdict'))<>4
 then raise exception 'Private evidence pack is incomplete';end if;
 for num in 1..3 loop
  if (select count(*) from jsonb_array_elements(t) e
    where (e->>'min_cycle')::int=num
    and coalesce((e->>'guaranteed')::boolean,false)=true
    and length(coalesce(e->>'source',''))>20)<>2
    or (select count(*) from jsonb_array_elements(choices) e where (e->>'cycle')::int=num)<>4
  then raise exception '017 unsolvable cycle %',num;end if;
 end loop;
 if (select count(distinct e->>'id') from jsonb_array_elements(choices) e)<>12
 then raise exception '017 duplicate investigation IDs';end if;
 select pack into base from public.igr_v4_scenario_packs where scenario_id='020';
 if base is null or jsonb_array_length(coalesce(base->'suspects','[]'::jsonb))<>4 then
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
 if jsonb_array_length(coalesce(private_cards,'[]'::jsonb))<>4 then
   raise exception '017 incomplete suspect cards';end if;
 select jsonb_object_agg(k,
  (select jsonb_agg(jsonb_build_object(
     'slot',(a->>'target_slot')::int,
     'text',coalesce(a->>'known_fact','')||' · '||coalesce(a->>'conversation_tension',''))
     order by (a->>'target_slot')::int)
   from jsonb_array_elements(v) a)
 ) into relation_map
 from jsonb_each(m->'relationships') z(k,v);
 if (select count(*) from jsonb_object_keys(relation_map))<>4 then
   raise exception '017 missing private relationships';end if;
 lvl=jsonb_build_array(
  (m#>>'{canonical_truth,responsibility_by_slot,1}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,2}')::int,
  (m#>>'{canonical_truth,responsibility_by_slot,3}')::int,(m#>>'{canonical_truth,responsibility_by_slot,4}')::int);
 return base || jsonb_build_object(
  'context',m->>'public_briefing',
  'suspects',private_cards,
  'witnesses',coalesce(witness_cards,'[]'::jsonb),
  'relations',relation_map,
  'trames',t,'field_actions',m->'v600_field_actions',
  'investigation_020',choices,
  'truth',(base->'truth')||jsonb_build_object(
    'summary',m->'canonical_truth'->>'summary',
    'levels',lvl,
    'reconstruction_020',m->'v600_verdict',
    'cinematic',jsonb_build_object('final_line',m->>'final_reveal')
  )
 );
end;
$function$
