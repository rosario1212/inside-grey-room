// v724 — role labels, stable lobby controls and overlapping RPC choices.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(path,'utf8');
const natural=read('natural-role-gameplay-v50.js');
const app=read('app-v11.js');
assert(app.includes("short:'Arbitre les procédures et préside le tribunal.'"));
assert(app.includes('<small>${h(x.info.short||x.info.body)}</small>'));
assert(app.includes('info:roleInfo(id)'));
assert(app.includes('<summary>Lire la fiche complète</summary><p>${h(x.info.body)}</p>'));

const polish=read('omerta-polish-v12.js');
const omerta=read('omerta-v12-39.js');
const lobby=read('lobby-ui-fix-v13.js');
const mobile=read('mobile-ui-v28.css');
const roleCss=read('lobby-ui-fix-v13.css');
const omertaRoleCopy=read('omerta-v12-39.js');
const omertaRoleSetup=read('omerta-v12.js');
const rolePreviewCss=roleCss.split('#app .lobby-v11[data-igr-lobby-theme] .igr-role-option>.role-choice-card small{')[1]?.split('}')[0]||'';
assert(rolePreviewCss.includes('line-clamp:unset!important'), 'role preview must not clamp');
assert(rolePreviewCss.includes('overflow:visible!important'), 'role preview text must never be clipped');
assert(rolePreviewCss.includes('height:auto!important'), 'role preview may grow with the text');
assert(omertaRoleCopy.includes("suspect:{label:'Mis en cause'"), 'Omerta unranked player label is missing');
assert(omertaRoleSetup.includes("'021':['enqueteur','analyste','suspect'"), 'Omerta backend-compatible suspect seat must remain');

function section(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing source boundary '+start);
 return source.slice(a,b);
}

// The star decorator must not overwrite descriptions specific to a DLC.
const badgeSource=section(natural,'function parseRoleFromCard(','\nfunction currentAssembly()');
let badge=null;
const holder={appendChild(value){badge=value}};
const preview={textContent:'Juge dans le Cartel, mission propre au dossier 029'};
const full={textContent:'Fiche du dossier 029 avec règles et pouvoirs spécifiques'};
const card={
 classList:{contains(){return false}},
 getAttribute:()=> "chooseLobbyRole('juge')",
 dataset:{roleId:'juge'},
 querySelector(selector){
  if(selector==='.igr50-activity')return badge;
  if(selector==='span')return holder;
  if(selector==='small')return preview;
  return null;
 },
 closest:()=>({querySelector:()=>full})
};
const badgeEnv={
 document:{querySelectorAll:()=>[card],createElement:()=>({textContent:'',className:''})},
 ACTIVITY:{juge:4},activityRating:r=>({juge:4}[r]||2),ROLE_COPY:{juge:'Generic incompatible description'},
 copy:s=>s,stars:n=>'★'.repeat(n)+'☆'.repeat(5-n)
};
vm.runInNewContext(badgeSource+'\ndecorateRoleCards();decorateRoleCards();',badgeEnv);
assert.equal(preview.textContent,'Juge dans le Cartel, mission propre au dossier 029');
assert.equal(full.textContent,'Fiche du dossier 029 avec règles et pouvoirs spécifiques');
assert.equal(badge.textContent,'ACTIVITÉ · ★★★★☆');
assert(!badgeSource.includes('sm.textContent=fullText'));
assert(!natural.includes('new MutationObserver(()=>decorateRoleCards())'));

// A sync must reuse role controls, not schedule three destructive updates.
const decorator=section(polish,'  function decorateLobby(){','  const prevPrivateCard=privateCardHtml;');
assert(decorator.includes("let random=zone.querySelector('.igr-random-role-cta')"));
assert(decorator.includes("let status=zone.querySelector('.omerta-role-status')"));
assert(decorator.includes("if(status.innerHTML!==wantedHtml)"));
assert(!polish.includes('setTimeout(decorateLobby,80)'));
assert(!polish.includes('if(STATE.sync)renderLobby(STATE.sync);await syncNow(true);'));
assert(!omerta.includes("attributeFilter:['class','src']"));

// Evaluate the real shared guard against two concurrent UI actions.
const gate=section(lobby,'  // v724 shared role action gate:','  // v724 shared role action gate end');
const calls=[];
let releaseManual,releaseRandom;
const waitingManual=new Promise(done=>{releaseManual=done});
const waitingRandom=new Promise(done=>{releaseRandom=done});
const active=new Set();
const zone={
 classList:{toggle(name,yes){if(yes)active.add(name);else active.delete(name)}},
 setAttribute(name,value){this[name]=value},
 removeAttribute(name){delete this[name]}
};
const handlers={
 chooseLobbyRole:async role=>{calls.push('manual:'+role);await waitingManual},
 chooseRandomLobbyRole:async()=>{calls.push('random');await waitingRandom}
};
const env={window:handlers,STATE:{view:'lobby',room:'TEST1',token:'token1'},document:{querySelector:()=>zone}};
vm.runInNewContext(gate,env);
const first=handlers.chooseLobbyRole('juge');
assert(handlers.IGR_ROLE_ACTION_V724.isBusy());
assert(active.has('igr-role-selecting'));
await handlers.chooseRandomLobbyRole();
assert.deepEqual(calls,['manual:juge']);
releaseManual();await first;
assert(!handlers.IGR_ROLE_ACTION_V724.isBusy());
const second=handlers.chooseRandomLobbyRole();
await handlers.chooseLobbyRole('analyste');
assert.deepEqual(calls,['manual:juge','random']);
releaseRandom();await second;
assert(!active.has('igr-role-selecting'));
assert(mobile.includes('.role-choice-zone.igr-role-selecting'));
// v811: role selection and a random draw are lobby updates, not navigation.
const repaintHook=section(lobby,'  try{\n    const previous=renderLobby;','  // Only new/removed lobby mounts');
let enhanced=0,observedHeight='';
const viewport={
 scrollY:575,innerHeight:810,
 scrollTo(arg,y){this.scrollY=typeof arg==='object'?arg.top:y}
};
const lobbyNode={dataset:{igrScenarioId:'001'}};
const appRoot={
 style:{minHeight:''},
 getBoundingClientRect(){return {height:1400}},
 querySelector(selector){return selector==='.lobby-v11'?lobbyNode:null}
};
const scrollTest={
 window:viewport,
 document:{getElementById(id){return id==='app'?appRoot:null}},
 STATE:{view:'lobby',sync:{room:{scenario_id:'001'}}},
 renderLobby(){observedHeight=appRoot.style.minHeight;viewport.scrollY=0;return 'updated'},
 enhanceLobby(){enhanced++},
 console
};
vm.runInNewContext(repaintHook,scrollTest);
assert.equal(scrollTest.renderLobby(),'updated');
assert.equal(viewport.scrollY,575,'A role pick must preserve the exact Y even when the DOM resets to top');
assert.equal(observedHeight,'1400px','The old document height is held during the re-render');
assert.equal(appRoot.style.minHeight,'','The temporary height must be cleaned up');
assert.equal(enhanced,1);
viewport.scrollY=635;
scrollTest.renderLobby();
assert.equal(viewport.scrollY,635,'A random-role draw must not jump upwards');
scrollTest.STATE.view='game';
viewport.scrollY=720;
scrollTest.renderLobby();
assert.equal(viewport.scrollY,0,'Actual screen navigation must not inherit the lobby position');
assert(!repaintHook.includes('scrollY+delta'),'No competing scroll anchoring in role updates');
assert(app.includes('if(Number.isFinite(draft.scroll)&&Math.abs(window.scrollY-draft.scroll)>1)'),
 'Draft recovery must skip redundant scroll commands');

// Regression: server-driven updates to a visible role lobby must never send
// iOS Safari to the top. Test the actual renderer wrapper with a DOM stub.
const viewportRender=section(lobby,'      renderLobby=function(){','\n      };')+'\n      };';
function checkLobbyViewport({sameScenario=true,simulatedScroll=900}={}){
 let scrollY=900;
 const scrollCalls=[];
 let mounted={dataset:{igrScenarioId:'001'}};
 const root={style:{minHeight:''},getBoundingClientRect:()=>({height:2200}),querySelector:sel=>sel==='.lobby-v11'?mounted:null};
 const windowStub={
  get scrollY(){return scrollY},
  innerHeight:800,
  scrollTo(arg,y){scrollCalls.push(arg);scrollY=typeof arg==='object'?arg.top:y}
 };
 const scope={
  document:{getElementById:id=>id==='app'?root:null},
  window:windowStub,
  STATE:{view:'lobby',sync:{room:{scenario_id:sameScenario?'001':'002'}}},
  renderLobby(){scrollY=simulatedScroll;mounted={dataset:{igrScenarioId:'001'}};return 7},
  enhanceLobby(){}
 };
 vm.runInNewContext('const previous=renderLobby;'+viewportRender,scope);
 assert.equal(scope.renderLobby(),7);
 assert.equal(root.style.minHeight,'','Temporary height guard must be removed');
 return {scrollY,scrollCalls};
}
const unchanged=checkLobbyViewport();
assert.equal(unchanged.scrollY,900);
assert.equal(unchanged.scrollCalls.length,0,'A role selection must not trigger a scroll call');
const recovered=checkLobbyViewport({simulatedScroll:0});
assert.equal(recovered.scrollY,900,'Viewport must recover from a full lobby DOM replacement');
assert.equal(recovered.scrollCalls.length,1,'At most one immediate correction is allowed');
const otherPage=checkLobbyViewport({sameScenario:false,simulatedScroll:0});
assert.equal(otherPage.scrollY,0,'A new scenario is a navigation, not a preserved lobby');
assert.equal(otherPage.scrollCalls.length,0);

console.log('PASS v724: dossier-specific role cards, stable Omerta controls, serialized role RPCs.');
