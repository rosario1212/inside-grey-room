-- Machine-check all 15 private 029 manuscripts without copying their truths to public assets.
-- This is a structural/completeness audit, NOT independent editorial approval.
CREATE OR REPLACE FUNCTION igr_private.igr_v161_029_machine_audit()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO '' AS $audit$
DECLARE r record; i integer; key text; requirements text[];
 expected_pressure text; faults text[]; issue_rows jsonb:='[]'::jsonb;
 checked int:=0; ok_count int:=0; body jsonb; e jsonb; matches int; expected_cycle int;
BEGIN
 SELECT count(*) INTO checked FROM igr_private.igr_v107_029_editorial_matrix;
 IF checked<>15 THEN
  issue_rows:=issue_rows||jsonb_build_array(jsonb_build_object('variant','matrix','issues',jsonb_build_array('expected exactly 15 combinations')));
 END IF;
 ok_count:=0;
 FOR r IN SELECT branch,profile,authoring
   FROM igr_private.igr_v107_029_editorial_matrix ORDER BY branch,profile
 LOOP
  faults:=ARRAY[]::text[];
  body:=r.authoring;
  e:=coalesce(body->'evidence','[]'::jsonb);
  IF jsonb_typeof(e)<>'array' OR jsonb_array_length(e)<>16 THEN
   faults:=array_append(faults,'16 exhibits required');
  ELSE
   FOR i IN 1..16 LOOP
    key:='P'||lpad(i::text,2,'0');
    SELECT count(*) INTO matches FROM jsonb_array_elements(e) x
     WHERE x->>'id'=key AND length(trim(coalesce(x->>'text','')))>=18;
    IF matches<>1 THEN faults:=array_append(faults,'exhibit missing or duplicated: '||key);END IF;
    IF i BETWEEN 11 AND 16 THEN
     SELECT count(*) INTO matches FROM jsonb_array_elements(e) x
      WHERE x->>'id'=key AND x->>'cycle'='3';
     IF matches<>1 THEN faults:=array_append(faults,'late evidence unavailable in cycle 3: '||key); END IF;
    END IF;
   END LOOP;
  END IF;
  FOREACH key IN ARRAY ARRAY['T1','T2','T3','T4'] LOOP
   FOREACH expected_pressure IN ARRAY ARRAY['title','goal','knows','history','secret','family','unknown'] LOOP
    IF length(trim(coalesce(body->'witnesses'->key->>expected_pressure,'')))<10 THEN
      faults:=array_append(faults,'witness dossier incomplete: '||key||'.'||expected_pressure);
    END IF;
   END LOOP;
  END LOOP;
  FOREACH key IN ARRAY ARRAY['M02','M03','M04','M09','M10'] LOOP
   IF length(trim(coalesce(body->'pressures'->key->>'text','')))<15 THEN
    faults:=array_append(faults,'missing designated private pressure: '||key);
   END IF;
  END LOOP;
  expected_pressure:=case r.profile when 'V1' then 'M11' when 'V2' then 'M12'
    when 'V3' then 'M06' when 'V4' then 'M07' when 'V5' then 'M07b' end;
  IF length(trim(coalesce(body->'pressures'->expected_pressure->>'text','')))<15 THEN
   faults:=array_append(faults,'witness-4 private pressure missing');
  END IF;
  IF length(trim(coalesce(body->'witness4'->>'proof','')))<15
    OR length(trim(coalesce(body->'witness4'->>'real','')))<15
    OR length(trim(coalesce(body->'branch'->>'clue','')))<15
    OR length(trim(coalesce(body->'branch'->>'responsibility','')))<15
  THEN faults:=array_append(faults,'final cross-check incomplete'); END IF;
  IF cardinality(faults)=0 THEN ok_count:=ok_count+1;
  ELSE issue_rows:=issue_rows||jsonb_build_array(jsonb_build_object(
       'variant',r.branch||'-'||r.profile,'issues',to_jsonb(faults)));
  END IF;
 END LOOP;
 RETURN jsonb_build_object('checked',checked,'structurally_complete',ok_count,
   'issues',issue_rows,'passed',checked=15 AND ok_count=15,
   'human_story_review_unchanged',true);
END $audit$;
REVOKE ALL ON FUNCTION igr_private.igr_v161_029_machine_audit() FROM PUBLIC,anon,authenticated;
