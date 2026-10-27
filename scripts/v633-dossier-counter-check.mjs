/* Non-network regression: the badge equals displayed public publications, not all alerts.
   Runs for the shared gameplay shell across 001–049, three role/cycle/variant paths. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd(),bundle=path.resolve(process.argv[2]||'dist');
const common=await readFile(path.join(bundle,'common-dossier-v106.js'),'utf8');
const notification=await readFile(path.join(bundle,'notifications-v12.js'),'utf8');
const html=await readFile(path.join(bundle,'index.html'),'utf8');
assert(html.includes('common-dossier-v106.js?v=v106-common-dossier-visible-publications-20261027'),'stale dossier script URL');
assert(html.includes('notifications-v12.js?v=v106-common-dossier-visible-publications-20261027'),'stale notification script URL');
assert(common.includes('visibleEventIds'),'authorized dossier must expose only displayed event identifiers');
const sourceStart=notification.indexOf('  function decorateTabs(){'),sourceEnd=notification.indexOf('  function visible(el){',sourceStart);
assert(sourceStart>=0&&sourceEnd>sourceStart,'tab badge renderer not located');
const decorateSource=notification.slice(sourceStart,sourceEnd);
function buttonFor(id){
 const button={dataset:{},_attrs:{},badge:null,getAttribute(name){if(name==='onclick')return "setTab('"+id+"')";return this._attrs[name]||null},
 setAttribute(name,value){this._attrs[name]=String(value)},removeAttribute(name){delete this._attrs[name]},
 querySelector(name){return name==='.igr-tab-unread'?this.badge:null},
 appendChild(el){this.badge=el;el.remove=()=>{this.badge=null}}};
 return button;
}
const idsFor=(html)=>[...html.matchAll(/class="igr106-event" data-igr-event-id="(\d+)"/g)].map(x=>x[1]);
let tested=0;
for(let number=1;number<=49;number++){
 const scenario=String(number).padStart(3,'0');
 for(let index=0;index<3;index++){
  const role=['enqueteur','suspect','journaliste'][index],cycle=index+1,variant=['A','B','C'][index];
  const context='Situation initiale publique de '+scenario+' variante '+variant+'.';
  const fixture={room_code:'ROOM1',context,events:[
   {id:1,event_type:'context',title:'CONTEXTE',text:context,cycle:null},
   {id:2,event_type:'public_notice',title:'Nouveau témoin',text:'Fait partagé',cycle},
   {id:3,event_type:'breaking_news',title:'Information journalistique',text:'Article',cycle},
   {id:4,event_type:'context',title:'Complément au contexte',text:context+' Une donnée supplémentaire.',cycle}
  ]};
  let synced=0;
  const S={token:'t',tab:'timeline',view:'game',sync:{room:{code:'ROOM1',scenario_id:scenario,status:'playing',phase:'investigation_assembly',state:{match_no:index+1}},player:{id:'player-1',public_role:role},scenario:{context}}};
  const window={IGR_LOCALE:'fr',setInterval:()=>0,IGR_NOTIFICATIONS:{refreshBadges(){synced++}}};
  const document={head:{appendChild(){}},createElement(){return {}},querySelector(){return null}};
  const scope={window,document,STATE:S,rpc:async()=>fixture,console:{info(){},warn(){}},gameTabs(){return[{id:'card',label:'Ma fiche'},{id:'investigation',label:'Enquête'},{id:'timeline',label:'Dossier commun'}]},renderGameTab(){return ''},privateCardHtml(){return ''},renderGame(){return ''}};
  vm.runInNewContext(common,scope);
  const api=window.IGR_COMMON_DOSSIER_V106;
  assert(api,'runtime export missing');
  await api.syncPublic(true);
  assert.equal(synced,1,'badge must update when public dossier sync completes');
  const rendered=idsFor(api.publicHtml()),sourceIds=[...api.visibleEventIds()];
  assert.deepEqual(rendered,['4','3','2'],'only non-duplicated public events are rendered');
  assert.deepEqual(sourceIds,rendered.slice().reverse(),'badge must use the same source as rendered cards');
  assert(!api.publicHtml().includes('data-igr-event-id="1"'),'repeated context must be eliminated');
  assert(api.publicHtml().includes(context),'premise must remain readable');
  const timeline=buttonFor('timeline'),card=buttonFor('card');
  const notices={items:[
   {id:2,unread:true,route:'timeline'},
   {id:3,unread:false,route:'timeline'},
   ...Array.from({length:10},(_,i)=>({id:100+i,unread:true,route:'timeline',eventType:'phase'})),
   {id:20,unread:true,route:'card'}
  ]};
  const notifWindow={IGR_COMMON_DOSSIER_V106:api};
  const notifDocument={querySelectorAll:()=>[timeline,card],createElement(){return {textContent:'',setAttribute(){},remove(){}}}};
  const badgeCtx={window:notifWindow,document:notifDocument,state:notices,resolvedRoute:x=>x,tr:(a)=>a};
  vm.runInNewContext(decorateSource+'\ndecorateTabs();',badgeCtx);
  assert.equal(timeline.badge?.textContent,'3','timeline count must match displayed publications (including read), not 12+ unrelated notifications');
  assert.equal(card.badge?.textContent,'•','other tabs may indicate new alerts but not claim a content total');
  assert.equal(timeline._attrs.title,'3 publications visibles');
  tested++;
 }
}
// The badge must not display a speculative number until the authoritative RPC has loaded.
const empty=buttonFor('timeline'),badgeCtx={window:{IGR_COMMON_DOSSIER_V106:{visibleEventIds(){return null}}},document:{querySelectorAll:()=>[empty],createElement(){return {setAttribute(){}}}},state:{items:Array.from({length:10},(_,i)=>({id:i+1,route:'timeline',unread:true}))},resolvedRoute:x=>x,tr:a=>a};
vm.runInNewContext(decorateSource+'\ndecorateTabs();',badgeCtx);
assert.equal(empty.badge,null,'never show a speculative badge before server sync');
console.log('PASS dossier badge and duplicate context: '+tested+' role/scenario/variant cases, three cycles, unloaded-state guard');
