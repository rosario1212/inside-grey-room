do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_015')<>'object'
     or coalesce(p_payload->'reconstruction_015'->>'authority','') not in
        ('direction_refuse_suspension','direction_autorise_arret','direction_absente_blocage_admin')
     or coalesce(p_payload->'reconstruction_015'->>'continuation','') not in
        ('ordre_de_poursuite_impose','clinicien_poursuit_malgre_arret','sortie_bloquee_administrativement')
     or coalesce(p_payload->'reconstruction_015'->>'records','') not in
        ('alertes_attenuees_apres_deces','compromis_clinique_masque','delai_sortie_efface')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_015'))<>3
   then raise exception 'invalid 015 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 015 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '015 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_014'',case when r.scenario_id=''014'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_014'' else null end';
 if position('''reconstruction_015'',case when r.scenario_id=''015''' in src)=0 then
   if position(field in src)=0 then raise exception '015 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_015'',case when r.scenario_id=''015'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_015'' else null end');
 end if;
 execute src;
end $m$;