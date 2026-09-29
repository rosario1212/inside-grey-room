-- Inside Grey Room v12.20 — factual guard for the language-only pass.
-- Keeps the colder wording without adding any fact that was not already canonical.

-- Scenario 003: keep the attack explicit without inventing a casualty count.
update public.igr_v4_scenario_packs
set pack = jsonb_set(
             jsonb_set(pack,
               '{context}',
               to_jsonb('Une attaque biologique frappe une gare. La piste remonte au Centre Helios. Plusieurs décisions ont rendu la catastrophe possible.'::text),
               true),
             '{truth,cinematic,final_line}',
             to_jsonb('L’attaque a été rendue possible par plusieurs décisions. Aucune ne disparaît derrière les autres.'::text),
             true),
    updated_at = now()
where scenario_id='003';

-- Scenario 005 / suspect 1: be direct, but do not invent that this player was the historical Masque Blanc.
with direct as (
  select jsonb_build_object(
    'place','Tu connais les anciens crimes du Masque Blanc de très près. Tu n’as pas tué Keller.',
    'chronology','Tu suis les anciens crimes et tu étais proche de l’univers professionnel de Keller.',
    'hide','Tu caches une fascination réelle pour le symbole et des recherches que tu n’as jamais expliquées.',
    'anchors','Tu connais des détails précis du rituel. Cela ne prouve pas que tu as tué Keller.',
    'position','Ton obsession te rend très suspect. Reste sur les faits : tu n’as pas tué Keller.'
  ) as s
)
update public.igr_v4_scenario_packs p
set pack = jsonb_set(
             jsonb_set(p.pack,
               '{suspects,0}',
               (p.pack->'suspects'->0) || d.s,
               true),
             '{truth,cinematic,characters,0}',
             (p.pack#>'{truth,cinematic,characters,0}') || (d.s - 'position'),
             true),
    updated_at = now()
from direct d
where p.scenario_id='005';
