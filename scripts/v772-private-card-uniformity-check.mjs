// Cross-scenario v772 private card QA. Synthetic room state only: no true
// culprit, raw manuscripts or other players' private tokens are read.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('app-v11.js','utf8');
const a=src.indexOf('function igr82RelationLink(');
const b=src.indexOf('\nasync function sendSpyDecision',a);
const c=src.indexOf('function privateCardHtml(){',b);
const d=src.indexOf('\nfunction renderRole(){',c);
assert(a>=0&&b>a&&c>b&&d>c,'Real private card code not found');
const code=src.slice(a,b)+'\n'+src.slice(c,d)+'\nprivateCardHtml()';
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const defaultGoal='Évite d’être désigné comme l’auteur du coup mortel. Défends ton départ avant la blessure, sans révéler gratuitement la menace commandée.';
const sample={
 place:'L’ancien ami — la menace commandée',
 story:'Tu connaissais Maël avant les événements.',
 chronology:'1. 02:11 — Maël t’appelle au sujet de l’argent. 2. ≈ 02:26 — Vous vous disputez et tu le bouscules. 3. 02:32 — Tu quittes l’étage. Maël est vivant et sans blessure par lame.',
 hide:'Tu es à l’origine de la menace organisée après ton départ.',
 anchors:'Tu sais avoir commandé une intimidation après cette première confrontation.',
 position:defaultGoal,
 objective_main:defaultGoal,
 omerta_objective:defaultGoal,
 relations:[{pseudo:'Joueur B',text:'Tu ne connais pas ce client ni sa présence réelle dans la chambre.'}]
};
function render(id,{state={},role='suspect',standalone=false}={}){
 const ps={...sample,...state};
 const room={scenario_id:id,state:{omerta_standalone:standalone},status:'playing',phase:'role_reading',cycle:0};
 const players=[{id:'self',pseudo:'Joueur A',seat_index:0},
  {id:'someone',pseudo:'Joueur B',seat_index:1,private_state:{hide:'AUTRE-JOUEUR-SECRET-INACCESSIBLE'}}];
 const data={room:'TEST',role,playerPseudo:'Joueur A',
  sync:{room,player:{id:'self',pseudo:'Joueur A',public_role:role,secret_role:'',private_state:ps},players}};
 const sandbox={STATE:data,STORAGE:{getItem:()=>null},window:{IGR_LOCALE:'fr'},h:escape,
  roleInfo:()=>({label:role==='suspect'?'Suspect':'Analyste',win:'Comparer uniquement les faits établis.'}),
  currentScenario:()=>({id}),console};
 vm.createContext(sandbox);
 return vm.runInContext(code,sandbox,{timeout:1500});
}
const order=(html,needles)=>{
 const positions=needles.map(x=>html.indexOf(x));
 assert(positions.every(x=>x>=0)&&positions.every((x,i)=>i===0||x>positions[i-1]),
  'Private sheet ordering must be chronological and without duplicates: '+needles);
};
for(let n=1;n<=49;n++){
 const id=String(n).padStart(3,'0'),html=render(id);
 assert(html.includes('igr-v772-card'),id+' must use the shared suspect layout');
 assert(html.includes('<h2>Joueur A</h2>'),id+' must use player name');
 assert(html.includes('L’ancien ami — la menace commandée'),id+' identity must be intact');
 assert(html.includes('Maël t’appelle au sujet de l’argent.'),id+' fact 1 lost');
 assert(html.includes('Vous vous disputez et tu le bouscules.'),id+' fact 2 lost');
 assert(html.includes('Maël est vivant et sans blessure par lame.'),id+' fact 3 lost');
 assert((html.match(/class="igr-v772-time"/g)||[]).length===3,id+' must show 3 times');
 assert((html.match(/<li><span class="igr-v772-time"/g)||[]).length===3,id+' must show 3 separate events; defence bullets are independent');
 assert(html.includes('≈ 02:26'),id+' must preserve approximate timing');
 assert(!html.includes('Tu sais avoir commandé une intimidation'),id+' must not restate the hidden threat as new knowledge');
 assert(html.includes('Tu es à l’origine de la menace organisée après ton départ.'),id+' must preserve a secret');
 assert(html.includes('igr82-relations'),id+' must keep the exact relationship card renderer');
 assert(html.includes('Tu ne connais pas ce client ni sa présence réelle dans la chambre.'),id+' relation must remain unchanged');
 assert((html.match(/Joueur B/g)||[]).length===1,id+' relation person must appear exactly once');
 assert(html.includes('Évite d’être désigné comme l’auteur du coup mortel.'),id+' goal missing');
 assert((html.match(/Défends ton départ avant la blessure/g)||[]).length===1,id+' defence must appear exactly once');
 assert((html.match(/<h4>TA DÉFENSE<\/h4>/g)||[]).length===1,id+' tactics need one dedicated block');
 assert((html.match(/<b>TON OBJECTIF<\/b>/g)||[]).length===1,id+' goal needs one dedicated block');
 assert(!html.includes('AUTRE-JOUEUR-SECRET-INACCESSIBLE'),id+' leaked another suspect');
 order(html,['QUI TU ES','CE QUE TU AS FAIT','CE QUE TU CACHES','TES RELATIONS','TA DÉFENSE','TON OBJECTIF']);
}
const known=render('007',{state:{anchors:'Tu as vu une voiture blanche près de la porte.',
 hide:'Tu as menti sur la somme reçue.',position:'Explique pourquoi tu étais là.',
 objective_main:'Évite de provoquer une erreur de jugement.'}});
order(known,['CE QUE TU AS FAIT','CE QUE TU CACHES','CE QUE TU SAIS','TES RELATIONS','TA DÉFENSE','TON OBJECTIF']);
assert(known.includes('Tu as vu une voiture blanche près de la porte.'));
assert(known.includes('Explique pourquoi tu étais là.'));
assert(!known.includes('Ce sont des faits que les autres joueurs ne connaissent pas automatiquement.'));
const noDef=render('008',{state:{position:'Même objectif à répéter.',
 objective_main:'Même objectif à répéter.'}});
assert(!noDef.includes('TA DÉFENSE'),'Identical single-sentence goal must not be a duplicate defence');
assert((noDef.match(/Même objectif à répéter/g)||[]).length===1);
const noInvent=render('009',{state:{anchors:'',position:'',hide:''}});
assert(!noInvent.includes('<h4>CE QUE TU SAIS</h4>')&&!noInvent.includes('<h4>TA DÉFENSE</h4>'),
 'Missing facts must not be invented for visual symmetry');
const other=render('010',{role:'analyste'});
assert(!other.includes('igr-v772-card'),'Non-suspect cards must preserve established mechanisms');

const santoro=render('021',{standalone:true,state:{
 identity:'Identité privée déjà rédigée',objective:'Obtenir une décision prudente.',
 what_you_know:'Tu as personnellement vu le registre.',
 what_you_hide:'Tu as gardé le second exemplaire.',
 your_chronology:'AVANT — le rendez-vous\nPENDANT — la remise\nAPRÈS — la fuite',
 conversation_hooks:['Demande où est le registre.','Questionne le comptable.']
}});
assert(santoro.includes('Identité privée déjà rédigée')&&santoro.includes('Obtenir une décision prudente.'));
assert(santoro.includes('Tu as personnellement vu le registre.')&&santoro.includes('Tu as gardé le second exemplaire.'));
assert((santoro.match(/class="igr-v772-event"/g)||[]).length===3,'Omertà ordered phases must remain separate');
assert(santoro.includes('Demande où est le registre.'),'Omertà authored questions must not disappear');
assert(santoro.includes('igr82-relations'),'Omertà relationship card structure must be unchanged');

const cartel=render('030',{state:{variant_card:{
 identity:'Un rôle précis dans la variante',objective:'Évite un verdict erroné.',
 what_you_know:'Tu as lu une note interne.',variant_secret:'Tu as signé un reçu.',
 what_you_hide:'Tu caches un rendez-vous.',your_chronology:'AVANT — préparation\nPENDANT — réunion'
}}});
assert(cartel.includes('Un rôle précis dans la variante'));
assert(cartel.includes('Tu as lu une note interne.'));
assert(cartel.includes('Tu as signé un reçu.')&&cartel.includes('Tu caches un rendez-vous.'));
assert((cartel.match(/Évite un verdict erroné/g)||[]).length===1);

const userInput=render('011',{state:{story:'Ce <secret> ne doit pas être interprété comme une balise.',
 anchors:'Un <indice> seulement dans ta carte.',
 relations:[{pseudo:'Autre <joueur>',text:'Ton lien <existe>.'}]}});
assert(userInput.includes('&lt;secret&gt;')&&userInput.includes('&lt;indice&gt;')&&!userInput.includes('<secret>'));
assert(userInput.includes('&lt;existe&gt;')&&!userInput.includes('<existe>'));
assert(!userInput.includes('AUTRE-JOUEUR-SECRET-INACCESSIBLE'));

const css=fs.readFileSync('screen-polish-v73.css','utf8');
for(const name of ['.igr-v772-steps','.igr-v772-time','.igr-v772-event','.igr-v772-defence-list',
 '@media(max-width:390px)'])assert(css.includes(name),'Mobile card styles missing: '+name);
const heritage=fs.readFileSync('heritage-play-v13-7.js','utf8');
const maitre=fs.readFileSync('heritage-maitre-v34.js','utf8');
const casino=fs.readFileSync('casino-client-v105.js','utf8');
for(const src of [heritage,maitre])assert(src.includes('TON OBJECTIF')&&src.includes('CE QUE TU SAIS SEUL'),
 'Héritage role objectives and sealed knowledge are already distinct; preserve them');
assert(casino.includes('Ton objectif')&&casino.includes('Tes relations'),
 'Casino has its own goal/history/relations contract; do not reclassify it as a suspect dossier');

console.log('PASS v772: all 49 numbered dossiers, realistic chronology, no repeated threat/goal, unchanged relation cards, 021/030 special roles, XSS and private-secret isolation.');
