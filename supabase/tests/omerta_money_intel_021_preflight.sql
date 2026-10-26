-- À exécuter après application de la migration sur une base de TEST.
-- Contrôles sans écriture : aucune salle ni action de production n'est modifiée.
do $$
begin
 if to_regprocedure('public.igr_omerta_money_intel_options(text,uuid)') is null
    or to_regprocedure('public.igr_omerta_money_intel_send(text,uuid,text)') is null
 then raise exception 'RPC financières manquantes'; end if;
 if not has_function_privilege('anon','public.igr_omerta_money_intel_options(text,uuid)','EXECUTE')
    or not has_function_privilege('anon','public.igr_omerta_money_intel_send(text,uuid,text)','EXECUTE')
 then raise exception 'Accès RPC non configuré'; end if;
 if has_table_privilege('anon','public.igr_v4_actions','SELECT')
    or has_table_privilege('anon','public.igr_v4_events','SELECT')
 then raise exception 'Fuite potentielle de données des actions ou événements'; end if;
 if not (select relrowsecurity from pg_class where oid='public.igr_v4_actions'::regclass)
    or not (select relrowsecurity from pg_class where oid='public.igr_v4_events'::regclass)
 then raise exception 'RLS absent pour les journaux'; end if;
 if not exists(
   select 1 from public.igr_v4_scenario_packs
   where scenario_id='021'
     and (pack->'suspects'->0->>'hide') ilike '%Rinaldi%'
     and (pack->'suspects'->6->>'hide') ilike '%somme supplémentaire%'
     and (pack->'truth'->>'summary') ilike '%paiement%'
 ) then raise exception 'Vérité 021 incompatible avec les cartes de renseignement'; end if;
end;
$$;
