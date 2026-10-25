// OMERTA V6 — read-only editorial lint for a local, authorized export of public packs.
// Usage: node scripts/check-omerta-80-20-v6.mjs path/to/public-packs.json
// Accepts [{scenario_id:"021",pack:{...}}, ...] or { "021":{...}, ... }.
// Never reads or prints private variant manuscripts. No network or database writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=process.argv[2];
if(!source) throw Error('Usage: node scripts/check-omerta-80-20-v6.mjs <public-pack-export.json>');
const raw=JSON.parse(await readFile(source,'utf8'));
const asPairs=Array.isArray(raw)
 ? raw.map(x=>[String(x.scenario_id),x.pack])
 : Object.entries(raw).map(([id,value])=>[id,value?.pack||value]);
const packs=new Map(asPairs);
const ids=['021','022','023','024','025'];
const defects=[];
const required=['context','suspects','trames','truth'];
const outdatedNames=/\b(Verri|Famiglia Verri)\b/i;
const crossDeps=/(dossiers? précédents?|épisodes? précédents?|selon les choix précédents|quatre dossiers ont laissé|les dossiers précédents convergent|survivant ou informateur selon les choix précédents)/i;
for(const id of ids){
 const pack=packs.get(id);
 if(!pack){defects.push(id+': missing pack');continue}
 for(const key of required)if(!pack[key])defects.push(id+': missing '+key);
 const str=JSON.stringify(pack);
 if(outdatedNames.test(str))defects.push(id+': old Verri canon still present');
 if(crossDeps.test(str))defects.push(id+': references other episodes or imported choices');
 if(!str.includes('Santoro'))defects.push(id+': missing Santoro canon');
 if(!Array.isArray(pack.suspects)||pack.suspects.length<3)defects.push(id+': insufficient positions');
 if(!Array.isArray(pack.trames)||pack.trames.length<3)defects.push(id+': incomplete 3-cycle trames');
 if(Array.isArray(pack.trames)){
  for(let cycle=1;cycle<=3;cycle++)
   if(!pack.trames.some(t=>Number(t.min_cycle)===cycle))
    defects.push(id+': no canonical beat cycle '+cycle);
 }
 if(Array.isArray(pack.suspects)){
  pack.suspects.forEach((person,idx)=>{
   if(!person.place&&!person.position)defects.push(id+': seat '+(idx+1)+' missing involvement');
   // Soft flag for review; nothing in this test evaluates player emotions.
   if(/tu es (?:froid|violent|cruel|paranoïaque|ambitieux|colérique)/i.test(JSON.stringify(person)))
     defects.push(id+': forced personality in seat '+(idx+1));
  });
 }
}
const expected=new Set(ids);
for(const id of packs.keys())if(!expected.has(id))defects.push('out-of-scope '+id);
if(defects.length){
 console.error('OMERTA 80/20 — NOT READY ('+defects.length+' findings):');
 defects.forEach(d=>console.error(' - '+d));
 process.exitCode=1;
}else{
 console.log('OMERTA 80/20 structural public-pack checks passed (5 standalone Santoro cases).');
 console.log('Not a playtest, variant validation, permission audit or deployment guarantee.');
}
