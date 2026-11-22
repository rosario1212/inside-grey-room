import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const read=p=>readFileSync(p,'utf8');
const app=read('app-v11.js'),markup=read('index.html'),sw=read('service-worker.js');
const css=read('lobby-mobile-polish-v831.css'),ui=read('lobby-mobile-polish-v831.js');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const revision='v831-mobile-ux-20261122';

for(const file of ['app-v11.js','lobby-mobile-polish-v831.js'])
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

assert(markup.includes("localStorage.getItem('igr_v11_session')"),'Prepaint resume probe required');
assert(markup.includes('html.igr831-resume-room #introGate{display:none!important}'),'Hide door before first paint');
assert(app.includes("if(IGR831_RESUMING_SAVED_ROOM){\n hideIntroImmediately();"),'Saved rooms must not reopen cinematic');
assert(app.includes("}else showIntroGate('TOUCHEZ POUR OUVRIR LA PORTE')"),'Preserve deliberate door on new entry');
assert(app.includes("document.documentElement.classList.remove('igr831-resume-room')"),'New entry must restore door if class was set');
const introAt=app.indexOf('const IGR831_RESUMING_SAVED_ROOM=(');
const introEnd=app.indexOf('setupIntro();',introAt);
assert(introAt>0&&introEnd>introAt,'Saved-room branch missing');
const evaluateSaved=new Function('STORAGE','sessionKey',app.slice(introAt,introEnd)+'return IGR831_RESUMING_SAVED_ROOM;');
const saved=v=>evaluateSaved({getItem:()=>JSON.stringify(v)},()=> 'igr_v11_session');
assert.equal(saved({room:'AAAAA',token:'opaque',view:'game'}),true);
assert.equal(saved({room:'AAAAA',token:'opaque',view:'lobby'}),true);
assert.equal(saved({room:'AAAAA',token:'opaque',view:'briefing'}),true);
assert.equal(saved({room:'AAAAA',token:'opaque',view:'role'}),true);
assert.equal(saved({room:'AAAAA',view:'game'}),false);
assert.equal(saved({room:null,token:null,view:'home'}),false);

class El{
 constructor(tag='div',klass=''){
  this.tagName=tag.toLowerCase();this.className=klass;this.children=[];
  this.parentElement=null;this.textContent='';this.dataset={};
 }
 get classList(){return {contains:klass=>this.className.split(/\\s+/).includes(klass)}}
 matches(q){return q==='button,a'&&['button','a'].includes(this.tagName)}
 appendChild(node){
  if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(x=>x!==node);
  this.children.push(node);node.parentElement=this;return node;
 }
 insertBefore(node,before){
  if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(x=>x!==node);
  const at=this.children.indexOf(before);this.children.splice(at<0?this.children.length:at,0,node);
  node.parentElement=this;return node;
 }
 querySelector(q){
  const deep=(klass,el)=>{for(const child of el.children){if(child.className.split(/\\s+/).includes(klass))return child;const nested=deep(klass,child);if(nested)return nested;}return null};
  if(q.startsWith(':scope > .'))return this.children.find(x=>x.className.split(/\\s+/).includes(q.slice(10)))||null;
  if(q.startsWith('.'))return deep(q.slice(1),this);
  return null;
 }
 querySelectorAll(q){return []}
}
const line=new El('div','player-line lobby-player-live');
const identity=new El('span','player-ident');
const pending=new El('span','lobby-role-pending');pending.textContent='Attribué au lancement';
identity.appendChild(pending);
const dossier=new El('button','btn ghost small'),kick=new El('button','btn ghost small');
let used=0;dossier.onclick=()=>used++;kick.onclick=()=>used++;
const presence=new El('p','igr829-presence-pill');presence.textContent='ACTIF RÉCEMMENT';
line.appendChild(identity);line.appendChild(kick);line.appendChild(dossier);line.appendChild(presence);
const lobby=new El('section','lobby-v11');
lobby.querySelectorAll=q=>q==='.player-list .player-line.lobby-player-live'?[line]:[];
const root={querySelector:q=>q==='.lobby-v11'?lobby:null};
const document={readyState:'complete',getElementById:id=>id==='app'?root:null,
 createElement:tag=>new El(tag),addEventListener(){}};
const window={IGR_LOCALE:'fr',addEventListener(){}};
const context={window,document,STATE:{room:'AAAAA',view:'lobby'},
 MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),console};
vm.runInNewContext(ui,context);
assert(window.IGR_MOBILE_POLISH_V831?.patch,'Layout hook missing');
window.IGR_MOBILE_POLISH_V831.patch();
const main=line.children.find(x=>x.className==='igr831-player-main');
const controls=line.children.find(x=>x.className==='igr831-player-actions');
assert(main&&controls,'Compact two-column roster not mounted');
assert.equal(controls.children.length,2,'Dossier and Exclure remain available');
assert.equal(main.querySelector('.igr829-presence-pill'),presence,'Preserve server-confirmed presence pill');
assert.equal(pending.textContent,'Rôle à attribuer','No false role assignment before game');
controls.children.forEach(btn=>btn.onclick());assert.equal(used,2,'Original button handlers preserved');
window.IGR_MOBILE_POLISH_V831.patch();
assert.equal(line.children.length,2,'Repeated rendering must not duplicate action areas');
assert.equal(controls.children.length,2,'Repeated rendering must not duplicate actions');
// A role switch may change composition, but never inflate the displayed team roster.
const summaryStart=app.indexOf('function roleChoiceSummary(');
const summaryEnd=app.indexOf('const ROLE_INFO',summaryStart);
assert(summaryStart>=0&&summaryEnd>summaryStart);
const summary=app.slice(summaryStart,summaryEnd);
const preview=new Function('roleCapacityMap','STATE','roleInfo','sc','count','players',
 summary+'return roleChoiceSummary(sc,count,players);');
const teamPlayers=[
 {id:'investigator',preferred_role:'enqueteur'},
 {id:'analyst',preferred_role:'analyste'},
 {id:'suspect1',preferred_role:'suspect'},
 {id:'suspect2',preferred_role:'suspect'}
];
for(const dossier of ['001','004','009']){
 const rows=preview(()=>({enqueteur:1,analyste:1,suspect:2}),
  {sync:{player:{id:'analyst'}}},id=>({label:id}),{id:dossier},4,teamPlayers);
 assert.equal(rows.find(x=>x.id==='suspect')?.cap,2,
  'Team-4 must display exactly two Suspect seats: '+dossier);
 assert.equal(rows.find(x=>x.id==='suspect')?.taken,2);
}
assert(app.includes('PASSER EN CLASSIQUE'),'Analyst must retain a clear switch to classic');
assert(app.includes("x.taken===2&&x.cap===2"),'Switch must not invent a third team seat');
assert(css.includes('.player-line.lobby-player-live:has(> .igr831-player-actions:not(:empty))'),
 'Only player cards with host actions may reserve a second column');
for(const marker of ['min-height:44px!important','igr831-player-actions','igr634-workspace','igr829-presence-pill','role-notice']){
 assert(css.includes(marker),'Missing mobile style '+marker);
}
for(const asset of ['lobby-mobile-polish-v831.js','lobby-mobile-polish-v831.css']){
 assert(markup.includes(asset+'?v='+revision),'HTML missing fresh asset '+asset);
 assert(sw.includes('/'+asset+'?v='+revision),'PWA missing fresh asset '+asset);
 assert(web.includes("'"+asset+"'"),'Web build missing '+asset);
 assert(mobile.includes("'"+asset+"'"),'Native build missing '+asset);
}
assert(markup.includes('app-v11.js?v='+revision));
assert(sw.includes("const CACHE='igr-"+revision+"'"));
assert(finalizer.includes("const clientVersion='"+revision+"'"));
assert(finalizer.includes("const pwaVersion='"+revision+"'"));
console.log('PASS v831: compact roster, original actions, verified presence, proper door resume, accessible controls, web/native packaging.');
