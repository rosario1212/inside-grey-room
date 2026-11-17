// Synthetic Playwright visual check for the actual shared suspect-card renderer.
// No room tokens, spoilers or authoring truth are read.
import assert from 'node:assert/strict';
import vm from 'node:vm';

export async function runV772PrivateCardMobileChecks({page,css,app,check}){
 const a=app.indexOf('function igr82RelationLink('),b=app.indexOf('\nasync function sendSpyDecision',a);
 const c=app.indexOf('function privateCardHtml(){',b),d=app.indexOf('\nfunction renderRole(){',c);
 assert(a>=0&&b>a&&c>b&&d>c,'Authenticated card renderer boundaries changed');
 const code=app.slice(a,b)+'\n'+app.slice(c,d)+'\nprivateCardHtml()';
 const h=t=>String(t??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const goal='Évite d’être désigné comme l’auteur du coup mortel. Défends ton départ avant la blessure, sans révéler gratuitement la menace commandée.';
 const ps={place:'L’ancien ami — la menace commandée',
  story:'Tu connaissais Maël avant les événements.',
  chronology:'1. 02:11 — Maël t’appelle au sujet de l’argent. 2. ≈ 02:26 — Vous vous disputez et tu le bouscules. 3. 02:32 — Tu quittes l’étage. Maël est vivant et sans blessure par lame.',
  anchors:'Tu sais avoir commandé une intimidation après cette première confrontation.',
  hide:'Tu es à l’origine de la menace organisée après ton départ.',
  objective_main:goal,position:goal,
  relations:[{pseudo:'Joueur B',text:'Tu ne connais pas ce client ni sa présence réelle dans la chambre.'}]};
 const state={room:'synthetic',role:'suspect',playerPseudo:'Joueur A',
  sync:{room:{scenario_id:'007',status:'playing',phase:'role_reading',state:{},cycle:0},
   player:{id:'self',pseudo:'Joueur A',public_role:'suspect',secret_role:'',private_state:ps},
   players:[{id:'self',pseudo:'Joueur A',seat_index:0},{id:'other',pseudo:'Joueur B',seat_index:1}]}};
 const scope={STATE:state,STORAGE:{getItem:()=>null},window:{IGR_LOCALE:'fr'},h,
  roleInfo:()=>({label:'Suspect',win:'Reste cohérent avec les faits connus.'}),
  currentScenario:()=>({id:'007'}),console};
 vm.createContext(scope);
 const html=vm.runInContext(code,scope,{timeout:1200});
 for(const [width,height] of [[320,720],[393,852],[768,1024]]){
  await check('v772-suspect-mobile-'+width,async()=>{
   await page.setViewportSize({width,height});
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
    css+'</style></head><body><div id="app"><div class="app"><main class="page"><section class="role-card role-card-v11">'+
    html+'</section></main></div></div></body></html>');
   const result=await page.evaluate(()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
    const q=x=>document.querySelector(x),events=[...document.querySelectorAll('.igr-v772-steps>li')];
    return {
     docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
     root:rect(q('.igr-v772-card')),
     times:[...document.querySelectorAll('.igr-v772-time')].map(rect),
     events:events.map(rect),
     relation:rect(q('.igr82-relation')),
     defence:rect(q('.igr82-defense')),goal:rect(q('.igr-private-priority')),
     widths:[...document.querySelectorAll('.igr-v772-event')].map(el=>({
      scroll:el.scrollWidth,client:el.clientWidth
     })),
     words:document.querySelector('.igr-v772-card').innerText
    };
   });
   assert(result.docWidth<=width+1,'No horizontal body scroll at '+width+'px: '+result.docWidth);
   assert(result.root.x>=-1&&result.root.right<=width+1,'The private card must fit the viewport at '+width);
   assert(result.times.length===3,'Three event times must be visible at '+width);
   assert(result.events.every((r,i)=>i===0||r.y>=result.events[i-1].bottom-1),'Event rows overlap at '+width);
   assert(result.widths.every(x=>x.scroll<=x.client+2),'Long event words must wrap at '+width);
   assert(result.relation.x>=-1&&result.relation.right<=width+1,'Existing relationship cards must fit '+width);
   assert(result.defence.bottom<=result.goal.y+1,'Defence and objective must be two distinct non-overlapping blocks');
   assert(!result.words.includes('Tu sais avoir commandé une intimidation'),'Redundant knowledge text must be absent');
  });
 }
 console.log('PASS v772 mobile: 320/393/768px chronology with independent clock labels, defence, goal and original relation cards');
}
