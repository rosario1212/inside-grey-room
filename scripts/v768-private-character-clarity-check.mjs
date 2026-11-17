// v768 — Synthetic, spoiler-free private card regression across every published dossier.
// No real room, secret manuscript, credentials, or network calls are needed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app-v11.js','utf8');
const a=source.indexOf('function igr82RelationLink(');
const b=source.indexOf('\nasync function sendSpyDecision',a);
const c=source.indexOf('function privateCardHtml(){',b);
const d=source.indexOf('\nfunction renderRole(){',c);
assert(a>=0&&b>a&&c>b&&d>c,'Private card renderer and relation helper boundaries must exist');
const evaluator=source.slice(a,b)+'\n'+source.slice(c,d)+'\nprivateCardHtml()';
const escape=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const roles={suspect:{label:'Suspect',win:'Reste cohérent avec les faits connus.'},analyste:{label:'Analyste',win:'Recoupe les faits.'}};

function card(caseId,{role='suspect',standalone=false,custom={}}={}){
  const privateState={
    place:'Ton identité personnelle, sans information sur les autres.',
    story:'Tu avais une activité dans cette affaire.',
    chronology:'1. 15 h 42 — Tu observes un événement. 2. 15 h 47 — Tu agis. 3. 16 h 17 — Un appel est passé.',
    anchors:'Tu sais seulement ce que tu as vu.',
    hide:'SECRET-PRIVE-DU-JOUEUR-A',
    position:'Tu peux expliquer ta présence.',
    objective_main:'Défends précisément ta version.',
    relations:[{pseudo:'Joueur B',text:'Tu as échangé avec cette personne.'}],
    ...custom
  };
  const state={room:'TEST',role,playerPseudo:'Joueur A',sync:{
    room:{scenario_id:caseId,state:{omerta_standalone:standalone},status:'playing',phase:'role_reading',cycle:0},
    player:{id:'self',pseudo:'Joueur A',public_role:role,secret_role:'',private_state:privateState},
    players:[
      {id:'self',pseudo:'Joueur A',seat_index:0},
      {id:'another',pseudo:'Joueur B',seat_index:1,private_state:{hide:'NE-PAS-AFFICHER-SECRET-AUTRUI'}}
    ]
  }};
  const sandbox={
    STATE:state,STORAGE:{getItem:()=>null},window:{IGR_LOCALE:'fr'},h:escape,
    roleInfo:r=>roles[r]||roles.suspect,
    currentScenario:()=>({id:caseId}),console
  };
  vm.createContext(sandbox);
  return vm.runInContext(evaluator,sandbox,{timeout:1000});
}

for(let num=1;num<=34;num++){
 const id=String(num).padStart(3,'0');
 const extra=['021','022','023','024','025'].includes(id)?{omerta_objective:'Objectif du rôle Omertà'}:{};
 const html=card(id,{custom:extra});
 assert(html.includes('<h2>Joueur A</h2>'),id+' must display the actual player as the character name');
 assert(html.includes('Suspect · Ton personnage'),id+' must keep the role distinct from the player');
 assert(html.includes('QUI TU ES'),id+' requires a personal identity');
 assert(html.includes('TON HISTOIRE'),id+' requires narrative context');
 assert(html.includes('TES RELATIONS'),id+' requires relations when authorized');
 assert(html.includes('Joueur B'),id+' must identify the other player by their public nickname');
 assert(html.indexOf('CE QUE TU AS FAIT')<html.indexOf('TES RELATIONS'),id+' must give the player a legible personal timeline before the relationship cards');
 assert(html.includes('CE QUE TU CACHES'),id+' requires their own secret');
 assert(html.includes('SECRET-PRIVE-DU-JOUEUR-A'),id+' must show only their own disclosed state');
 assert(!html.includes('NE-PAS-AFFICHER-SECRET-AUTRUI'),id+' illegally leaks another role');
 assert(html.includes('15 h 47')&&html.includes('Tu agis.'),id+' must retain the exact authored time and fact in separate timeline columns');
 assert((html.match(/<li>/g)||[]).length===3,id+' must separate the three numbered chronology entries');
 assert(html.includes('TON OBJECTIF')||html.includes('COMMENT TU GAGNES'),id+' must surface the role objective');
}
const special=card('021',{standalone:true,custom:{identity:'Personnage privé',objective:'Gagner sans dévoiler la vérité',what_you_know:'Fait privé',what_you_hide:'Élément confidentiel',your_chronology:'AVANT — observation\nPENDANT — décision\nAPRÈS — retour',conversation_hooks:['Confronter un échange']}});
assert(special.includes('TON OBJECTIF')&&special.includes('Personnage privé'));
assert(!special.includes('NE-PAS-AFFICHER-SECRET-AUTRUI'));
assert((special.match(/TON OBJECTIF/g)||[]).length===1,'Omertà objective must not duplicate');
const cartel=card('030',{custom:{variant_card:{identity:'Mon identité dans le dossier',objective:'Mon objectif de variante',what_you_know:'Mon fait',variant_secret:'Mon secret',what_you_hide:'Mon silence',your_chronology:'AVANT — fait'}}});
assert((cartel.match(/Mon identité dans le dossier/g)||[]).length===1);
assert((cartel.match(/Mon objectif de variante/g)||[]).length===1);
const heritage=fs.readFileSync('heritage-play-v13-7.js','utf8');
const maitre=fs.readFileSync('heritage-maitre-v34.js','utf8');
for(const [file,src] of [['Héritage',heritage],['Maître',maitre]]){
 assert(src.includes('<h1>${esc(p.name)}</h1>'),file+' player name must be the heading');
 assert(src.includes('<span>TON OBJECTIF</span>'),file+' must surface personal objective');
 assert(src.includes('CE QUE TU SAIS SEUL'),file+' must separate private knowledge');
 assert(src.indexOf('<div class="hplay-objective"><span>TON OBJECTIF</span>')<src.indexOf('<div class="hplay-secret"><span>CE QUE TU SAIS SEUL</span>'),file+' objective must precede their secret');
}
const omerta=fs.readFileSync('omerta-v12.js','utf8');
assert(omerta.includes("querySelector('.igr-private-priority span')"),'Omertà objective override must never overwrite the identity');
const css=fs.readFileSync('live-game-ux-v632.css','utf8');
assert(css.includes('body:has(#app .role-card-v11) > .live-session-controls'),'Private role screen must keep the leave button below the card on mobile');
console.log('PASS v768: 34 base/DLC private cards, player names, factual relations, personal chronology, 021/030 special roles, Héritage, Maître and spoiler isolation.');
