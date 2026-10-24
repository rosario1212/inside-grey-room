do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_011')<>'object'
     or coalesce(p_payload->'reconstruction_011'->>'order','') not in
        ('informed_illegal_authorization','explicit_civilian_limits','general_risk_no_specific_authorization')
     or coalesce(p_payload->'reconstruction_011'->>'field','') not in
        ('abusive_execution_with_local_discretion','unauthorized_expansion_with_self_edited_report','unauthorized_expansion_with_coverup_by_control')
     or coalesce(p_payload->'reconstruction_011'->>'halt','') not in
        ('delayed_despite_first_alert','delayed_after_repeated_warnings','delayed_and_directed_coverup')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_011'))<>3
   then raise exception 'invalid 011 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 011 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '011 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_010'',case when r.scenario_id=''010'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_010'' else null end';
 if position('''reconstruction_011'',case when r.scenario_id=''011''' in src)=0 then
   if position(field in src)=0 then raise exception '011 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_011'',case when r.scenario_id=''011'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_011'' else null end');
 end if;
 execute src;
end $m$;