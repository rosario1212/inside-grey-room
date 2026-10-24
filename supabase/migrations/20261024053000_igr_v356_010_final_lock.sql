do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_010')<>'object'
     or coalesce(p_payload->'reconstruction_010'->>'origin','') not in
        ('manual_confinement_by_first','accidental_latch_after_maintenance','knowledge_and_order_by_first')
     or coalesce(p_payload->'reconstruction_010'->>'door','') not in
        ('independent_reclose_after_contact','panic_reclose_after_contact','pressured_reclose_after_contact')
     or coalesce(p_payload->'reconstruction_010'->>'signal','') not in
        ('noise_witness_without_identification','credible_warning_read_ignored','unauthorized_presence_misdirection')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_010'))<>3
   then raise exception 'invalid 010 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 010 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '010 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_009'',case when r.scenario_id=''009'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_009'' else null end';
 if position('''reconstruction_010'',case when r.scenario_id=''010''' in src)=0 then
   if position(field in src)=0 then raise exception '010 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_010'',case when r.scenario_id=''010'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_010'' else null end');
 end if;
 execute src;
end $m$;