// Regression for Santoro public copy, lobby family tree and avatar/poster isolation.
// Pure VM checks: no room tokens, backend secrets, or private scenario files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=name=>fs.readFileSync(name,'utf8');
const canonical=file('omerta-v12.js');
const polish=file('omerta-polish-v12.js');
const hotfix=file('omerta-hotfix-v12.js');
const art30=file('omerta-v12-30.js');
const art39=file('omerta-v12-39.js');
const html=file('index.html');
const sw=file('service-worker.js');
const css=file('omerta-polish-v12.css');
for(const [name,source] of Object.entries({canonical,polish,hotfix,art30,art39,sw})){
  new vm.Script(source,{filename:name+'.js'});
}
assert.match(canonical,/Vittorio Santoro, le Don intouchable/);
const start=canonical.indexOf('  const SCENARIO_DATA = [');
const finish=canonical.indexOf('  const ART_FALLBACK = ',start);
assert(start>=0&&finish>start,'Missing Omerta public catalog');
const synopses=vm.runInNewContext(canonical.slice(start,finish)+'\nSCENARIO_DATA;');
assert.equal(synopses.length,5,'All five Santoro dossiers must be represented');
const details=new Map([
 ['021',['Brooklyn','enveloppe','coursier','coups']],
 ['022',['Newark','Nino Caruso','témoins','alibi']],
 ['023',['Santoro','Bellomo','Russo','embuscade','chauffeur']],
 ['024',['Massimo De Luca','racket','enquêteurs','chauffeur']],
 ['025',['entrepreneur','Vittorio Santoro','blessé','ordonné']]
]);
for(const entry of synopses){
 const sid=entry.id;
 assert(details.has(sid),'Unexpected Santoro id '+sid);
 assert(entry.short.length>=125&&entry.short.length<=190,
  'Card synopsis must be concrete but mobile-readable for '+sid);
 for(const term of details.get(sid)){
  assert(entry.short.includes(term),'Missing material public fact '+term+' from '+sid);
 }
 assert(!/Verri|quelques phrases|un argent qui reste|au bord de la guerre/i.test(entry.short),
  'Legacy or vague copy must not return for '+sid);
 assert(/[.?]$/.test(entry.short),'Synopsis must end in natural punctuation for '+sid);
}
assert(html.includes('omerta-v12.js?v=santoro-shortcopy-20261108'));
assert(sw.includes('/omerta-v12.js?v=santoro-shortcopy-20261108'));
assert.match(canonical,/Domenico Falco manque à l'appel/);
assert.doesNotMatch(polish,/Vittorio Verri|Adriano Verri|Famiglia Verri/);
assert.doesNotMatch(polish,/Object\.assign\(sc,COPY\[id\]\)/);
assert.doesNotMatch(hotfix,/L’arbre apparaîtra avec la campagne|PROCHAIN DOSSIER/);
assert.doesNotMatch(polish,/L’arbre apparaîtra avec la campagne|PROCHAIN DOSSIER/);

const fakeState={view:'lobby',selectedScenario:'021',sync:{room:{scenario_id:'023',state:{omerta_standalone:true}}}};
const fakeDocument={querySelector(selector){
  if(selector==='.lobby-v11[data-igr-scenario-id]')return {dataset:{igrScenarioId:'023'}};
  return null;
}};
const env={window:{},STATE:fakeState,document:fakeDocument};
const hierarchyFrom=polish.indexOf('  function isOmerta(id)');
const hierarchyTo=polish.indexOf('  try{Object.assign(ROLE_INFO',hierarchyFrom);
assert(hierarchyFrom>=0&&hierarchyTo>hierarchyFrom,'Public hierarchy helper is missing');
vm.runInNewContext(
  "const OMERTA_IDS=new Set(['021','022','023','024','025']);\n"
  +polish.slice(hierarchyFrom,hierarchyTo),
  vm.createContext(env)
);
const tree=JSON.parse(JSON.stringify(env.window.igrOmertaPublicFamilyTree('023')));
assert.equal(tree.length,7);
assert.equal(tree[0].name,'Famiglia Santoro');
assert.ok(tree.every(x=>x.structural===true));
assert.ok(tree.filter(x=>x.parent).every(x=>tree.some(y=>y.id===x.parent)));
assert.ok(!JSON.stringify(tree).includes('Verri'));
const hotfixFrom=hotfix.indexOf('  function activeState()');
const hotfixTo=hotfix.indexOf('  window.igrOmertaOpenFamilyTree=function()',hotfixFrom);
assert(hotfixFrom>=0&&hotfixTo>hotfixFrom,'Public tree rendering not found');
const context={window:env.window,STATE:fakeState,document:fakeDocument};
vm.createContext(context);
const render=vm.runInContext(
  "const IDS=['021','022','023','024','025'];const SET=new Set(IDS);\n"
    +hotfix.slice(hotfixFrom,hotfixTo)
    +"\n({html:treeHtml(),selection:progress(),id:currentId()})",
  context);
assert.equal(render.id,'023','The open lobby, not a stale previous scenario, must own the tree');
assert.match(render.html,/Famiglia Santoro/);
assert.match(render.html,/Consigliere/);
assert.match(render.html,/RANG PUBLIC/);
assert.match(render.html,/structure des rangs/i);
assert.match(render.selection,/class="current" aria-current="true">023/);
assert.doesNotMatch(render.html,/Verri|L’arbre apparaîtra/);

const start=art39.indexOf('  const HERO_IMAGE_SELECTOR');
const end=art39.indexOf('  function restoreNonOmertaArtwork',start);
assert(start>=0&&end>start);
const imageEnv={isOmerta:id=>['021','022','023','024','025'].includes(id),visibleScenarioId:()=> '023'};
vm.createContext(imageEnv);
vm.runInContext(art39.slice(start,end),imageEnv);
const posterId=vm.runInContext('findOmertaImageId',imageEnv);
const avatar={
  closest(s){
    if(s.includes('.avatar'))return {className:'avatar avatar-small'};
    if(s==='[data-igr-scenario-id]')return {dataset:{igrScenarioId:'023'}};
    return null;
  },
  matches(){return false}
};
const scenarioImage={
  closest(s){
    if(s.includes('.avatar'))return null;
    if(s.includes('[id^="scenario-"]'))return {id:'scenario-023'};
    return null;
  },
  matches(s){return s.includes('.scenario-thumb img')}
};
const heroImage={
  closest(s){
    if(s.includes('.avatar'))return null;
    if(s==='[data-igr-scenario-id]')return {dataset:{igrScenarioId:'025'}};
    return null;
  },
  matches(s){return s.includes('.confirm-art img')}
};
assert.equal(posterId(avatar),null,'Player avatar must not become the poster of its lobby');
assert.equal(posterId(scenarioImage),'023','Actual poster must still be repaired');
assert.equal(posterId(heroImage),'025','Confirmation artwork must still be repaired');
assert.match(art30,/img\.closest\?\.\('\.avatar,\.player-ident,\.lobby-player-live,\.game-player-ident'\)/);

for(const asset of ['omerta-polish-v12.js','omerta-hotfix-v12.js','omerta-v12-30.js','omerta-v12-39.js','omerta-polish-v12.css']){
  const version=asset+'?v=santoro-visual-fix-20261108';
  assert.ok(html.includes(version),'HTML does not refresh '+asset);
  assert.ok(sw.includes('/'+version),'PWA offline shell does not refresh '+asset);
}
assert.match(css,/omerta-tree-public-note/);
assert.match(css,/omerta-dossier-progress span\.current/);
console.log('OMERTA SANTORO VISUAL: no Verri copy; current public hierarchy; real posters only, no avatar takeover; iPhone/PWA assets refreshed.');
