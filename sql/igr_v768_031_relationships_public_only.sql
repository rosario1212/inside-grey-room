-- Private-room relation repair for dossier 031.
-- Every statement below follows only from the room's established shared public
-- setup: the three commando leaders belong to the network and are arrested in
-- the same case following the ambush. Their private acts are NEVER inferred here.
-- The authoritative sync still resolves target slot to the actual player name,
-- and exposes only the relation list associated with the requesting player.
-- Idempotent: never overwrite an existing, subsequently authored relation set.
UPDATE public.igr_v4_scenario_packs p
SET pack=pg_catalog.jsonb_set(p.pack,'{relations}',
  pg_catalog.jsonb_build_object(
    '1',pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('slot',2,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.'),
      pg_catalog.jsonb_build_object('slot',3,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.')
    ),
    '2',pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('slot',1,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.'),
      pg_catalog.jsonb_build_object('slot',3,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.')
    ),
    '3',pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('slot',1,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.'),
      pg_catalog.jsonb_build_object('slot',2,'text','Il fait partie des responsables arrêtés dans la même affaire que toi après l’embuscade. Tu ne connais pas nécessairement ses décisions personnelles.')
    )
  ),true)
WHERE p.scenario_id='031'
  AND pg_catalog.jsonb_array_length(pg_catalog.coalesce(p.pack#>'{relations,1}','[]'::jsonb))=0
  AND pg_catalog.jsonb_array_length(pg_catalog.coalesce(p.pack#>'{relations,2}','[]'::jsonb))=0
  AND pg_catalog.jsonb_array_length(pg_catalog.coalesce(p.pack#>'{relations,3}','[]'::jsonb))=0;
