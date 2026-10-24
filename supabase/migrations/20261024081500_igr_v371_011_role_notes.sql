-- Descriptions publiques, sans divulgation des variantes A/B/C.
update public.igr_v4_scenario_packs
set pack=jsonb_set(
 jsonb_set(
  jsonb_set(pack,'{role_notes,enqueteur,anchors}',to_jsonb('Reconstitue les trente-six heures en séparant l’ordre écrit, les décisions sur place, les alertes et les modifications des rapports. Un grade ne prouve pas un acte.'::text),true),
 '{role_notes,analyste,anchors}',to_jsonb('Construis une matrice : pour chaque officier, ce qu’il savait, ce qu’il pouvait arrêter et ce qu’il a réellement fait. Recoupe deux sources indépendantes avant de conclure.'::text),true),
 '{role_notes,suspect,anchors}',to_jsonb('Défends les décisions propres à ta fonction sans inventer de document ni accuser sans information personnelle. Aucun Avocat ne participe à ce dossier.'::text),true
),updated_at=clock_timestamp()
where scenario_id='011';
