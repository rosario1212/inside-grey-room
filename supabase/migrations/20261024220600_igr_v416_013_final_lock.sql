do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_013')<>'object'
     or coalesce(p_payload->'reconstruction_013'->>'knowledge','') not in
        ('logistique_savait_violence','logistique_risque_sans_cible','logistique_alerte_et_suspension')
     or coalesce(p_payload->'reconstruction_013'->>'command','') not in
        ('ordre_nominatif_transmis','financeur_nomme_cible_separement','suspension_jamais_confirmee')
     or coalesce(p_payload->'reconstruction_013'->>'security','') not in
        ('acces_vendu_et_journal_retouche_apres','securite_payee_separement','acces_prepare_et_logs_alteres_avant')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_013'))<>3
   then raise exception 'invalid 013 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 013 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '013 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_012'',case when r.scenario_id=''012'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_012'' else null end';
 if position('''reconstruction_013'',case when r.scenario_id=''013''' in src)=0 then
   if position(field in src)=0 then raise exception '013 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_013'',case when r.scenario_id=''013'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_013'' else null end');
 end if;
 execute src;
end $m$;