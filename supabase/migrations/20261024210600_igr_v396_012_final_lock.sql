do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_012')<>'object'
     or coalesce(p_payload->'reconstruction_012'->>'directive','') not in
        ('ordre_explicite_de_retenir','consigne_de_discussion_detournee','aucun_ordre_initial')
     or coalesce(p_payload->'reconstruction_012'->>'violence','') not in
        ('coups_ajoutes_hors_ordre','coups_pour_imposer_consigne','violences_et_retention_autonomes')
     or coalesce(p_payload->'reconstruction_012'->>'reaction','') not in
        ('direction_assume_retention','chef_averti_mais_inactif','chef_organise_couverture')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_012'))<>3
   then raise exception 'invalid 012 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 012 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '012 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_011'',case when r.scenario_id=''011'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_011'' else null end';
 if position('''reconstruction_012'',case when r.scenario_id=''012''' in src)=0 then
   if position(field in src)=0 then raise exception '012 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_012'',case when r.scenario_id=''012'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_012'' else null end');
 end if;
 execute src;
end $m$;