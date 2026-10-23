-- Private 008 editorial preview only; not connected to public gameplay.
CREATE OR REPLACE FUNCTION igr_private.igr_v300_008_build_pack(p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare
  draft jsonb;
  base jsonb;
  trames jsonb;
  investigations jsonb;
  verdict jsonb;
  c integer;
begin
  if p_variant not in ('A','B','C') then
    raise exception 'invalid 008 variant' using errcode='P0001';
  end if;
  select manuscript into draft
  from igr_private.igr_v99_variant_manuscripts
  where scenario_id='008' and variant_id=p_variant;
  if draft is null or draft->>'id'<>p_variant then
    raise exception 'missing private 008 manuscript' using errcode='P0001';
  end if;
  trames=draft->'v300_runtime_trames';
  investigations=draft->'v300_investigations';
  verdict=draft->'v300_verdict';
  if jsonb_typeof(trames)<>'array'
    or jsonb_array_length(trames)<>3
    or jsonb_typeof(investigations)<>'array'
    or jsonb_array_length(investigations)<>9
    or jsonb_typeof(verdict)<>'object'
    or (select count(*) from jsonb_object_keys(verdict))<>3
    or not (verdict ?& array['incident','responsible','decoy'])
  then raise exception '008 incomplete private pack' using errcode='P0001';
  end if;
  for c in 1..3 loop
    if (select count(*) from jsonb_array_elements(trames) e
        where (e->>'min_cycle')::int=c
          and (e->>'guaranteed')::boolean=true
          and length(coalesce(e->>'source',''))>15)<>1
    or (select count(*) from jsonb_array_elements(investigations) e
        where (e->>'cycle')::int=c and length(coalesce(e->>'result',''))>15)<>3
    then raise exception '008 unsolvable cycle %',c using errcode='P0001';
    end if;
  end loop;
  if (select count(distinct e->>'id')
      from jsonb_array_elements(investigations) e)<>9
     or (select count(*) from jsonb_array_elements(investigations) e
         where length(coalesce(e->>'title',''))>6)<>9
  then raise exception '008 duplicate or weak investigations' using errcode='P0001';
  end if;
  base=igr_private.igr_v100_preview_runtime_pack('008',p_variant);
  if base is null or jsonb_array_length(base->'suspects')<>3
    or jsonb_typeof(base->'relations')<>'object'
  then raise exception '008 baseline pack missing' using errcode='P0001';
  end if;
  return base || jsonb_build_object(
    'trames',trames,
    'investigation_008',investigations,
    'truth',(base->'truth')||jsonb_build_object('reconstruction_008',verdict)
  );
end;
$function$
;
revoke all on function igr_private.igr_v300_008_build_pack(text) from public, anon, authenticated;
