import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const BASE_VERSION='v42.3-mobile-chrome';
const AUDIT_VERSION='v42.1-investigation-audit';
const SHELL_VERSION='v42.3-mobile-chrome';
const CACHE='igr-v42-investigation-ui';
const runtimeName='investigation-runtime-v42.js';
const auditName='investigation-audit-v42-1.js';
const authoritativeName='authoritative-runtime-v41.js';
const runtimeSource=path.join(root,runtimeName);
const auditSource=path.join(root,auditName);
const runtimeTarget=path.join(target,runtimeName);
const auditTarget=path.join(target,auditName);
const authoritativeTarget=path.join(target,authoritativeName);
const swTarget=path.join(target,'service-worker.js');
const appTarget=path.join(target,'app-v11.js');
const pages=['index.html','en.html'];
const exists=async file=>{try{await stat(file);return true}catch{return false}};
const replaceRequired=(text,from,to,label)=>{
  const next=typeof from==='string'?text.replace(from,to):text.replace(from,to);
  if(next===text)throw new Error(`v42.3 patch target missing: ${label}`);
  return next;
};

if(!(await exists(target)))throw new Error(`v42 target missing: ${target}`);
for(const source of [runtimeSource,auditSource])if(!(await exists(source)))throw new Error(`${path.basename(source)} missing`);
for(const source of [runtimeSource,auditSource]){
  const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
  if(parsed.status!==0)throw new Error(`${path.basename(source)} syntax error: ${parsed.stderr||parsed.stdout}`);
}
await copyFile(runtimeSource,runtimeTarget);
await copyFile(auditSource,auditTarget);

// v42.2 — one Settings owner only. v41 keeps the top-bar button; v42 no longer
// moves it into the persistent bottom controls, and neither layer observes its
// own DOM mutations. This removes the runaway row of gear buttons on iPhone.
if(!(await exists(authoritativeTarget)))throw new Error(`${authoritativeName} missing from built target`);
let authoritative=await readFile(authoritativeTarget,'utf8');
authoritative=replaceRequired(
  authoritative,
  "if(app&&window.MutationObserver)new MutationObserver(queueSettings).observe(app,{childList:true,subtree:true});",
  "/* v42.2: render hooks own Settings refresh; no self-triggering DOM observer. */",
  'v41 settings MutationObserver'
);
if(!authoritative.includes('IGR_V41_SETTINGS_SINGLE_OWNER'))authoritative=`/* IGR_V41_SETTINGS_SINGLE_OWNER */\n${authoritative}`;
await writeFile(authoritativeTarget,authoritative,'utf8');

let runtime=await readFile(runtimeTarget,'utf8');
runtime=replaceRequired(runtime,"const VERSION='v42.2-cell-stability';","const VERSION='v42.3-mobile-chrome';",'v42 runtime version');
runtime=replaceRequired(
  runtime,
  "function renderElementsTab(){\n  const r=role(),events=revealedElements();\n  const visible=canSeeEvidence(r)?events:events.filter(e=>String(e.event_type||'')!=='trame');",
  "function renderElementsTab(){\n  const r=role();\n  if(!canSeeEvidence(r))return r==='suspect'?renderSuspectChronology():'';\n  const events=revealedElements();\n  const visible=events;",
  'investigation elements authorization'
);
runtime=replaceRequired(
  runtime,
  "    let tabs=(baseGameTabs.apply(this,arguments)||[]).map(t=>t?.id==='timeline'?{...t,label:copy('Éléments d’enquête','Investigation elements')}:t);",
  "    const currentRole=role();\n    let tabs=baseGameTabs.apply(this,arguments)||[];\n    tabs=canSeeEvidence(currentRole)\n      ? tabs.map(t=>t?.id==='timeline'?{...t,label:copy('Éléments d’enquête','Investigation elements')}:t)\n      : tabs.filter(t=>t?.id!=='timeline');",
  'role-aware investigation tab'
);
runtime=replaceRequired(
  runtime,
  "  const v42RenderGameTab=function(){\n    let html;",
  "  const v42RenderGameTab=function(){\n    if(S()?.tab==='timeline'&&!canSeeEvidence(role()))S().tab=role()==='suspect'?'chronology':'card';\n    let html;",
  'direct timeline access guard'
);
runtime=replaceRequired(
  runtime,
  /function ensureSettings\(\)\{[\s\S]*?\n\}\nfunction postRender\(\)\{pickerNames\(\);ensureSettings\(\)\}/,
  "function ensureSettings(){\n  try{return window.IGR_AUTHORITATIVE_V41?.ensureSettings?.()}catch(_){}\n}\nfunction postRender(){pickerNames()}",
  'v42 competing Settings owner'
);
runtime=replaceRequired(
  runtime,
  "const app=document.getElementById('app');if(app&&window.MutationObserver)new MutationObserver(queuePost).observe(app,{childList:true,subtree:true});",
  "const app=document.getElementById('app');/* v42.2: render/change hooks replace the self-triggering observer. */",
  'v42 post-render MutationObserver'
);

// v42.3 — private cards end with one short, neutral lie rule. The objective
// remains immediately above it, so the sentence can never split the card body.
runtime=replaceRequired(
  runtime,
  "      const summary=card.querySelector('.role-summary');\n      const foot=card.querySelector('.role-foot');\n      if(summary){\n        summary.classList.add('v42-objective-bottom');\n        if(foot)card.insertBefore(summary,foot);else card.appendChild(summary);\n      }",
  "      const summary=card.querySelector('.role-summary');\n      const foot=card.querySelector('.role-foot');\n      if(summary){\n        summary.classList.add('v42-objective-bottom');\n        card.appendChild(summary);\n      }\n      if(foot){\n        foot.classList.add('v42-lie-note-bottom');\n        foot.textContent=copy('Mentir est possible.','Lying is possible.');\n        card.appendChild(foot);\n      }",
  'private-card lie note placement'
);

// v42.3 — Settings must fully own the viewport while open, and the live Quit
// capsule sits one row below the top-bar gear instead of covering it on iPhone.
runtime=replaceRequired(
  runtime,
  ".v42-settings span{font-size:18px;line-height:1}.v41-event-panel>.v41-event-head{display:none!important}",
  ".v42-settings span{font-size:18px;line-height:1}.v42-lie-note-bottom{order:100;margin-top:15px!important;padding-top:14px!important;border-top:1px solid rgba(255,255,255,.10)!important;color:#7e8993!important}.igr-settings-modal{z-index:520!important}body:has(.igr-settings-modal) #igrUniversalDock{display:none!important}body.igr-game-active #app .page>.live-session-controls .live-exit-btn{top:calc(env(safe-area-inset-top,0px) + 30px)!important}@media(max-width:390px){body.igr-game-active #app .page>.live-session-controls .live-exit-btn{top:calc(env(safe-area-inset-top,0px) + 29px)!important}}.v41-event-panel>.v41-event-head{display:none!important}",
  'settings modal and live quit chrome'
);
if(!runtime.includes('IGR_V42_2_CELL_STABILITY'))runtime=`/* IGR_V42_2_CELL_STABILITY */\n${runtime}`;
if(!runtime.includes('IGR_V42_3_MOBILE_CHROME'))runtime=`/* IGR_V42_3_MOBILE_CHROME */\n${runtime}`;
await writeFile(runtimeTarget,runtime,'utf8');

const patchedV41=spawnSync(process.execPath,['--check',authoritativeTarget],{encoding:'utf8'});
if(patchedV41.status!==0)throw new Error(`${authoritativeName} patched syntax error: ${patchedV41.stderr||patchedV41.stdout}`);
const patchedV42=spawnSync(process.execPath,['--check',runtimeTarget],{encoding:'utf8'});
if(patchedV42.status!==0)throw new Error(`${runtimeName} patched syntax error: ${patchedV42.stderr||patchedV42.stdout}`);

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']investigation-runtime-v42\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+src=["']investigation-audit-v42-1\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${BASE_VERSION}"></script>\n  <script src="${auditName}?v=${AUDIT_VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${SHELL_VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(/^\s*['"]\/investigation-runtime-v42\.js\?v=[^'"]+['"],?\s*$/gmi,'');
  sw=sw.replace(/^\s*['"]\/investigation-audit-v42-1\.js\?v=[^'"]+['"],?\s*$/gmi,'');
  const entries=`  '/${runtimeName}?v=${BASE_VERSION}',\n  '/${auditName}?v=${AUDIT_VERSION}',`;
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n${entries}`);
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v41=html.lastIndexOf('authoritative-runtime-v41.js?v=v41-authoritative-ui');
  const v42=html.lastIndexOf(`${runtimeName}?v=${BASE_VERSION}`);
  const audit=html.lastIndexOf(`${auditName}?v=${AUDIT_VERSION}`);
  if(v41<0||v42<0||audit<0||!(v41<v42&&v42<audit))throw new Error(`${name}: bad v41/v42.3/audit runtime order`);
  const after=html.slice(audit+`${auditName}?v=${AUDIT_VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v42.1 audit runtime is not the last external script`);
}

const finalRuntime=await readFile(runtimeTarget,'utf8');
for(const marker of ['IGR_INVESTIGATION_V42','IGR_V42_2_CELL_STABILITY','IGR_V42_3_MOBILE_CHROME','Éléments d’enquête','Chronologie','v42-objective-bottom','v42-lie-note-bottom','Mentir est possible.','v42-picker-names']){
  if(!finalRuntime.includes(marker))throw new Error(`v42 runtime missing marker: ${marker}`);
}
const finalV41=await readFile(authoritativeTarget,'utf8');
if(!finalV41.includes('IGR_V41_SETTINGS_SINGLE_OWNER'))throw new Error('v41 single Settings owner marker missing');
const finalAudit=await readFile(auditTarget,'utf8');
for(const marker of ['IGR_INVESTIGATION_AUDIT_V42_1','interrogation_seconds','CONTEXT_SITUATIONS_EN','CONTEXT_HINTS_EN','durationLabel']){
  if(!finalAudit.includes(marker))throw new Error(`v42.1 audit runtime missing marker: ${marker}`);
}
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${SHELL_VERSION}`))throw new Error('app-v11.js service-worker registration is stale after v42.3');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker cache namespace is stale after v42.3');
  if(!sw.includes(`/${runtimeName}?v=${BASE_VERSION}`))throw new Error('service-worker does not precache v42.3 runtime');
  if(!sw.includes(`/${auditName}?v=${AUDIT_VERSION}`))throw new Error('service-worker does not precache v42.1 audit runtime');
}
console.log(`Inside Grey Room ${SHELL_VERSION}: settings chrome + role-card lie note applied to ${process.argv[2]||'dist'}`);
