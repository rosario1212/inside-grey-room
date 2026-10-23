do $m$
declare src text;a text;v text;k text;
begin
src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
v=$new$ if r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_008')<>'object'
   or coalesce(p_payload->'reconstruction_008'->>'incident','') not in ('authorised_removal_confirmed','custody_gap','document_displacement')
   or coalesce(p_payload->'reconstruction_008'->>'responsible','') not in ('slot2_witness_pressure','slot1_custody_breach','slot3_deliberate_move')
   or coalesce(p_payload->'reconstruction_008'->>'decoy','') not in ('slot3_private_arrival','slot3_early_arrival','slot1_false_timesheet')
   or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_008'))<>3
   then raise exception 'invalid 008 reconstruction';end if;
 end if;
$new$;
a=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
if position('invalid 008 reconstruction' in src)=0 then
 if position(a in src)=0 then raise exception '008 lock validation anchor missing';end if;
 src=replace(src,a,v||a);
end if;
k='''reconstruction_007'',case when r.scenario_id=''007'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_007'' else null end';
if position('''reconstruction_008'',case when r.scenario_id=''008''' in src)=0 then
 if position(k in src)=0 then raise exception '008 lock persisted field anchor missing';end if;
 src=replace(src,k,k||',''reconstruction_008'',case when r.scenario_id=''008'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_008'' else null end');
end if;
execute src;
end $m$;