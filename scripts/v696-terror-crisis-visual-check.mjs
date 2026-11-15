/* TERREUR v696 Option B — static, build-safe visual quality gate. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const css=read('terror-crisis-v696.css');
const html=read('index.html');
const sw=read('service-worker.js');
const publisher=read('scripts/publish-006-adaptive-shell.mjs');
const finalize=read('scripts/apply-lobby-display-v72.mjs');
const js=read('terror-live-v681.js');

const required=[
  '.lobby-head h1',
  '.lobby-case-preview',
  '.terror-v681-city-lobby',
  '.terror-v681-warning',
  '.terror-v681-city-entry',
  '.terror-v681-input-row input',
  '.terror-v681-input-row .btn.primary',
  '.igr-duration-tab-v35.is-active',
  '.role-choice-card.selected',
  '.terror-v694-command',
  ':focus-visible',
  '@media(max-width:430px)',
  '@media(max-width:360px)',
  '@media(prefers-reduced-motion:reduce)'
];
for(const term of required)assert(css.includes(term),'Missing crisis design detail: '+term);
assert(css.includes('data-igr-lobby-theme="terror"'),'Palette must be scoped to Terror lobby');
assert(css.includes('body:has(#app .lobby-v11[data-igr-lobby-theme="terror"])'),
  'Document background must depend on active Terror room, not stale body theme');
assert(!/^\s*(?:body|:root|\*|button|input)\s*\{/m.test(css),
 'Do not introduce unscoped global page/button styles');
assert(css.includes('#a74753')&&css.includes('#7d2e3b')&&css.includes('#181517'),
 'Black-and-crimson TERREUR palette is missing');
assert(!['#18212b','#151b24','#19212a','#080b10','#10161e'].some(shade=>css.includes(shade)), 'Old navy surfaces must be removed');
assert(css.includes('grid-template-columns:minmax(0,1fr)'),
 'Small iPhone city form must stack without horizontal overflow');
assert((css.match(/\{/g)||[]).length===(css.match(/\}/g)||[]).length,
 'Unbalanced CSS braces');
assert((html.match(/terror-crisis-v696\.css\?v=/g)||[]).length===1,
 'Terror crisis stylesheet must be loaded exactly once');
assert(js.includes('terrorV681SetCity')&&js.includes('igr_v681_terror_set_city'),
 'City validation must retain its real server action');
for(const build of ['scripts/build-web.mjs','scripts/build-mobile.mjs'])
 assert(read(build).includes("'terror-crisis-v696.css'"),'Missing asset in '+build);
assert(finalize.includes("'terror-crisis-v696.css'"),'Final page must version the crisis stylesheet');
assert(sw.includes('/terror-crisis-v696.css?v=terror-carbon-v697-20261115'),
 'Service worker source must preload the crisis CSS');
assert(publisher.includes('crisisCssPath')&&publisher.includes("const tag='terror-live-v694-20261115'"),
 'Publish step must advance its PWA cache');

if(process.argv[2]){
 const dir=process.argv[2],builtCss=dir+'/terror-crisis-v696.css';
 assert(existsSync(builtCss),'Bundled TERREUR CSS missing');
 const builtHtml=read(dir+'/index.html');
 const builtSw=read(dir+'/service-worker.js');
 assert((builtHtml.match(/terror-crisis-v696\.css\?v=/g)||[]).length===1,
  'Built page lost or duplicated crisis theme');
 assert(builtHtml.includes('terror-crisis-v696.css?v=terror-carbon-v697-20261115'), 'Built page kept blue v696 CSS URL');
 assert(builtSw.includes('/terror-crisis-v696.css?v=terror-carbon-v697-20261115'),
  'PWA precache URL and carbon release version are not aligned');
 assert(builtSw.includes('/terror-crisis-v696.css?v=terror-carbon-v697-20261115'),'PWA must preload carbon CSS');
}
console.log('PASS TERREUR v697: charcoal UI, muted red, scoped lobby, iPhone layout and isolated PWA cache.');
