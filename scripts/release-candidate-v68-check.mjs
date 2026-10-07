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

for(const page of ['index.html','en.html']){
  const html=read(page);
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

console.log('\nInside Grey Room — Release Candidate v68 gate');
console.log('============================================');
for(const item of pass)console.log('✓ '+item);
for(const item of warnings)console.warn('! '+item);
for(const item of failures)console.error('✗ '+item);
console.log(`\n${pass.length} checks passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);
if(failures.length)process.exit(1);
