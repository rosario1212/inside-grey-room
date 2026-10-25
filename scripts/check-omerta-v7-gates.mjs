#!/usr/bin/env node
// Inside Grey Room OMERTA V7 — independent editorial release gates (NO backend access).
// Default validates public world bible + structured 80/20 acceptance contract.
// The optional --release QA_REPORT.json requires a sanitized human/technical approval
// summary with 15 private variant approvals but never prints private story content.
// No data migration, SQL execution, network access, secrets or publication.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const contract=JSON.parse(await readFile('qa/omerta-v7-release-contract.json','utf8'));
const bible=await readFile('docs/OMERTA_SANTORO_FIVE_STANDALONE_CASES_V7.md','utf8');
const errors=[];
function check(test,description){if(!test)errors.push(description)}
const ids=['021','022','023','024','025'];
check(contract.dlc==='OMERTA','Wrong DLC');
check(contract.version==='V7.0','Wrong contract version');
check(JSON.stringify(contract.scope)===JSON.stringify(ids),'Scope not exactly 021–025');
check(contract.universe.includes('Santoro'),'Shared universe missing Santoro');
check(Object.keys(contract.rule_text||{}).length===4,'Exactly four non-negotiable rules required');
check(ids.length===contract.cases?.length,'Exactly five cases');
check(/80%.*20%/i.test(contract.shared_world_fraction_editorial),'Missing 80/20 balance');
check(!/Verri|Malaspina|Lucifora/i.test(bible),'An obsolete family name leaked into current bible');
check(/hors de portée.*cartel/i.test(bible),'CARTEL exclusion not declared');
check(/personnalité|personnalités/i.test(bible)&&/sans.*comédie|ne .* dicte|jamais un accent/i.test(bible),'Player personality policy too weak');
check(/aucune.* autre|non dans|autonom/i.test(bible),'Independent case policy missing');
const seen=new Set();
for(const [index,c] of (contract.cases||[]).entries()){
 const id=ids[index];
 check(c?.id===id,'Case missing or out of order '+id);
 if(!c)continue;
 check(!seen.has(c.id),'Duplicate '+c.id);seen.add(c.id);
 check(Array.isArray(c.depends_on)&&c.depends_on.length===0,'Inter-case dependency '+id);
 check(Array.isArray(c.crossovers)&&c.crossovers.length>0,'Shared world needs real cues '+id);
 check(Array.isArray(c.player_slot_roles)&&c.player_slot_roles.length>=4,'At least four useful positions '+id);
 check(Array.isArray(c.variant_ids)&&c.variant_ids.join(',')==='A,B,C','Variant A/B/C absent '+id);
 check(Array.isArray(c.variant_axes)&&c.variant_axes.length>=3,'No meaningful replay axes '+id);
 check(Array.isArray(c.evidence_c3)&&new Set(c.evidence_c3).size>=2,'No two distinct C3 proof sources '+id);
 check(Array.isArray(c.evidence_c1)&&c.evidence_c1.length>0,'C1 lacks proof '+id);
 check(Array.isArray(c.evidence_c2)&&c.evidence_c2.length>0,'C2 lacks proof '+id);
 const marker='## '+id+' — ';
 const body=bible.split(marker)[1]?.split('\n---\n')[0]||'';
 check(Boolean(body),'Missing drafted story '+id);
 for(const section of ['**C1 —','**C2 —','**C3 —','**A/B/C'])
  check(body.includes(section),'Story '+id+' missing '+section);
 check(body.includes('**Fin autonome')||body.includes('**Fin autonome :'),'No independent ending for '+id);
 check(body.includes('**Positions')||body.includes('**Positions du joueur'),'No free player-involvement positions '+id);
 check(/Santoro/.test(body),'No Santoro context for '+id);
 check(!/quatre dossiers précédents|dossiers précédents convergent|selon les choix précédents/i.test(body),
  'Legacy campaign continuity still present '+id);
}
check(Object.keys(contract.audit_state||{}).length>=8,'Production audit checklist incomplete');
const releaseIdx=process.argv.indexOf('--release');
if(releaseIdx!==-1){
 const path=process.argv[releaseIdx+1];
 check(Boolean(path),'Release requires external sanitized QA JSON path');
 if(path){
  const qa=JSON.parse(await readFile(path,'utf8'));
  check(qa?.version==='V7.0','Release QA version mismatch');
  check(qa?.dlc==='OMERTA','Release QA wrong DLC');
  for(const [k,v] of Object.entries(contract.audit_state||{}))
   check(v===true,'Editorial release state is still blocked: '+k);
  for(const id of ids){
   const result=qa?.cases?.[id];
   check(result?.autonomy_playtest===true,'Autonomy human test incomplete '+id);
   check(result?.player_freedom_playtest===true,'Agency human test incomplete '+id);
   check(result?.no_softlock_test===true,'No-softlock test incomplete '+id);
   check(result?.replayability_playtest===true,'Replayability playtest incomplete '+id);
   check(result?.case_evidence_security_qa===true,'Evidence/security QA incomplete '+id);
   check(result?.variants_approved?.join(',')==='A,B,C','All 3 private variants not verified '+id);
  }
 }
}
if(errors.length){
 console.error('OMERTA V7 GATES FAILED ('+errors.length+'):');
 for(const e of errors)console.error(' - '+e);
 process.exitCode=1;
}else{
 console.log('OMERTA V7 '+(releaseIdx===-1?'PUBLIC EDITORIAL':'RELEASE')+' structure checks PASS.');
 if(releaseIdx===-1)console.log('Note: public editorial PASS does NOT certify playability, private A/B/C, or deployment.');
}
