#!/usr/bin/env node
// OMERTA V8 PUBLIC REVIEW TEST — no private variants, no database reads or writes.
import {readFile} from 'node:fs/promises';
const contract=JSON.parse(await readFile('qa/omerta-v8-mafia-release-contract.json','utf8'));
const content=await readFile('docs/OMERTA_SANTORO_V8_VIOLENCE_INDIC_FAMILY_TREE.md','utf8');
const tree=await readFile(contract.family_view.script,'utf8');
const html=await readFile(contract.family_view.entry,'utf8');
const css=await readFile(contract.family_view.style,'utf8');
const errors=[];
const check=(v,s)=>{if(!v)errors.push(s)};
const ids=['021','022','023','024','025'];
check(contract.version==='V8','V8 version');
check(contract.case_ids.join(',')===ids.join(','),'OMERTA scope must be exactly 021..025');
check(contract.absolute_rules?.length===4,'Four laws are mandatory');
check(contract.cases?.length===5,'Five cases are mandatory');
check(/80\s*%/.test(content)&&/20\s*%/.test(content),'80/20 rule must be explained');
check(/personnalité/i.test(content)&&/acting|comédie/i.test(content),'Player personality preserved');
check(/A\/B\/C/.test(content),'Replay variants A/B/C required');
check(/CARTEL/.test(content),'CARTEL exclusion must be explicit');
const seen=new Set();
for(const c of contract.cases){
 check(!seen.has(c.id),'duplicate '+c.id);seen.add(c.id);
 check(ids.includes(c.id),'unexpected '+c.id);
 check(c.local_story?.length>=3,'specific story '+c.id);
 check(c.shared_world?.length>=3,'shared world anchors '+c.id);
 check(c.c3_independent_sources>=2,'C3 independent sources '+c.id);
 check(c.cycles?.length===3,'3 cycles '+c.id);
 check(c.crime?.length>=2,'criminal stakes '+c.id);
 check(typeof c.informant==='string','informant treatment explicit '+c.id);
 const part=content.split('## '+c.id+' — ')[1]?.split('\n---\n')[0]||'';
 check(Boolean(part),'written V8 dossier '+c.id);
 check(/\*\*C1/.test(part)&&/\*\*C2/.test(part)&&/\*\*C3/.test(part),'C1-C3 written '+c.id);
 check(/\*\*Fin autonome/.test(part),'independent ending '+c.id);
}
const informant=contract.informant_rules;
check(informant?.presence_known_to_public===false,'Informant presence must stay private');
check(informant?.public_tree_can_reveal===false,'Tree must never reveal informant');
check(informant?.never_required_to_solve===true,'Informant cannot gate proof');
for(const field of contract.family_view.must_never_read){
 // Search actual executable accesses, excluding comments and literals if present.
 const code=tree.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 check(!new RegExp('(?:\\.|\\[|\\b)'+field+'\\b').test(code),'Public family tree refers to forbidden '+field);
}
check(html.includes(contract.family_view.script),'Family tree script wired into index');
check(html.includes(contract.family_view.style),'Family tree CSS wired into index');
for(const title of ['Don Santoro','Consigliere','Sottocapo','Capo','Soldato','Associato','Contabile']){
 check(tree.includes(title),'Missing playable rank '+title);
}
for(const name of ['Vittorio Santoro','Matteo Bellini','Enzo Rinaldi','Luca Moretti','Rocco Fiore','Giuseppe Ferraro']){
 check(!tree.includes(name),'Fixed criminal identity in a playable rank: '+name);
}
for(const blood of ['Adriano Santoro','Elena Santoro']){
 check(tree.includes(blood),'Known blood family missing '+blood);
}
check(tree.includes('preferred_role')&&tree.includes('pseudo'),'Player-pseudo ownership not implemented');
check(tree.includes('os9-tree-open')&&tree.includes('updateGameShortcut'),'In-game family tree shortcut missing');
check(tree.includes('FAMILLE DE SANG')===false||tree.includes('BLOOD'),'Separate blood family not supported');
check(css.includes('os9-tree-shortcut'),'Tree access not styled for gameplay');
check(!tree.includes('Verri')&&!tree.includes('Malaspina'),'Outdated family name in viewer');
check(css.includes('@media'),'Responsive CSS missing');
check(Object.keys(contract.gates||{}).length>=8,'QA release checklist incomplete');

if(errors.length){
 console.error('OMERTA V8 REVIEW FAIL: '+errors.length+' issue(s)');
 errors.forEach(e=>console.error(' - '+e));process.exitCode=1;
}else{
 console.log('OMERTA V8 PUBLIC REVIEW PASS — 5 mafia cases, 4 laws, 80/20, safe Santoro viewer.');
 console.log('This is NOT private A/B/C approval, live playtest or deployment.');
}
