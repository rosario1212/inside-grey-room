-- Inside Grey Room — TERREUR 026 public copy cleanup v31
-- Public context only: no private clues, truth, roles or mechanics are changed.

update public.igr_v4_scenario_packs
set pack = jsonb_set(
  pack,
  '{context}',
  to_jsonb('La ville est en train de tomber. Trois membres présumés d’une organisation terroriste ont été capturés alors que des secteurs entiers échappent au contrôle de l’État. L’enquête porte d’abord sur des atrocités déjà commises, puis une évidence apparaît : un groupe terroriste est encore actif et se rapproche du périmètre de la Grey Room.'::text),
  false
)
where scenario_id = '026';
