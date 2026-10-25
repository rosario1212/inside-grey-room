CREATE OR REPLACE FUNCTION igr_private.igr_v601_020_release_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r record; n int:=0; ok int:=0; seen text[]:=array[]::text[];b jsonb;secure boolean;
begin
 for r in select variant_id,editorial_status,approved_at,approved_by,manuscript,content_md5
 from igr_private.igr_v99_variant_manuscripts where scenario_id='020' and variant_id in ('A','B','C') loop
  n:=n+1;
  begin
   b=igr_private.igr_v600_020_safe_pack(r.variant_id);
   if r.content_md5=md5(r.manuscript::text)
     and jsonb_array_length(b->'trames')=6
     and jsonb_array_length(b->'investigation_020')=12
     and jsonb_array_length(b->'suspects')=4
     and jsonb_typeof(b->'truth'->'reconstruction_020')='object'
     and not ((b->'truth'->'reconstruction_020')::text=any(seen)) then
      seen=array_append(seen,(b->'truth'->'reconstruction_020')::text);
      if r.editorial_status='ready' and r.approved_at is not null
        and r.approved_by='owner_authorized_release_020'
        and r.manuscript->'v601_approval'->>'owner_authorized'='true'
        then ok:=ok+1;
      end if;
   end if;
  exception when others then null;
  end;
 end loop;
 secure=not has_function_privilege('anon','igr_private.igr_v600_020_safe_pack(text)','EXECUTE')
  and not has_function_privilege('authenticated','igr_private.igr_v600_020_safe_pack(text)','EXECUTE');
 return jsonb_build_object(
  'eligible',n=3 and ok=3 and array_length(seen,1)=3 and secure
    and public.igr_v4_min_players('020')=13 and public.igr_v4_max_players('020')=16,
  'found',n,'approved',ok,'valid_distinct',coalesce(array_length(seen,1),0),
  'private_secure',secure,'human_playtest_verified',false);
end;
$function$
