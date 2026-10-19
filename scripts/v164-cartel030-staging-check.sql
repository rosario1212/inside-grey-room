-- v164: review-only audit. Read counts, never publish manuscript content.
-- Execute with a trusted privileged DB connection, not from the browser.
with drafts as (
 select variant_id, editorial_status, author_review_approved, design
 from igr_private.igr_v164_030_design_drafts
), suspect_proofs as (
 select d.variant_id, e.value->>'subject_id' subject,
        e.value->>'source_root' source_root,
        (e.value->>'cycle_min')::int cycle_min,
        e.value->>'release_condition' release_type
 from drafts d cross join lateral jsonb_array_elements(d.design->'suspect_evidence') e
), per_suspect as (
 select variant_id, subject, count(*) proof_options,
 count(distinct source_root) independent_origins,
 count(*) filter (where release_type='guaranteed' and cycle_min <= 2) guaranteed_by_c2,
 count(*) filter (where release_type='guaranteed') guaranteed_by_c3
 from suspect_proofs group by variant_id,subject
), per_variant as (
 select variant_id,
 count(*) suspects,
 min(proof_options) min_options,
 min(independent_origins) min_origins,
 min(guaranteed_by_c2) min_guaranteed_by_c2,
 min(guaranteed_by_c3) min_guaranteed_by_c3
 from per_suspect group by variant_id
), corrupt_options as (
 select d.variant_id, o.key as role,
 count(*) evidence_options,
 count(*) filter (where e.value->>'release_condition'='guaranteed') guaranteed,
 count(*) filter (where (e.value->>'source_kind') in ('audit d''accès','journal officiel des accès','registre de révision')) audit_traces
 from drafts d cross join lateral jsonb_each(d.design->'corruption_role_alternatives') o
 cross join lateral jsonb_array_elements(o.value->'evidence') e
 group by d.variant_id,o.key
), corrupt_coverage as (
 select variant_id,count(distinct role) roles,min(evidence_options) min_options,
 min(guaranteed) min_guaranteed,min(audit_traces) min_audit_traces
 from corrupt_options group by variant_id
)
select d.variant_id,d.editorial_status,d.author_review_approved,
 pv.suspects,pv.min_origins,pv.min_guaranteed_by_c2,pv.min_guaranteed_by_c3,
 cc.roles corrupt_role_options,cc.min_guaranteed corrupt_min_guaranteed,
 cc.min_audit_traces,
 (pv.suspects=3 and pv.min_origins>=3
  and pv.min_guaranteed_by_c2>=2 and pv.min_guaranteed_by_c3>=3
  and cc.roles=4 and cc.min_guaranteed>=2 and cc.min_audit_traces>=1
  and not d.author_review_approved and d.editorial_status='review') as passes_structural_draft_gate
from drafts d join per_variant pv using (variant_id)
join corrupt_coverage cc using (variant_id)
order by d.variant_id;
