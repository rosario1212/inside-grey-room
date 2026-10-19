-- v165 CARTEL 030 private authoring audit, results only; no plot text is selected.
-- Source of truth: private drafts intentionally NOT used by production runtime.
with r as (
 select variant_id,editorial_status,author_review_approved,design,
 jsonb_array_length(design->'character_cards'->'suspect_privates') suspect_cards,
 (select count(*) from jsonb_object_keys(design->'character_cards'->'institution_roles')) role_cards,
 (select count(*) from jsonb_object_keys(design->'character_cards'->'corrupt_overlays')) corrupt_role_alternatives,
 (select count(*) from jsonb_object_keys(design->'directed_relations')) directed_relations,
 (select count(*) from jsonb_array_elements(design->'character_cards'->'suspect_privates') x
  where length(x->>'what_you_know')>20 and length(x->>'what_you_hide')>20
  and length(x->>'what_you_do_not_know')>20
  and jsonb_array_length(x->'conversation_invitations')>=2) complete_suspects,
 (select count(*) from jsonb_each(design->'character_cards'->'institution_roles') x
  where jsonb_array_length(x.value->'can_press')>=4
  and length(x.value->>'variant_opening_question')>20) complete_roles,
 (select count(*) from jsonb_each(design->'character_cards'->'corrupt_overlays') x
  where length(x.value->>'moment')>20
  and length(x.value->>'internal_disagreement')>20
  and x.value->>'revealed_to'='chosen_corrupt_role_only'
  and (x.value->>'opponent_can_appeal')::boolean) complete_overlays,
 (select count(*) from jsonb_each(design->'directed_relations') x
  where length(x.value->>'known_fact')>20
  and length(x.value->>'question_to_ask')>12) complete_relations,
 length(design->'author_public_approach'->>'public_briefing') briefing_length
 from igr_private.igr_v164_030_design_drafts
)
select variant_id,editorial_status,author_review_approved,
 suspect_cards,role_cards,corrupt_role_alternatives,directed_relations,
 complete_suspects,complete_roles,complete_overlays,complete_relations,
 (suspect_cards=3 and role_cards=6
 and corrupt_role_alternatives=4 and directed_relations=6
 and complete_suspects=3 and complete_roles=6
 and complete_overlays=4 and complete_relations=6
 and briefing_length>200 and editorial_status='review'
 and not author_review_approved) passes_unapproved_editorial_structure
from r order by variant_id;
