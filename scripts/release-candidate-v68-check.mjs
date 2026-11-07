import fs from 'node:fs';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const failures=[];
const warnings=[];
const pass=[];

function read(rel){
  const file=path.join(target,rel);
  if(!fs.existsSync(file)){failures.push(`Missing release file: ${rel}`);return '';}
  return fs.readFileSync(file,'utf8');
}
function ok(condition,message){
  if(condition)pass.push(message); else failures.push(message);
}

const css=read('release-polish-v68.css');
ok(css.includes('--igr-tap-target:44px'),'RC polish keeps a 44px coarse-pointer target');
ok(css.includes('safe-area-inset-bottom'),'RC polish handles bottom safe area');
ok(css.includes(':focus-visible'),'RC polish exposes keyboard focus');
ok(css.includes('prefers-reduced-motion'),'RC polish respects reduced motion');

const gameplayFlow=read('gameplay-flow-v13.js');
ok(!/08:00 signifie 08:00|Convoquer · 8 min/.test(gameplayFlow),'no stale eight-minute interrogation copy remains');
ok(!/Ouvrir l’Assemblée · 3 min/.test(gameplayFlow),'assembly CTA does not hard-code a duration that conflicts with duration mode');

const gameplayClean=read('gameplay-clean-v12.js');
ok(/phaseKickKey[\s\S]{0,240}cleanSync\(false\)/.test(gameplayClean),'phase-end sync avoids forced identical rerenders');
ok(gameplayClean.includes('uiPolishQueued')&&gameplayClean.includes("document.getElementById('app')||document.documentElement"),'gameplay DOM observer is paint-debounced and scoped');

const lobbyFix=read('lobby-ui-fix-v13.js');
ok(lobbyFix.includes('enhanceQueued')&&lobbyFix.includes('queueEnhanceLobby'),'lobby enhancement is coalesced to one paint');
ok(lobbyFix.includes("const BUILD='v70-fluidity1'"),'dynamic entrance/heritage bootstrap receives the fresh RC runtime version');

const authoritative=read('authoritative-runtime-v41.js');
ok(authoritative.includes('eventStartBusy')&&authoritative.includes("aria-busy"),'event selection blocks duplicate submits while an action is pending');

const entrance=read('startup-stability-v13-3.css');
ok(entrance.includes('safe-area-inset-bottom'),'entrance action accounts for the bottom safe area');
ok(['top','left','right'].every(side=>entrance.includes('safe-area-inset-'+side)),'entrance composition accounts for portrait and landscape safe areas');

for(const page of ['index.html','en.html']){
  const html=read(page);
  if(page==='index.html'){
    for(const asset of ['gameplay-clean-v12.js','gameplay-flow-v13.js','lobby-ui-fix-v13.js','authoritative-runtime-v41.js','judicial-runtime-v44.js','self-guided-rules-v51.js','app-v11.js','qa-fixes-v12.js']){
      ok(html.includes(asset+'?v=v72-omerta022-caruso-20261107'),`${page}: fresh fluidity asset ${asset}`);
    }
  }
  ok(html.includes('release-polish-v68.css?v=v68-rc1'),`${page}: RC polish loaded last`);
  ok(!/Inside Grey Room\s*·\s*B(?:ê|e)ta\s*12\.11\.0/i.test(html),`${page}: obsolete beta version hidden`);
  ok(!/\bGray Room\b/i.test(html),`${page}: brand spelling uses Grey Room`);
  ok(!/\bevent_select\b|\bundefined\b|\bTODO\b|\bFIXME\b/i.test(html),`${page}: no obvious internal/debug label in document shell`);

  const refs=[...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)].map(m=>m[1].split('?')[0]);
  for(const ref of refs){
    if(!ref || /^(?:https?:|data:|blob:|mailto:|tel:)/i.test(ref))continue;
    const clean=ref.replace(/^\.\//,'').replace(/^\//,'');
    if(clean && !fs.existsSync(path.join(target,clean)))failures.push(`${page}: missing local asset ${clean}`);
  }
}

const nativeBoundary=path.join(target,'native-store-boundary-v14.js');
if(fs.existsSync(nativeBoundary)){
  for(const page of ['index.html','en.html']){
    const html=read(page);
    ok(html.includes('native-store-boundary-v14.js'),`${page}: native commerce boundary present`);
    ok(!/dlc-invites-v12-45\.(?:js|css)/i.test(html),`${page}: legacy code unlock excluded from native bundle`);
  }
}

const runtimeFiles=fs.readdirSync(target).filter(name=>/\.(?:html|js|css)$/i.test(name));
for(const rel of runtimeFiles){
  const text=fs.readFileSync(path.join(target,rel),'utf8');
  if(/\bGray Room\b/i.test(text))failures.push(`${rel}: found forbidden brand spelling "Gray Room"`);
}
if(runtimeFiles.some(rel=>/\.js$/i.test(rel) && /event_select/.test(fs.readFileSync(path.join(target,rel),'utf8')))){
  warnings.push('Internal event_select token still exists in JavaScript. It is allowed as an internal key, but must never be rendered to players.');
}

const cardUi=read('app-v11.js');
ok(cardUi.includes("valueBlock('TON RANG ET TA PLACE',ps.story)"),'Omerta suspect card explains hierarchy');
ok(cardUi.includes("valueBlock('TES RELATIONS',ps.relations)"),'Omerta suspect card shows personal relationships');
ok(cardUi.includes("const santoroMyCard=santoroStandalone&&pub==='suspect'"),'Omerta hierarchy remains suspect-only in card UI');
const omertaCatalog=read('omerta-v12.js');
ok(/une enveloppe remplie d’argent manque à l’appel/i.test(omertaCatalog),'Omerta 021 catalogue uses the approved case premise');
ok(!omertaCatalog.includes("disparaît avant d’atteindre Enzo Rinaldi"),'Omerta 021 catalogue does not falsely assert theft');
ok(/Deux témoins racontent ensuite le même alibi/i.test(omertaCatalog),'Omerta 022 catalogue explains contested Caruso alibis');
ok(!omertaCatalog.includes('Un meurtre interne fragilise la Famiglia Santoro'),'Omerta 022 catalogue does not disclose the internal mafia hierarchy');
const swPath=path.join(target,'service-worker.js');
if(fs.existsSync(swPath)){
  const sw=fs.readFileSync(swPath,'utf8');
  ok(sw.includes("const CACHE='igr-v72-omerta022-caruso-20261107';"),'service worker cache bumped for fluidity runtime');
}

console.log('\nInside Grey Room — Release Candidate v68 gate');
console.log('============================================');
for(const item of pass)console.log('✓ '+item);
for(const item of warnings)console.warn('! '+item);
for(const item of failures)console.error('✗ '+item);
console.log(`\n${pass.length} checks passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);
if(failures.length)process.exit(1);
