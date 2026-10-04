-- Inside Grey Room v41 — finish the bespoke suspect objectives for scenario 001.
update public.igr_v4_scenario_packs
set pack=jsonb_set(
  jsonb_set(
    pack,
    '{suspects,1,objective_main}',
    to_jsonb('Évite que l’enquête relie ta présence au coup mortel. Appuie-toi sur la première dispute pour expliquer le désordre sans inventer d’alibi.'::text),
    true
  ),
  '{suspects,2,objective_main}',
  to_jsonb('Fais établir que ton silence et ta proximité de la chambre te rendent suspect, mais ne font pas de toi l’auteur du meurtre.'::text),
  true
)
where scenario_id='001';
