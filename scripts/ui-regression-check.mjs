import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const read=f=>fs.readFileSync(f,'utf8');
const must=(file,items)=>{const t=read(file);for(const x of items)if(!t.includes(x))throw new Error(`${file} missing marker: ${x}`)};
const mustNot=(file,items)=>{const t=read(file);for(const x of items)if(t.includes(x))throw new Error(`${file} contains forbidden marker: ${x}`)};

must('index.html',['omerta-v12-35.css?v=v12.35-dlc-suite','terror-v12.css?v=v12.35-dlc-suite','dlc-suite-v12-35.css?v=v12.35-dlc-suite','omerta-v12-35.js?v=v12.35-dlc-suite','terror-v12.js?v=v12.35-dlc-suite','dlc-suite-v12-35.js?v=v12.35-dlc-suite']);
must('omerta-v12-35.js',['assets/omerta-021-l-enveloppe.webp?v=12.35-hq','assets/omerta-025-il-don.webp?v=12.35-hq','crypto.getRandomValues','igr_omerta_choose_role','igr_v4_choose_role','roleChoiceSummary','randomBusy','aria-busy','Aucun rôle disponible.','Tu conduis les interrogatoires','Tu repères les contradictions','Tu protèges ton client','Tu arbitres les décisions']);
mustNot('omerta-v12-35.js',['window.STATE','Math.random','-hd.svg']);
must('omerta-v12-35.css',['body.igr-omerta-active .role-choice-card','body.igr-omerta-active .igr-random-role-cta','rgba(75,10,15,.38)','rgba(118,17,24,.60)','image-rendering:auto','object-fit:cover','object-position:center']);
mustNot('omerta-v12-35.css',['image-rendering:pixelated','image-rendering:crisp-edges']);
must('terror-v12.js',["'026'","'027'","'028'",'LA VILLE TOMBE','LA ZONE ROUGE','DERNIER PÉRIMÈTRE']);
must('dlc-suite-v12-35.js',["'029'","'030'","'031'","'032'","'033'","'034'",'LE CYCLE MORT','LA COUR ACHETÉE','LA DETTE','LES ARCHIVES DU PALAIS','LA DYNASTIE','LES NOMS QU’ILS PORTAIENT','BASE 001–020','001–008','009–020','TOUS LES DLC','OMERTÀ','TERREUR','CARTEL','LE RÉGIME','sessionStorage']);
must('service-worker.js',["igr-v12-35-dlc-suite",'/assets/omerta-021-l-enveloppe.webp?v=12.35-hq','/assets/omerta-025-il-don.webp?v=12.35-hq']);
must('scripts/build-web.mjs',['omerta-v12-35.js','terror-v12.js','dlc-suite-v12-35.js']);
must('scripts/build-mobile.mjs',['omerta-v12-35.js','terror-v12.js','dlc-suite-v12-35.js']);
must('supabase/migrations/20260930_dlc_suite_026_034.sql',["('026'","('028'","('029'","('031'","('032'","('034'",'on conflict (scenario_id) do nothing']);

for(const file of ['omerta-v12-35.js','terror-v12.js','dlc-suite-v12-35.js','service-worker.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/validate-dlc-assets.mjs'],{stdio:'inherit'});

if(fs.existsSync('app-v11.js')){
  must('app-v11.js',["{id:'001'","{id:'020'",'function chooseRandomLobbyRole()']);
  console.log('Base 001–020 markers present.');
}else{
  console.log('INFO app-v11.js absent in overlay ZIP; base-game marker check will run after extraction at repository root.');
}
console.log('v12.35 targeted DLC/UI regression checks OK');
