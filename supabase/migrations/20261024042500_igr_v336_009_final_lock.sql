do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_009')<>'object'
     or coalesce(p_payload->'reconstruction_009'->>'withdrawal','') not in
        ('explicit_before_continuation','original_note_confirmed_explicit')
     or coalesce(p_payload->'reconstruction_009'->>'decision','') not in
        ('director_ordered_continuation','clinician_signed_continuation','director_rewrote_and_blocked_stop')
     or coalesce(p_payload->'reconstruction_009'->>'decoy','') not in
        ('amnesia_does_not_erase_prior_order','supervision_recommended_stop','unauthorized_copy_not_source_of_refusal')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_009'))<>3
   then raise exception 'invalid 009 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 009 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '009 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_008'',case when r.scenario_id=''008'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_008'' else null end';
 if position('''reconstruction_009'',case when r.scenario_id=''009''' in src)=0 then
   if position(field in src)=0 then raise exception '009 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_009'',case when r.scenario_id=''009'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_009'' else null end');
 end if;
 execute src;
end $m$;