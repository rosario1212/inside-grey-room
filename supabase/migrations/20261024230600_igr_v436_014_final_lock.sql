do $m$
declare src text;anchor text;condition text;field text;
begin
 src=pg_get_functiondef('public.igr_v4_lock_final(text,uuid,jsonb)'::regprocedure);
 condition=$new$
 if r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_014')<>'object'
     or coalesce(p_payload->'reconstruction_014'->>'source','') not in
        ('export_irregulier','procedure_urgence_incomplete','acces_autorise_detourne')
     or coalesce(p_payload->'reconstruction_014'->>'transmission','') not in
        ('vente_volontaire','canal_secours_non_verifie','mandat_emploie_hors_mission')
     or coalesce(p_payload->'reconstruction_014'->>'concealment','') not in
        ('logs_retouches_pour_cacher_faille','alerte_ignoree','fausse_piste_intrusion')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_014'))<>3
   then raise exception 'invalid 014 reconstruction';end if;
 end if;
$new$;
 anchor=' note_text:=left(trim(coalesce(p_payload->>''note'','''')),300);';
 if position('invalid 014 reconstruction' in src)=0 then
   if position(anchor in src)=0 then raise exception '014 verdict validation anchor missing';end if;
   src=replace(src,anchor,condition||anchor);
 end if;
 field='''reconstruction_013'',case when r.scenario_id=''013'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_013'' else null end';
 if position('''reconstruction_014'',case when r.scenario_id=''014''' in src)=0 then
   if position(field in src)=0 then raise exception '014 verdict payload anchor missing';end if;
   src=replace(src,field,field||',''reconstruction_014'',case when r.scenario_id=''014'' and p.public_role in (''enqueteur'',''analyste'') then p_payload->''reconstruction_014'' else null end');
 end if;
 execute src;
end $m$;