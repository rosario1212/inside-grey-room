// Tests déterministes de rendu pour la carte privée Santoro.
// Aucune vérité éditoriale, aucun jeton réel, aucune connexion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app-v11.js','utf8');
const start=source.indexOf('function privateCardHtml(){');
const end=source.indexOf('function renderRole(){',start);
assert(start>=0&&end>start,'Canonical private-card renderer not found');
const renderer=source.slice(start,end);
const h=value=>String(value??'').replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const valueBlock=(label,value)=>!value||Array.isArray(value)&&value.length===0?''
  :'<section><strong>'+h(label)+'</strong>'+ (Array.isArray(value)
     ?value.map(x=>'<p>'+h(x)+'</p>').join('')
     :'<p>'+h(value)+'</p>')+'</section>';
const fake={
 identity:'Responsable du trajet',objective:'Évite une désignation formelle pour cet acte',
 what_you_know:'Un point exact est à confirmer.',
 what_you_hide:'Information réservée <secret>',
 your_chronology:'AVANT — poste\nPENDANT — fait\nAPRÈS — recoupement',
 conversation_hooks:['À qui demander une pièce ?','Qui a vu la consigne ?']
};
function render(standalone=true,role='suspect',privateState=fake) {
 const room={scenario_id:'021',status:'playing',phase:'role_reading',cycle:0,
   state:{omerta_standalone:standalone}};
 const scope={STATE:{room:'ABCD',role,playerPseudo:'Joueur',sync:{
    room,player:{id:'player-1',public_role:role,secret_role:'',private_state:privateState}
  }},h,valueBlock,currentScenario:()=>({id:'021'}),displayRole:()=>role,
  roleInfo:()=>({win:'Objectif Verri historique'}),console};
 vm.createContext(scope);
 return vm.runInContext(renderer+'\nprivateCardHtml()',scope);
}
const active=render();
assert(active.includes('Responsable du trajet'));
assert(active.includes('Évite une désignation formelle pour cet acte'));
assert(!active.includes('Objectif Verri historique'),
  'Standalone must never show a contradictory historic win objective');
assert(active.includes('TON OBJECTIF PERSONNEL'));
assert(active.includes('CE QUE TU PEUX DEMANDER'));
assert(active.includes('PENDANT — fait'));
assert(active.includes('AVANT — poste'));
assert(active.includes('APRÈS — recoupement'));
assert(active.includes('&lt;secret&gt;')&&!active.includes('<secret>'));
assert(!render(false).includes('TON OBJECTIF PERSONNEL'),'Historically played Omerta unaffected');
assert(render(false).includes('Objectif Verri historique'));
assert(!render(true,'analyste').includes('TON OBJECTIF PERSONNEL'),
 'The investigators must never render the suspect private dossier');
console.log('OMERTA SANTORO: private card, chronology, objective, legacy isolation & HTML escaping OK');
