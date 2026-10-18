/**
 * Private-authoring QA, no plot content added to the public repository.
 * Usage: node scripts/v90-private-variant-check.mjs /path/outside/repo/manuscripts.json
 * The CLI never prints private card contents, paths, or evidence text.
 * It does NOT activate or deploy variants.
 */
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {auditVariantDossier,canActivateVariantDossier} from './v88-narrative-variant-gates.mjs';

function validateBatch(packages) {
  if(!Array.isArray(packages)) throw Error('invalid_private_batch_format');
  const issues=[];
  let versions=0, cards=0, links=0, evidence=0;
  const seen=new Set();
  for(const pack of packages){
    if(seen.has(pack?.id)) issues.push({code:'duplicate_dossier',at:'dossier'});
    seen.add(pack?.id);
    const variants=pack?.variants;
    if(!Array.isArray(variants)||variants.length!==3){
      issues.push({code:'variants_missing',at:'dossier:'+String(pack?.id||'?')});
      continue;
    }
    versions+=variants.length;
    for(const v of variants){
      cards+=Array.isArray(v?.private_cards)?v.private_cards.length:0;
      links+=Object.values(v?.relationships||{}).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0);
      evidence+=Array.isArray(v?.revelations)?v.revelations.length:0;
      if(v?.status==='ready'&&!v?.human_review_approved)
        issues.push({code:'ready_without_author_approval',at:'dossier:'+pack.id+':variant:'+v.id});
      const types=new Set((Array.isArray(v?.revelations)?v.revelations:[]).map(e=>e.kind));
      if(!['guaranteed','conditional','missable'].every(k=>types.has(k)))
        issues.push({code:'revelation_types_incomplete',at:'dossier:'+pack.id+':variant:'+v.id});
      if(v?.public_briefing && String(v.public_briefing).includes('slot '))
        issues.push({code:'public_briefing_internal_slot_leak',at:'dossier:'+pack.id+':variant:'+v.id});
    }
    // Deep audit is forced onto a disposable copy: editorial 'review' does NOT
    // allow bypassing the strict v88 'ready' checks.
    const working=structuredClone(pack);
    for(const variant of working.variants){
      variant.status='ready';
      variant.human_review_approved=true; // QA simulation only; never persisted
    }
    issues.push(...auditVariantDossier(working));
    if(!pack.variants.every(v=>v.status==='ready'&&v.human_review_approved===true)&&
      canActivateVariantDossier(pack)){
      issues.push({code:'unapproved_variant_would_activate',at:'dossier:'+pack.id});
    }
  }
  return {issues,summary:{dossiers:packages.length,variants:versions,cards,
    directed_links:links,revelations:evidence,ready_dossiers:
      packages.filter(d=>canActivateVariantDossier(d)).length}};
}

function synthetic() {
  const mkVariant=(id)=>({
    id,status:'review',human_review_approved:false,
    canonical_direction:'A distinct causal chain '+id,
    public_briefing:'A shared event, with competing explanations.',
    final_reveal:'An authored cause with a tested explanation.',
    invariants_respected:['Shared frame'],cross_episode_dependencies:[],
    canonical_truth:{
      summary:'An independent cause '+id,
      timeline:[{id:'a',what:'First event',relative_order:'first'},
        {id:'b',what:'Second event',relative_order:'second'},
        {id:'c',what:'Third event',relative_order:'third'}],
      responsibility_by_slot:{'1':0,'2':2}
    },
    private_cards:[1,2].map(slot=>({
      slot,identity:'A defined character',what_you_know:'A private fact',
      what_you_hide:'A justified secret',your_chronology:'A coherent order',
      objective:'A personal stake',conversation_hooks:['Ask about the first event','Ask about the last event']})),
    relationships:{
      '1':[{target_slot:2,known_fact:'Previously met',conversation_tension:'What did you see?'}],
      '2':[{target_slot:1,known_fact:'Previously met',conversation_tension:'What did you see?'}]
    },
    revelations:[
      {id:'r1',canonical_event_id:'a',title:'Initial fact',text:'Evidence based on known chronology',kind:'guaranteed',min_cycle:1,audience:'investigation'},
      {id:'r2',canonical_event_id:'b',title:'Optional check',text:'Procedure result',kind:'conditional',trigger_action:'official_request',min_cycle:2,audience:'investigation'},
      {id:'r3',canonical_event_id:'c',title:'Optional discovery',text:'Another result',kind:'missable',min_cycle:3,audience:'investigation'}
    ]
  });
  return [{id:'999',suspect_count:2,public_anchor:'An event occurs',
    variants:['A','B','C'].map(mkVariant)}];
}

if(process.argv[2]==='--self-test'){
  const result=validateBatch(synthetic());
  assert.deepEqual(result.issues,[]);
  assert.equal(result.summary.variants,3);
  assert.equal(result.summary.ready_dossiers,0);
  const broken=synthetic();broken[0].variants[0].revelations[0].canonical_event_id='never_happened';
  assert(validateBatch(broken).issues.some(x=>x.code==='invalid_or_unfounded_revelation'));
  console.log('v90 authoring QA self-test OK (no real plot used)');
}else{
  if(!process.argv[2])throw Error('private_manuscript_file_required');
  const content=JSON.parse(await readFile(process.argv[2],'utf8'));
  const report=validateBatch(content);
  console.log(JSON.stringify(report.summary,null,2));
  if(report.issues.length){
    // Only issue codes, dossier IDs and variant IDs: no spoilers or file paths.
    for(const issue of report.issues)console.error(issue.code+' '+issue.at);
    process.exitCode=1;
  }else console.log('v90 strict structural authoring QA passed; human review still required');
}
