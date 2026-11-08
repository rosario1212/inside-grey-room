// Deterministic public Santoro display regression. No private manuscript content.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('app-v11.js','utf8');
const omerta=fs.readFileSync('omerta-v12.js','utf8');
const indic=fs.readFileSync('omerta-money-intel-v1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

new vm.Script(app);new vm.Script(omerta);new vm.Script(indic);new vm.Script(sw);

assert.match(app,/if\(\['021','022','023','024','025'\]\.includes\(String\(id\)\)\)return scenario\(id\)\.context/,
  'The cinematic briefing must display the whole canonical Santoro public context');
for(const [id,text] of [
  ['021','Chaque vendredi, les commerçants paient la mafia'],
  ['022','Nino Caruso, qui tient des paris clandestins'],
  ['023','Les familles Santoro, Bellomo et Russo se disputent les revenus des transports'],
  ['024','Un chauffeur, Sandro Vitale, est retrouvé couvert de sang'],
  ['025','Vittorio Santoro est le Don que personne n\'arrive à faire tomber']
]){
  const line=omerta.split('\n').find(l=>l.includes("{id:'"+id+"',title:"));
  assert.ok(line?.includes(text),'Outdated public briefing for '+id);
}
assert.match(app,/omertaLobby/, 'Omerta-specific lobby text required');
assert.match(app,/personnages Santoro sont attribués par le serveur/,
  'No Espion claims in Santoro lobby');
assert.match(indic,/omerta_standalone===true\?document\.querySelector\('\.game-panel-v11'\)/,
  'Santoro informant button must be accessible from the default investigation tab');
assert.match(omerta,/Action historique non applicable au dossier Santoro/,
  'Old Verri actions must fail closed even on old cached buttons');

const from=omerta.indexOf('  const basePrivateCardHtml=privateCardHtml;');
const to=omerta.indexOf('  void accessStatus();',from);
assert.ok(from>0&&to>from,'Omerta role renderer wrapper not found');
const wrapper=omerta.slice(from,to);
const sourceCard='<div class="private-card-v11"><div class="kicker">CARTE PRIVÉE · NE PAS MONTRER</div><div class="role-summary">Objectif</div></div>';
function render(standalone){
 const scope={
  STATE:{sync:{room:{scenario_id:'025',state:{omerta_standalone:standalone}},
   player:{public_role:'suspect',secret_role:'don',private_state:{identity:'Secrétaire du Don',objective:'Conserver sa position'}}}},
  privateCardHtml:()=>sourceCard,
  isOmerta:()=>true,
  omertaRole:()=> 'don',
  roleInfo:()=>({label:'Don'}),
  h:value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
  document:{createElement:()=>({innerHTML:'',content:{querySelector:()=>null}})}
 };
 vm.createContext(scope);
 return vm.runInContext(wrapper+'\nprivateCardHtml()',scope);
}
const standalone=render(true),legacy=render(false);
assert.match(standalone,/DOSSIER SANTORO/);
assert.match(standalone,/Secrétaire du Don/);
assert.match(standalone,/omerta-decision-dock/);
assert.doesNotMatch(standalone,/igrOmertaOpenDecision\(\)|Valider une décision|omerta_power|Verri/,
  'No historical Verri decision button in Santoro card');
assert.match(legacy,/igrOmertaOpenDecision/, 'Legacy display must remain isolated for historical games');
for(const asset of ['app-v11.js','omerta-v12.js','omerta-money-intel-v1.js']){
 const line=html.match(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"]+'))?.[0];
 assert.ok(line,'Missing script '+asset);
 assert.ok(sw.includes("'/" + line + "'"),'Stale service worker cache for '+asset);
}
console.log('OMERTA SANTORO DISPLAY: canonical briefings, anti-Verri actions, private cards, Indic and PWA cache OK');
