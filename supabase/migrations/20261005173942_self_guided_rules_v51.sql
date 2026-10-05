-- Inside Grey Room v51 — self-guided Lawyer/Suspect rules across scenarios 001–034.
-- Ordinary Lawyer conversations outside the Grey Room are free and untimed.
-- Every Suspect may request one private 01:00 Lawyer pause during their own interrogation, once per cycle.

update public.igr_v4_scenario_packs sp
set pack=jsonb_set(
  sp.pack,
  '{role_notes}',
  coalesce(sp.pack->'role_notes','{}'::jsonb)
  || jsonb_build_object(
    'suspect',coalesce(sp.pack->'role_notes'->'suspect','{}'::jsonb)||jsonb_build_object(
      'anchors','Hors Grey Room, les échanges avec l’Avocat sont libres et sans chronomètre. Tous les Suspects, qu’ils soient client officiel ou non, peuvent demander pendant leur propre interrogatoire une pause privée de 01:00 avec un Avocat, une fois par cycle. Le chrono de l’interrogatoire se suspend puis reprend exactement où il s’était arrêté. Pour un non-client, cette consultation ponctuelle ne crée pas de représentation.'
    ),
    'maitre',coalesce(sp.pack->'role_notes'->'maitre','{}'::jsonb)||jsonb_build_object(
      'anchors','Un Avocat a un seul client officiel. Une fois accepté, ce client reste rattaché à lui pour toute l’affaire et l’Avocat l’accompagne lors des procédures officielles qui le concernent. Hors Grey Room, les échanges sont libres et sans chronomètre avec le client comme avec les autres Suspects. Pendant son propre interrogatoire, tout Suspect peut demander un aparté privé de 01:00, une fois par cycle ; pour le client officiel, il s’agit simplement d’un aparté confidentiel avec son propre Avocat.'
    )
  ),
  true
)
where sp.scenario_id between '001' and '034';
