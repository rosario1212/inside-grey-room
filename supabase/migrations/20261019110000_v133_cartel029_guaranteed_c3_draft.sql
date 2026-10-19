-- CARTEL 029: two deterministic third-cycle investigation recoupments per
-- A/B/C manuscript. They are backed by P11/P12/P14/P15 supplied server-side
-- regardless of testimony or optional actions. Human review remains PENDING.
-- Never set status=ready, human_review_approved=true or approved_at here.
with links as (
  select m.scenario_id,m.variant_id,
    jsonb_build_array(
      jsonb_build_object(
        'id','029'||m.variant_id||'-r5-guaranteed-responsibility',
        'title','Recoupement indépendant des responsabilités',
        'kind','guaranteed','min_cycle','3','audience','investigation',
        'evidence_ids',jsonb_build_array('P12','P15'),
        'text','Confrontez la chronologie indépendante (P12) et la pièce de responsabilité propre à cette branche (P15). Ces deux éléments restent accessibles même si un témoin refuse de parler.',
        'editorial_provenance',jsonb_build_object(
          'independent_of_optional_actions',true,
          'official_fact_validation','pending',
          'human_source_review','pending',
          'runtime_delivery','igr_v111_029_release')
      ),
      jsonb_build_object(
        'id','029'||m.variant_id||'-r6-guaranteed-fourth-witness',
        'title','Recoupement du quatrième témoin',
        'kind','guaranteed','min_cycle','3','audience','investigation',
        'evidence_ids',jsonb_build_array('P11','P14'),
        'text','La pièce extérieure P11 et le contrôle P14, adapté au profil secret de la partie, permettent de vérifier la déclaration du quatrième témoin sans dépendre de sa coopération.',
        'editorial_provenance',jsonb_build_object(
          'independent_of_optional_actions',true,
          'official_fact_validation','pending',
          'human_source_review','pending',
          'runtime_delivery','igr_v111_029_release')
      )
    ) as additions
  from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id='029' and m.variant_id in ('A','B','C')
    and m.editorial_status='review'
)
update igr_private.igr_v99_variant_manuscripts m
set manuscript=jsonb_set(m.manuscript,'{revelations}',
    coalesce(m.manuscript->'revelations','[]'::jsonb)||links.additions,true)
from links where m.scenario_id=links.scenario_id and m.variant_id=links.variant_id
and not exists(
   select 1 from jsonb_array_elements(coalesce(m.manuscript->'revelations','[]'::jsonb)) x
   where x->>'id'='029'||m.variant_id||'-r5-guaranteed-responsibility'
);
