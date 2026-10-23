do $m$
declare src text;
begin
src=pg_get_functiondef('public.igr_v282_007_investigate(text,uuid,text)'::regprocedure);
src=replace(src,'public.igr_v282_007_investigate','public.igr_v305_008_investigate');
src=replace(src,'igr_private.igr_v281_007_pinned_pack','igr_private.igr_v301_008_pinned_pack');
src=replace(src,'007_investigation','008_investigation');
src=replace(src,'investigation_007','investigation_008');
src=replace(src,'''007''','''008''');
if position('igr_v301_008_pinned_pack' in src)=0 or position('investigation_008' in src)=0 then
 raise exception 'Unsafe 008 investigator derivation';end if;
src=replace(src,'begin
 perform igr_private.rate_limit', 'begin
 if coalesce((igr_private.igr_v301_008_release_status()->>''eligible'')::boolean,false) is not true then
  raise exception ''008 not released'' using errcode=''P0001'';end if;
 perform igr_private.rate_limit');
execute src;
end $m$;
revoke all on function public.igr_v305_008_investigate(text,uuid,text) from public,anon,authenticated;
grant execute on function public.igr_v305_008_investigate(text,uuid,text) to anon,authenticated;