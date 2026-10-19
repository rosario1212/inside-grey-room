-- Never activate 029 with an incomplete private evidence authoring set.
CREATE OR REPLACE FUNCTION igr_private.igr_v108_029_is_enabled()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select (select count(*) from igr_private.igr_v107_029_editorial_matrix
         where editorial_status='approved' and public_enabled
  and jsonb_array_length(coalesce(authoring->'evidence','[]'::jsonb))=16
  and jsonb_typeof(authoring->'witnesses')='object'
  and length(trim(coalesce(authoring->'branch'->>'clue','')))>20
  and jsonb_typeof(authoring->'pressures')='object'
  and authoring->'witness4'->>'real' is not null)=15
   and (select count(*) from igr_private.igr_v99_variant_manuscripts
        where scenario_id='029' and editorial_status='approved' and approved_at is not null)=3
   and (select passed_end_to_end_testing and manually_activated from igr_private.igr_v108_029_release_control where only_row=true) is true
$function$;
