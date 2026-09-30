import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const read=f=>fs.readFileSync(f,'utf8');
const must=(file,items)=>{const t=read(file);for(const x of items)if(!t.includes(x))throw new Error(`${file} missing marker: ${x}`)};
const mustNot=(file,items)=>{const t=read(file);for(const x of items)if(t.includes(x))throw new Error(`${file} contains forbidden marker: ${x}`)};

must('index.html',['omerta-v12-37.css?v=v12.37-final','terror-v12-37.css?v=v12.37-final','dlc-suite-v12-37.css?v=v12.37-final','omerta-v12-37.js?v=v12.37-final','terror-v12-37.js?v=v12.37-final','dlc-suite-v12-37.js?v=v12.37-final']);
must('omerta-v12-37.js',['assets/omerta-021-l-enveloppe.webp?v=12.37-final','assets/omerta-025-il-don.webp?v=12.37-final','crypto.getRandomValues','igr_omerta_choose_role','igr_v4_choose_role','roleChoiceSummary','randomBusy','aria-busy','Aucun rôle disponible.','igr-remove-role-cta','if(document.querySelector(\'.page-create-v10-13\')) return \'\'']);
mustNot('omerta-v12-37.js',['window.STATE','Math.random','-hd.svg']);
must('omerta-v12-37.css',['body.igr-omerta-active .igr-remove-role-cta','body.igr-theme-omerta','rgba(75,10,15,.38)','object-fit:cover','object-position:center','full-page OMERTÀ continuity']);
must('terror-v12-37.js',["'026'","'027'","'028'",'LA VILLE TOMBE','LA ZONE ROUGE','DERNIER PÉRIMÈTRE','assets/terror-026-la-ville-tombe.webp?v=12.37-final','assets/terror-028-dernier-perimetre.webp?v=12.37-final']);
must('terror-v12-37.css',['body.igr-theme-terror','.terror-dlc-section','body.igr-theme-terror .role-choice-card']);
must('dlc-suite-v12-37.js',["'029'","'030'","'031'","'032'","'033'","'034'",'LE CYCLE MORT','LA COUR ACHETÉE','LA DETTE','LES ARCHIVES DU PALAIS','LA DYNASTIE','LES NOMS QU’ILS PORTAIENT','assets/cartel-029-le-cycle-mort.webp?v=12.37-final','assets/regime-034-les-noms-quils-portaient.webp?v=12.37-final','BASE 001–020','001–008','009–020','TOUS LES DLC','OMERTÀ','TERREUR','CARTEL','LE RÉGIME','igr_omerta_access_status','OWNER_ONLY_IDS','ACCÈS PROPRIÉTAIRE','Ce DLC est réservé au propriétaire.']);
must('dlc-suite-v12-37.css',['.igr-scenario-filters','position:sticky','.dlc-owner-lock','body.igr-theme-cartel','body.igr-theme-regime','body.igr-theme-cartel .role-choice-card','body.igr-theme-regime .role-choice-card']);
must('service-worker.js',['igr-v12-37-final','/assets/omerta-021-l-enveloppe.webp?v=12.37-final','/assets/terror-026-la-ville-tombe.webp?v=12.37-final','/assets/cartel-029-le-cycle-mort.webp?v=12.37-final','/assets/regime-032-les-archives-du-palais.webp?v=12.37-final']);
must('scripts/build-web.mjs',['omerta-v12-37.js','terror-v12-37.js','dlc-suite-v12-37.js']);
must('scripts/build-mobile.mjs',['omerta-v12-37.js','terror-v12-37.js','dlc-suite-v12-37.js']);
must('supabase/migrations/20260930_dlc_suite_026_034.sql',["('026'","('028'","('029'","('031'","('032'","('034'",'on conflict (scenario_id) do nothing']);

for(const file of ['omerta-v12-37.js','terror-v12-37.js','dlc-suite-v12-37.js','service-worker.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/validate-dlc-assets.mjs'],{stdio:'inherit'});

if(fs.existsSync('app-v11.js')){
  must('app-v11.js',["{id:'001'","{id:'020'",'function chooseRandomLobbyRole()']);
  console.log('Base 001–020 markers present.');
}else{
  console.log('INFO app-v11.js absent in overlay ZIP; base-game marker check will run after extraction at repository root.');
}
console.log('v12.37 targeted DLC/UI regression checks OK');
