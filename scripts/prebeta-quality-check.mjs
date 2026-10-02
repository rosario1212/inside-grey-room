import { readFile, stat, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const warnings=[];
const ok=(condition,message)=>{if(!condition)failures.push(message)};
const read=rel=>readFile(path.join(root,rel),'utf8');

const css=await read('prebeta-v30.css');
const runtime=await read('mobile-ui-v28.js');
const lifecycle=await read('native-lifecycle-v12.js');
const apply=await read('scripts/apply-mobile-ui-v28.mjs');

for(const rel of ['mobile-ui-v28.js','native-lifecycle-v12.js','scripts/apply-mobile-ui-v28.mjs']){
  const parsed=spawnSync(process.execPath,['--check',path.join(root,rel)],{encoding:'utf8'});
  ok(parsed.status===0,`${rel}: JavaScript syntax check failed: ${parsed.stderr||parsed.stdout}`);
}

// Theme ownership: selected-role accents must be explicit and never inherit OMERTA red.
for(const theme of ['omerta','terror','cartel','regime']){
  ok(css.includes(`body.igr-theme-${theme}{`),`prebeta-v30.css: missing ${theme} role-selection theme token block`);
}
ok(css.includes('--igr-role-accent:#d0bc80'),'prebeta-v30.css: CARTEL gold accent missing');
ok(css.includes('--igr-role-accent:#9db4c6'),'prebeta-v30.css: LE REGIME blue-grey accent missing');
ok(css.includes('--igr-role-accent:#d8dbe0'),'prebeta-v30.css: TERREUR neutral accent missing');
ok(css.includes('--igr-role-accent:#e47a7d'),'prebeta-v30.css: OMERTA red accent missing');
ok(css.includes('.role-choice-zone .role-choice-card.selected em'),'prebeta-v30.css: selected-role label ownership override missing');
ok(css.includes('color:var(--igr-role-accent)!important'),'prebeta-v30.css: selected-role label does not use active theme accent');

// Runtime isolation: stale OMERTA classes must be purged whenever another DLC is active.
ok(runtime.includes('function sanitizeThemeState()'),'mobile-ui-v28.js: DLC theme sanitizer missing');
ok(runtime.includes("body.classList.remove('igr-omerta-active')"),'mobile-ui-v28.js: stale OMERTA active state is not purged');
ok(runtime.includes("document.querySelectorAll('.igr-omerta-cell')"),'mobile-ui-v28.js: stale OMERTA cell markers are not purged');
ok(runtime.includes("['omerta','terror','cartel','regime']"),'mobile-ui-v28.js: DLC theme map is incomplete');
ok(runtime.includes('sanitizeThemeState();'),'mobile-ui-v28.js: theme sanitizer is not part of the render repair pass');

// Navigation and role-choice regressions caught before field testing.
ok(runtime.includes("['profile','rules','join']"),'mobile-ui-v28.js: utility navigation repair no longer covers rules/join/profile');
ok(runtime.includes('normalizeChoiceStatus();'),'mobile-ui-v28.js: universal TON CHOIX normalizer missing');
ok(runtime.includes("button.textContent=isFr()?'Retirer':'Remove'"),'mobile-ui-v28.js: Retirer/Remove control normalization missing');

// Mobile lifecycle: installed iPhone/Android PWAs must recover without requiring Capacitor.
ok(lifecycle.includes("version:'12.9-pwa-resume'"),'native-lifecycle-v12.js: PWA lifecycle version marker missing');
ok(!lifecycle.includes("if(!cap?.isNativePlatform?.()"),'native-lifecycle-v12.js: lifecycle still exits early outside Capacitor');
ok(lifecycle.includes("typeof STATE!=='undefined'"),'native-lifecycle-v12.js: lexical STATE guard missing');
ok(!lifecycle.includes('globalThis.STATE?.room'),'native-lifecycle-v12.js: lifecycle incorrectly assumes const STATE is a window property');
ok(lifecycle.includes("window.addEventListener('pageshow'"),'native-lifecycle-v12.js: pageshow recovery missing');
ok(lifecycle.includes("window.addEventListener('online'"),'native-lifecycle-v12.js: network recovery listener missing');
ok(lifecycle.includes("window.addEventListener('offline'"),'native-lifecycle-v12.js: network pause listener missing');
ok(lifecycle.includes("await syncNow(true)"),'native-lifecycle-v12.js: forced room resync on resume missing');
ok(lifecycle.includes("startRoomWatcher()"),'native-lifecycle-v12.js: room watcher restart on resume missing');
ok(lifecycle.includes('await recoverAudio()'),'native-lifecycle-v12.js: audio recovery on resume missing');
ok(lifecycle.includes("stopLocalCapture()"),'native-lifecycle-v12.js: background camera release missing');

// Build/PWA propagation.
ok(apply.includes("'prebeta-v30.css'"),'apply-mobile-ui-v28.mjs: prebeta stylesheet is not copied into builds');
ok(apply.includes('v30-prebeta-theme-isolation'),'apply-mobile-ui-v28.mjs: v30 cache-busting marker missing');
ok(apply.includes('/prebeta-v30.css?v=${VERSION}'),'apply-mobile-ui-v28.mjs: service-worker precache does not include v30 stylesheet');

async function directorySize(rel){
  const base=path.join(root,rel);
  try{await stat(base)}catch{return null}
  let total=0;let largest={size:0,file:''};
  const walk=async(dir)=>{
    for(const entry of await readdir(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())await walk(full);
      else if(entry.isFile()){
        const s=(await stat(full)).size;total+=s;
        if(s>largest.size)largest={size:s,file:path.relative(base,full)};
      }
    }
  };
  await walk(base);return {total,largest};
}

for(const bundle of ['dist','www']){
  const info=await directorySize(bundle);if(!info)continue;
  const mib=info.total/1024/1024;
  if(mib>20)warnings.push(`${bundle}: bundle is ${mib.toFixed(2)} MiB; review assets before public beta.`);
  if(info.largest.size>5*1024*1024)warnings.push(`${bundle}: largest file is ${info.largest.file} (${(info.largest.size/1024/1024).toFixed(2)} MiB).`);
  try{
    const index=await read(`${bundle}/index.html`);
    const sw=await read(`${bundle}/service-worker.js`);
    ok(index.includes('prebeta-v30.css?v=v30-prebeta-theme-isolation'),`${bundle}/index.html: v30 stylesheet missing or stale`);
    ok(index.includes('mobile-ui-v28.js?v=v30-prebeta-theme-isolation'),`${bundle}/index.html: v30 runtime missing or stale`);
    ok(sw.includes('/prebeta-v30.css?v=v30-prebeta-theme-isolation'),`${bundle}/service-worker.js: v30 stylesheet not precached`);
  }catch{}
}

console.log('\nInside Grey Room — pre-beta quality gate');
console.log('========================================');
for(const warning of warnings)console.warn(`! ${warning}`);
if(failures.length){
  for(const failure of failures)console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('✓ Theme isolation, navigation, role-choice, mobile lifecycle and bundle propagation checks passed.');
