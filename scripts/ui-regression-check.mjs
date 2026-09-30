import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const read=f=>fs.readFileSync(f,'utf8');
const must=(file,items)=>{const t=read(file);for(const x of items)if(!t.includes(x))throw new Error(`${file} missing marker: ${x}`)};
const mustNot=(file,items)=>{const t=read(file);for(const x of items)if(t.includes(x))throw new Error(`${file} contains forbidden marker: ${x}`)};

must('index.html',[
  'omerta-v12-40.css?v=v12.40-dlc-detail-theme',
  'terror-v12-40.css?v=v12.40-dlc-detail-theme',
  'dlc-suite-v12-40.css?v=v12.40-dlc-detail-theme',
  'omerta-v12-39.js?v=v12.39-choice-status',
  'terror-v12-37.js?v=v12.37-final',
  'dlc-suite-v12-37.js?v=v12.38-omerta-reset'
]);

must('omerta-v12-39.js',[
  'assets/omerta-021-l-enveloppe.webp?v=12.37-final',
  'assets/omerta-025-il-don.webp?v=12.37-final',
  'crypto.getRandomValues','igr_omerta_choose_role','igr_v4_choose_role','roleChoiceSummary','randomBusy','aria-busy',
  'igr-choice-status','ensureChoiceStatusCard','restoreNonOmertaArtwork','HERO_IMAGE_SELECTOR'
]);
mustNot('omerta-v12-39.js',['window.STATE','Math.random','-hd.svg']);

must('omerta-v12-40.css',[
  'body.igr-theme-omerta','.igr-choice-status','v12.40 OMERTÀ scenario-detail deep tint',
  '.page-scenario-detail','rgba(75,10,15,.30)'
]);
must('terror-v12-40.css',[
  'body.igr-theme-terror','v12.40 TERREUR scenario-detail deep tint','.page-scenario-detail'
]);
must('dlc-suite-v12-40.css',[
  'body.igr-theme-cartel','body.igr-theme-regime','v12.40 CARTEL / LE RÉGIME scenario-detail deep tint','.page-scenario-detail'
]);

must('service-worker.js',[
  'igr-v12-40-dlc-detail-theme',
  '/omerta-v12-40.css?v=v12.40-dlc-detail-theme',
  '/terror-v12-40.css?v=v12.40-dlc-detail-theme',
  '/dlc-suite-v12-40.css?v=v12.40-dlc-detail-theme',
  '/omerta-v12-39.js?v=v12.39-choice-status'
]);

must('scripts/build-web.mjs',['omerta-v12-40.css','terror-v12-40.css','dlc-suite-v12-40.css','omerta-v12-39.js','terror-v12-37.js','dlc-suite-v12-37.js']);
must('scripts/build-mobile.mjs',['omerta-v12-40.css','terror-v12-40.css','dlc-suite-v12-40.css','omerta-v12-39.js','terror-v12-37.js','dlc-suite-v12-37.js']);

// These files are expected from the already-installed v12.37/v12.38 base.
if(fs.existsSync('terror-v12-37.js')) must('terror-v12-37.js',["'026'","'027'","'028'",'LA VILLE TOMBE','DERNIER PÉRIMÈTRE']);
if(fs.existsSync('dlc-suite-v12-37.js')) must('dlc-suite-v12-37.js',["'029'","'034'",'CARTEL','LE RÉGIME','clearDlcVisualState']);

for(const file of ['omerta-v12-39.js','service-worker.js','scripts/build-web.mjs','scripts/build-mobile.mjs']){
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('v12.39 + v12.40 merged regression markers OK');
