// v773 — regressions visibles iPhone + fidélité des cartes privées.
// Les données sont synthétiques : aucun secret de partie réelle n'est lu.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
const out=process.argv[2]||'dist';
const app=await readFile(path.join(root,'app-v11.js'),'utf8');
const css=await readFile(path.join(root,'private-card-readability-v773.css'),'utf8');
const start=app.indexOf('function igr82RelationLink(');
const mid=app.indexOf('\nasync function sendSpyDecision',start);
const card=app.indexOf('function privateCardHtml(){',mid);
const end=app.indexOf('\nfunction renderRole(){',card);
assert(start>=0&&mid>start&&card>mid&&end>card,'Structure du moteur de cartes privées absente');
const renderer=app.slice(start,mid)+'\n'+app.slice(card,end)+'\nprivateCardHtml()';
for(const name of ['.igr-v772-steps>li','.igr-v772-time','.igr-v772-event','column-gap','grid-template-columns','::before']){
 assert(css.includes(name),'Règle chronologie manquante : '+name);
}
assert(/grid-template-columns:.*minmax\(0,1fr\)/.test(css),'La colonne de texte doit pouvoir rétrécir');
assert(/list-style:none!important/.test(css),'Les marqueurs de liste ne doivent pas se superposer aux heures');
for(const page of ['index.html','en.html']){
 const html=await readFile(path.join(out,page),'utf8');
 const links=[...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
 assert(links.length&&links.at(-1).includes('private-card-readability-v773.css'),
  page+' : la correction doit être la dernière feuille de style chargée');
}
const escape=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const realExample={
 place:'Ami proche',
 story:'Tu es un ami très proche de Sofia. Tu appelles un autre proche.',
 chronology:"1. 21 h 17 — Tu lis un message dans lequel Sofia demande de l'aide.\n2. 21 h 22 — Tu téléphones au proche du quartier; vous parlez de Sofia et convenez d'attendre.\n3. 21 h 30 — Aucun de vous n'a appelé Sofia ou un service de secours, ni promis de le faire.",
 anchors:"À 21 h 17, Sofia te demande de l'aide.",
 hide:'Tu prétends qu’un relais était prévu, alors que vous aviez seulement décidé d’attendre.',
 position:'Fais reconnaître ton rôle dans cette attente (niveau 2).',
 objective_main:'Reste fidèle à ton récit (niveau 2).',
 relations:[{pseudo:'Autre joueur',text:'Tu lui as parlé ce soir-là.'}]
};
function render(id,ps=realExample){
 const state={room:'EXEMPLE',role:'suspect',playerPseudo:'Joueur A',
  sync:{room:{scenario_id:id,state:{},status:'playing',phase:'role_reading',cycle:0},
   player:{id:'self',pseudo:'Joueur A',public_role:'suspect',secret_role:'',private_state:ps},
   players:[{id:'self',pseudo:'Joueur A',seat_index:0},{id:'other',pseudo:'Autre joueur',seat_index:1,private_state:{hide:'SECRET-JOUEUR-INTERDIT'}}]}};
 const context={STATE:state,window:{IGR_LOCALE:'fr'},STORAGE:{getItem:()=>null},
   h:escape,roleInfo:()=>({label:'Suspect',win:'Reste fidèle au dossier.'}),
   currentScenario:()=>({id}),console};
 vm.createContext(context);
 return vm.runInContext(renderer,context,{timeout:1500});
}
const case004=render('004');
assert(case004.includes('Ami proche de Sofia'),'Le lien avec Sofia doit être explicite');
assert(case004.includes('personne')&&case004.includes('aucun de vous n’avait promis'),
 'La dissimulation doit décrire les engagements concrets, sans jargon de relais');
assert(!case004.includes('Tu prétends qu’un relais était prévu'),'Texte ambigu conservé');
assert(!case004.includes('(niveau 2)'),'Les niveaux internes ne sont pas des consignes joueurs');
assert((case004.match(/class="igr-v772-time"/g)||[]).length===3,'Trois horaires distincts attendus');
assert((case004.match(/class="igr-v772-event"/g)||[]).length===3,'Trois actions distinctes attendues');
assert(!case004.includes('SECRET-JOUEUR-INTERDIT'),'Fuite de la carte d’un autre joueur');
for(let i=1;i<=49;i++){
 const n=String(i).padStart(3,'0'),html=render(n,{...realExample,hide:'Je conserve mon secret propre au scénario.'});
 assert((html.match(/class="igr-v772-time"/g)||[]).length===3,n+' : heures perdues');
 assert(html.includes('Je conserve mon secret propre au scénario.'),n+' : secret modifié sans autorisation');
 assert(!html.includes('SECRET-JOUEUR-INTERDIT'),n+' : fuite de secret');
}
console.log('PASS v773 : 49 dossiers, heures et actions distinctes, secret 004 clarifié, niveaux internes masqués, aucun secret voisin révélé, CSS des deux langues chargé en dernier.');
