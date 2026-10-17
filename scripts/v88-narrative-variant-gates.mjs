/**
 * v88 narrative gates: spoiler-free validation, NEVER variant selection.
 * All hidden author manuscripts remain outside this public repository.
 */
export const VARIANT_IDS = Object.freeze(['A','B','C']);
const statuses=new Set(['outline','review','ready']);
const kinds=new Set(['guaranteed','conditional','missable']);
const audiences=new Set(['public','investigation','role','player']);
const validText=s=>typeof s==='string'&&s.trim().length>0;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const unique=a=>new Set(a).size===a.length;

export function auditVariantDossier(dossier) {
  const issues=[];
  const fail=(code,at)=>issues.push({code,at});
  if(!obj(dossier)||!/^\d{3}$/.test(String(dossier.id||'')))
    return [{code:'invalid_dossier_id',at:'dossier'}];
  const id='dossier:'+dossier.id;
  if(!Number.isInteger(dossier.suspect_count)||dossier.suspect_count<2||dossier.suspect_count>12)
    fail('invalid_suspect_count',id);
  if(!validText(dossier.public_anchor))fail('missing_public_anchor',id);
  const variants=Array.isArray(dossier.variants)?dossier.variants:[];
  if(!Array.isArray(dossier.variants)||variants.length!==3||!unique(variants.map(v=>v?.id))||
     VARIANT_IDS.some(key=>!variants.some(v=>v?.id===key)))fail('exactly_three_variants_required',id);
  if(!unique(variants.map(v=>String(v?.canonical_direction||'').trim().toLowerCase())))
    fail('indistinguishable_variants',id);
  for(const v of variants){
    const at=id+':variant:'+String(v?.id||'?');
    if(!statuses.has(v?.status))fail('invalid_variant_status',at);
    if(!validText(v?.canonical_direction))fail('missing_canonical_direction',at);
    if(v?.status!=='ready')continue;
    const truth=v.canonical_truth||{},cards=v.private_cards,relations=v.relationships,events=v.revelations;
    if(!validText(truth.summary))fail('missing_canonical_truth',at);
    if(!Array.isArray(truth.timeline)||truth.timeline.length<3||
       truth.timeline.some(t=>!obj(t)||!validText(t.id)||!validText(t.what)||!validText(t.relative_order))||
       !unique((truth.timeline||[]).map(t=>t.id)))fail('incomplete_canonical_timeline',at);
    if(!obj(truth.responsibility_by_slot)||
       Object.keys(truth.responsibility_by_slot).length!==dossier.suspect_count||
       Object.entries(truth.responsibility_by_slot).some(([slot,level])=>
         !Number.isInteger(+slot)||+slot<1||+slot>dossier.suspect_count||
         !Number.isInteger(level)||level<0||level>2))fail('invalid_responsibilities',at);
    if(!Array.isArray(cards)||cards.length!==dossier.suspect_count||
       !unique((cards||[]).map(c=>c.slot)))fail('missing_private_cards',at);
    for(const c of Array.isArray(cards)?cards:[]){
      if(!Number.isInteger(c.slot)||c.slot<1||c.slot>dossier.suspect_count||
         !validText(c.identity)||!validText(c.what_you_know)||!validText(c.what_you_hide)||
         !validText(c.your_chronology)||!validText(c.objective)||
         !Array.isArray(c.conversation_hooks)||c.conversation_hooks.length<2||
         c.conversation_hooks.some(x=>!validText(x)))fail('character_not_playable_without_phone',at+':slot:'+c.slot);
    }
    if(!obj(relations))fail('missing_directed_relationships',at);
    else {
      const links=Object.entries(relations).flatMap(([src,items])=>
        Array.isArray(items)?items.map(item=>({src:+src,item})):[{src:+src,item:null}]);
      if(links.length<dossier.suspect_count)fail('too_few_relationships',at);
      for(const {src,item} of links)
        if(src<1||src>dossier.suspect_count||!obj(item)||
           !Number.isInteger(item.target_slot)||item.target_slot<1||
           item.target_slot>dossier.suspect_count||item.target_slot===src||
           !validText(item.known_fact)||!validText(item.conversation_tension))
          fail('bad_directed_relationship',at);
      // Directed asymmetry is deliberately allowed, subject to author review.
    }
    if(!Array.isArray(events)||events.length<3||!unique((events||[]).map(e=>e.id)))
      fail('insufficient_or_duplicate_revelations',at);
    const facts=new Set((Array.isArray(truth.timeline)?truth.timeline:[]).map(e=>e.id));
    for(const e of Array.isArray(events)?events:[]){
      const place=at+':event:'+String(e.id||'?');
      if(!validText(e.id)||!validText(e.canonical_event_id)||!facts.has(e.canonical_event_id)||
         !validText(e.text)||!validText(e.title)||!kinds.has(e.kind)||
         !audiences.has(e.audience)||!Number.isInteger(e.min_cycle)||
         e.min_cycle<1||e.min_cycle>3)fail('invalid_or_unfounded_revelation',place);
      if(e.kind==='conditional'&&!validText(e.trigger_action))fail('conditional_revelation_without_trigger',place);
      if(e.kind==='guaranteed'&&e.trigger_action)fail('guaranteed_evidence_depends_on_optional_action',place);
      if(e.audience==='role'&&!validText(e.role))fail('role_audience_unset',place);
      if(e.audience==='player'&&(!Number.isInteger(e.target_slot)||e.target_slot<1||e.target_slot>dossier.suspect_count))fail('player_audience_unset',place);
    }
    if(!(Array.isArray(events)?events:[]).some(e=>e.kind==='guaranteed'))fail('no_required_story_foundation',at);
    if(!validText(v.public_briefing)||v.public_briefing.length>780)fail('briefing_not_usable',at);
    if(!validText(v.final_reveal))fail('reveal_unwritten',at);
    if(!Array.isArray(v.invariants_respected)||v.invariants_respected.length===0||v.invariants_respected.some(x=>!validText(x)))fail('invariants_not_approved',at);
    if(!Array.isArray(v.cross_episode_dependencies))fail('continuity_not_audited',at);
    if(v.human_review_approved!==true)fail('not_approved_by_author',at);
  }
  const finished=variants.filter(v=>v?.status==='ready');
  if(finished.length>1&&!unique(finished.map(v=>JSON.stringify(v.canonical_truth??null))))fail('identical_canonical_truth_across_variants',id);
  if(dossier.saga&&(!validText(dossier.saga.collection)||!VARIANT_IDS.includes(dossier.saga.branch)))
    fail('invalid_saga_lock',id);
  return issues;
}

export function canActivateVariantDossier(dossier) {
  return auditVariantDossier(dossier).length===0&&
    Array.isArray(dossier.variants)&&dossier.variants.length===3&&
    dossier.variants.every(v=>v.status==='ready'&&v.human_review_approved===true);
}

export function auditSagaContinuity(chapters) {
  if(!Array.isArray(chapters)||chapters.length<2)return [];
  const first=chapters[0]?.saga;
  return chapters.filter(c=>!c.saga||c.saga.collection!==first?.collection||
    c.saga.branch!==first?.branch).map(c=>({code:'incompatible_saga_branch',at:'dossier:'+String(c.id||'?')}));
}
