-- Inside Grey Room v37 — explicit suspect objectives for dossiers 001–020.
-- Responsibility levels already belong to the authoritative scenario truth.
-- Keep them server-side and only expose the objective belonging to the player's own suspect slot.

begin;

with rebuilt as (
  select
    p.scenario_id,
    jsonb_agg(
      s || jsonb_build_object(
        'objective_main',
        concat(
          case coalesce(nullif(p.pack->'truth'->'levels'->>((ord - 1)::int), '')::int, 1)
            when 3 then 'Minimise tes faits.'
            when 2 then 'Minimise ta part de responsabilité et distingue-la de celle des autres.'
            when 1 then 'Limite ta responsabilité à ce que tu as réellement fait.'
            else 'Fais reconnaître que tu n’es pas responsable du fait principal.'
          end,
          case
            when nullif(btrim(s->>'position'), '') is not null then ' ' || btrim(s->>'position')
            else ''
          end
        )
      )
      order by ord
    ) as suspects
  from public.igr_v4_scenario_packs p
  cross join lateral jsonb_array_elements(coalesce(p.pack->'suspects', '[]'::jsonb)) with ordinality as x(s, ord)
  where p.scenario_id between '001' and '020'
  group by p.scenario_id, p.pack
)
update public.igr_v4_scenario_packs p
set pack = jsonb_set(p.pack, '{suspects}', r.suspects, true),
    updated_at = now()
from rebuilt r
where p.scenario_id = r.scenario_id;

-- Heal already-created standard rooms too, so an in-progress playtest does not
-- need to be recreated merely to receive the clearer private objective.
update public.igr_v4_players pl
set private_state = coalesce(pl.private_state, '{}'::jsonb)
  || jsonb_build_object('objective_main', suspect_card->>'objective_main')
from public.igr_v4_rooms r
join public.igr_v4_scenario_packs packs on packs.scenario_id = r.scenario_id
cross join lateral jsonb_array_elements(coalesce(packs.pack->'suspects', '[]'::jsonb)) with ordinality as x(suspect_card, ord)
where pl.room_code = r.code
  and r.scenario_id between '001' and '020'
  and pl.public_role = 'suspect'
  and pl.internal_slot = ord::int
  and nullif(suspect_card->>'objective_main', '') is not null;

commit;
