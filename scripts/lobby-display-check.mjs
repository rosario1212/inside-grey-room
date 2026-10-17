import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const target=path.resolve(process.argv[2]||'dist');
const VERSION='v85-human-relations-exit';
const assets=['app-v11.js','startup-stability-v13-3.css','lobby-ui-fix-v13.js','lobby-ui-fix-v13.css','omerta-v12-30.js','omerta-v12-39.js','dlc-suite-v12-37.js','mobile-ui-v28.js','interface-polish-v14.js','navigation-theme-v18.js','authoritative-runtime-v41.js','rules-v12.js','self-guided-rules-v51.js','gameplay-flow-v13.js','play-modes-v13-8.js','heritage-maitre-online-v34-4.js','heritage-maitre-polish-v34.js','heritage-maitre-assets-v34.js','heritage-maitre-mobile-v34-5.js','screen-polish-v73.css','investigation-runtime-v42.js'];
const read=name=>readFile(path.join(target,name),'utf8');
const app=await read('app-v11.js');
const output={innerHTML:''};
const choices=[
  {id:'enqueteur',cap:1,taken:1,info:{label:'Enquêteur',body:'Conduis les entretiens.'}},
  {id:'analyste',cap:1,taken:1,info:{label:'Analyste',body:'Observe les déclarations.'}},
  {id:'suspect',cap:3,taken:0,info:{label:'Suspect',body:'Défends ta version.'}}
];
const context={
  STATE:{hostToken:'host',sync:{room:{scenario_id:'021'}}},
  SOUND:{enabled:false},
  byId:()=>output,shell:html=>html,
  scenario:id=>({id,title:'Dossier '+id}),
  roleChoiceSummary:()=>choices,
  publicScenarioSummary:()=>'',avatarHtml:()=>'',publicRoleLabel:role=>role,
  h:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
};
const start=app.indexOf('function lobbyThemeForScenario(');
const end=app.indexOf('async function chooseLobbyRole(',start);
assert(start>=0&&end>start,'Built app must expose the room palette and lobby renderer');
vm.runInNewContext(app.slice(start,end),context);
const palettes=[['base',1,20],['omerta',21,25],['terror',26,28],['cartel',29,31],['regime',32,34]];
for(const [theme,min,max] of palettes){
  for(let n=min;n<=max;n++){
    const id=String(n).padStart(3,'0');
    const data={room:{scenario_id:id,code:'ABCDE',min_players:2,max_players:8,state:{}},players:[{id:'me',pseudo:'Ali',preferred_role:'enqueteur'},{id:'other',pseudo:'Autre',preferred_role:'analyste'}],player:{id:'me',preferred_role:'enqueteur'}};
    context.renderLobby(data);
    assert(output.innerHTML.includes(`data-igr-scenario-id="${id}"`),`${id}: rendered room must beat stale STATE.sync`);
    assert(output.innerHTML.includes(`data-igr-lobby-theme="${theme}"`),`${id}: correct palette must be present in the first render`);
    const buttons=[...output.innerHTML.matchAll(/<button\b[^>]*data-role-id="([^"]+)"[^>]*>[\s\S]*?<\/button>/g)];
    const chosen=buttons.find(button=>button[1]==='enqueteur')?.[0];
    const full=buttons.find(button=>button[1]==='analyste')?.[0];
    const available=buttons.find(button=>button[1]==='suspect')?.[0];
    assert(chosen?.includes('aria-pressed="true"')&&chosen.includes('TON RÔLE'),`${id}: chosen role must have an accessible and visible state`);
    assert(!/<button[^>]*\bdisabled\b/.test(chosen),`${id}: own chosen role remains enabled when capacity is reached`);
    assert(full?.includes('aria-pressed="false"')&&/<button[^>]*\bdisabled\b/.test(full)&&full.includes('COMPLET'),`${id}: another full role remains blocked and labelled`);
    assert(available?.includes('aria-pressed="false"')&&!/<button[^>]*\bdisabled\b/.test(available),`${id}: available role remains selectable`);
  }
}

// Contrast is checked from the actual room CSS tokens, including the complete
// state whose former whole-card opacity made its text difficult to read.
const css=await read('lobby-ui-fix-v13.css');
function tokens(theme){
  const selector=theme==='base'?'[data-igr-lobby-theme]':`[data-igr-lobby-theme="${theme}"]`;
  const key='#app .lobby-v11'+selector+'{';
  const index=css.indexOf(key);
  assert(index>=0,`${theme}: scoped palette missing`);
  const block=css.slice(index+key.length,css.indexOf('}',index));
  return Object.fromEntries([...block.matchAll(/--igr-lobby-([\w-]+):([^;]+);/g)].map(match=>[match[1],match[2].trim()]));
}
function luminance(hex){
  assert(/^#[\da-f]{6}$/i.test(hex),'Contrast check requires opaque six-digit room tokens');
  const channels=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [theme] of palettes){
  const palette=tokens(theme);
  for(const [foreground,background,label] of [['#f4f6f8',palette.selected,'selected role title'],['#b7bec6',palette.selected,'role description'],[palette.accent,palette.chip,'selected badge'],['#dce2e7',palette.chip,'complete badge']]){
    assert(contrast(foreground,background)>=4.5,`${theme}: ${label} requires at least 4.5:1 contrast`);
  }
}

let sw=null,shell=[];
try{
  sw=await read('service-worker.js');
  const scope={};
  vm.runInNewContext(sw.slice(0,sw.indexOf('];')+2)+';globalThis.shell=SHELL;globalThis.cache=CACHE;',scope);
  shell=scope.shell;
  assert(shell.includes('/assets/intro-v10-14.webp'),'The desktop doorway must be available offline before the first home visit');
  const data={window:{}};
  vm.runInNewContext(await read('heritage-maitre-data-v34.js'),data);
  vm.runInNewContext(await read('heritage-maitre-assets-v34.js'),data);
  for(const chapter of data.window.IGR_HERITAGE_MAITRE_DATA.META.chapters){
    await stat(path.join(target,chapter.poster.split('?')[0].slice(1)));
    assert(shell.includes(chapter.poster),'Every restored MAÎTRE poster must be precached');
  }
  assert.equal(scope.cache,'igr-'+VERSION,'PWA cache must use the new lobby release');
  assert(app.includes('/service-worker.js?v='+VERSION),'App must register the same service worker version');
}catch(error){if(error.code!=='ENOENT')throw error}
for(const page of ['index.html','en.html']){
  const html=await read(page);
  if(page==='en.html'&&html.includes("location.replace('./')")&&!html.includes('app-v11.js')){
    assert(html.includes("localStorage.setItem('igr_locale','en')"),'English redirect must preserve locale selection');
    continue;
  }
  for(const asset of assets){
    await stat(path.join(target,asset));
    const url=asset+'?v='+VERSION;
    assert(html.includes(url),`${page}: stale or absent ${asset}`);
    if(sw)assert(shell.includes('/'+url),`${page}: ${url} must match the PWA precache`);
  }
  assert.equal([...html.matchAll(/<link[^>]+href=["']lobby-ui-fix-v13\.css/g)].length,1,`${page}: load the lobby stylesheet once`);
  assert.equal([...html.matchAll(/<link[^>]+id="igr-startup-stability-v13-3-css"/g)].length,1,`${page}: the startup bootstrap must reuse the current entrance stylesheet`);
}

// Role dossier v82: scenario facts stay separate from short, conservative identity context.
const roleStart=app.indexOf('function igr82RelationLink(');
const roleEnd=app.indexOf('function privateCardHtml(){',roleStart);
assert(roleStart>=0&&roleEnd>roleStart,'Context-aware relationship renderer must be bundled');
const roleContext={h:context.h,window:{IGR_LOCALE:'fr'}};
vm.runInNewContext(app.slice(roleStart,roleEnd),roleContext);
const renderRel=text=>roleContext.valueBlock('TES RELATIONS',[{pseudo:'ipad',text}]);
const unknown=renderRel('Ton point de départ — Tu ne le connais pas. Tu ignores ce qu’il a pu voir.\n\nÀ mettre sur la table — À quelle heure ?');
assert(unknown.includes('Tu ne le connais pas.'),'Unknown persons must remain unknown');
assert(unknown.includes('Tu ignores ce qu’il a pu voir.'),'Canonical factual details must remain visible');
assert(unknown.includes('CE QUE TU SAIS DE CETTE PERSONNE'),'A clear factual label is required');
assert(unknown.includes('CE QUE TU PEUX LUI DEMANDER'),'A clear, optional conversation label is required');
assert(!unknown.includes('Ton point de départ')&&!unknown.includes('À mettre sur la table'),'Old opaque markers must not leak into the role UI');
assert(unknown.includes('À quelle heure ?'),'Open-ended conversation prompts must remain visible');
assert(!unknown.includes('Vous avez déjà été en contact.'),'Unknown persons must not inherit a fictional encounter');
const colleagues=renderRel('Ton point de départ — Vous travaillez dans la même structure, sans relation personnelle connue.');
assert(colleagues.includes('Vous travaillez dans la même structure, sans forcément vous connaître.'),'Shared workplace must preserve only plausible contact');
const family=renderRel('Ton point de départ — Elena est ta sœur, extérieure au groupe.');
assert(family.includes('C’est ta sœur.'),'Family relationship must retain its explicit kinship');
const friend=renderRel('Ton point de départ — C’est ton ami le plus proche ; tu lui fais confiance.');
assert(friend.includes('C’est ton ami le plus proche.'),'Explicit friendship must not become an unknown link');
const uncertain=renderRel('Ton point de départ — Une première dispute a précédé ton arrivée.');
assert(uncertain.includes('Tu ne le connais pas personnellement.'),'Missing relational evidence must not invent a bond');
const doubled=roleContext.valueBlock('TES RELATIONS',[{pseudo:'Samir',text:'Ton point de départ — Tu as reçu son appel.'},{pseudo:'Samir',text:'Ton point de départ — Tu as reçu son appel.'}]);
assert.equal((doubled.match(/igr82-relation-person/g)||[]).length,1,'A duplicate relation cannot create two repeated cards');
const escaped=roleContext.valueBlock('TES RELATIONS',[{pseudo:'<script>',text:'Ton point de départ — Rien de certain.'}]);
assert(!escaped.includes('<script>')&&escaped.includes('&lt;script&gt;'),'Player names must be escaped');
roleContext.window.IGR_LOCALE='en';
assert(renderRel('Ton point de départ — Tu ne le connais pas.').includes('You do not know this person.'),'English relation label must be available');
assert((await read('screen-polish-v73.css')).includes('.igr82-relation-list'),'Responsive role styling must be shipped');
assert(unknown.includes('ENTRE VOUS'),'Relationships must be written as human connections rather than legal dossiers');
assert(!uncertain.includes('Lien personnel non précisé'),'Do not expose bureaucratic missing-link placeholders to suspects');
const quitStart=app.indexOf('function liveSessionControls()'),quitEnd=app.indexOf('let ADVANCE_BUSY=',quitStart);
assert(quitStart>=0&&quitEnd>quitStart,'Persistent exit renderer must be present');
assert(app.slice(quitStart,quitEnd).includes('confirmLeaveGame(event)'),'Bottom exit must trigger the live confirmation');
assert(app.includes('class="phase-exit-btn"')&&app.includes('aria-label="Quitter la partie"'),'Phase header must expose an accessible exit');
assert(/function leaveRoom\(\)\{\s*stopRoomWatcher\(\);clearSession\(\)/.test(app),'Leaving a room must erase its persisted resume token');
assert((await read('screen-polish-v73.css')).includes('phase-exit-btn'),'Top exit must have a touch-sized hit area');
assert(app.includes('function mountLiveSessionControls()')&&app.includes('document.body.appendChild(controls)'),'Viewport session controls must escape sticky header stacking contexts');

console.log('Lobby v85: 34 first-render palettes, chosen/full/available states, text contrast and web/mobile cache propagation OK');
