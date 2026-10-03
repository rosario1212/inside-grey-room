import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const must=(f,parts)=>{const s=read(f);for(const p of parts)if(!s.includes(p))throw new Error(`${f}: missing ${p}`)};
const mustNot=(f,parts)=>{const s=read(f);for(const p of parts)if(s.includes(p))throw new Error(`${f}: unexpected ${p}`)};

must('index.html',[
  'dlc-invites-v12-45.css?v=v12.45-dlc-invites','dlc-invites-v12-45.js?v=v12.45-dlc-invites','omerta-v12-39.js?v=v12.45-choice-copy',
  'dlc-copy-v12-46.css?v=v12.46-copy','dlc-copy-v12-46.js?v=v12.46-copy','gameplay-flow-v13.css?v=v13.2-final','dlc-experience-v13.css?v=v13.2-final',
  'lobby-ui-fix-v13.css?v=v13.3-lobby-settings','scenario-flow-v13.js?v=v13.2-final','gameplay-flow-v13.js?v=v13.2-final','dlc-experience-v13.js?v=v13.2-final','lobby-ui-fix-v13.js?v=v13.3-lobby-settings'
]);
must('dlc-invites-v12-45.js',['igr_dlc_create_invite','igr_dlc_redeem_invite','igr_dlc_list_access','Gérer les accès','Code d’accès']);
must('dlc-invites-v12-45.css',['.igr-dlc-access-modal','.igr-dlc-new-code','.igr-dlc-access-action']);
must('omerta-v12-39.js',['igr-choice-status-note','Aucun rôle choisi']);
mustNot('omerta-v12-39.js',['igr-choice-status-empty']);

must('service-worker.js',[
  'igr-v36-1-parasite-fix','/play-modes-v13-8.js?v=v13.8-dual-play','/play-modes-v13-8.css?v=v13.8-dual-play',
  '/heritage-play-v13-7.js?v=v13.8-dual-play','/heritage-play-v13-7.css?v=v13.8-dual-play','/heritage-v13-5.js?v=v13.8-dual-play',
  '/heritage-premium-v13-6.js?v=v13.8-dual-play','/heritage-premium-v13-6.css?v=v13.8-dual-play',
  '/heritage-maitre-v34.css?v=v34.2-maitre-judicial','/heritage-maitre-judicial-v34.css?v=v34.2-maitre-judicial',
  '/heritage-maitre-data-v34.js?v=v34.2-maitre-judicial','/heritage-maitre-assets-v34.js?v=v34.2-maitre-judicial','/heritage-maitre-v34.js?v=v34.2-maitre-judicial',
  '/assets/heritage-maitre-01-le-client.webp?v=v34.1-maitre-posters','/assets/heritage-maitre-02-le-deal.webp?v=v34.1-maitre-posters',
  '/assets/heritage-maitre-03-deux-choix.webp?v=v34.1-maitre-posters','/assets/heritage-maitre-04-le-proces.webp?v=v34.1-maitre-posters','/assets/heritage-maitre-05-l-honneur.webp?v=v34.1-maitre-posters',
  '/dlc-invites-v12-45.js?v=v12.45-dlc-invites','/dlc-invites-v12-45.css?v=v12.45-dlc-invites','/omerta-v12-39.js?v=v12.45-choice-copy',
  '/dlc-copy-v12-46.js?v=v12.46-copy','/dlc-copy-v12-46.css?v=v12.46-copy','/gameplay-flow-v13.js?v=v13.2-final','/dlc-experience-v13.js?v=v13.2-final','/lobby-ui-fix-v13.js?v=v13.2-lobby-fix'
]);

must('scripts/build-web.mjs',['play-modes-v13-8.js','play-modes-v13-8.css','heritage-play-v13-7.js','heritage-play-v13-7.css','heritage-v13-5.js','heritage-premium-v13-6.js','heritage-premium-v13-6.css','dlc-invites-v12-45.js','dlc-invites-v12-45.css','dlc-copy-v12-46.js','dlc-copy-v12-46.css','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js','duration-modes-v35.js','duration-modes-v35.css']);
must('scripts/build-mobile.mjs',['play-modes-v13-8.js','play-modes-v13-8.css','heritage-play-v13-7.js','heritage-play-v13-7.css','heritage-v13-5.js','heritage-premium-v13-6.js','heritage-premium-v13-6.css','dlc-invites-v12-45.js','dlc-invites-v12-45.css','dlc-copy-v12-46.js','dlc-copy-v12-46.css','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js']);
must('scripts/apply-duration-v35.mjs',['duration-modes-v35.js','duration-modes-v35.css','v35-duration-modes']);
must('scripts/finalize-runtime-v36.mjs',['v36.1-parasite-fix','igr-v36-1-parasite-fix','final runtime integrity verified']);
must('package.json',['scripts/apply-duration-v35.mjs dist','scripts/apply-duration-v35.mjs www','scripts/finalize-runtime-v36.mjs dist','scripts/finalize-runtime-v36.mjs www']);
must('duration-modes-v35.js',["short:{estimate:'≈ 40–55 min'","long:{estimate:'≈ 70–90 min'",'interrogation:300','interrogation:480','confrontation:120','confrontation:240','assembly:150','assembly:240','igr_v35_set_duration_mode','AudioContext','phase_ends_at']);
must('duration-modes-v35.css',['.igr-duration-v35','.igr-duration-tab-v35','.is-active']);

must('supabase/migrations/20261001_dlc_invites_v12_45.sql',['igr_dlc_invites','igr_dlc_create_invite','igr_dlc_redeem_invite','wrong_dlc','cannot_revoke_owner']);
must('supabase/migrations/20261001_heritage_premium_access_v13_6.sql',["'heritage'",'igr_dlc_access_status','igr_dlc_grant_access','igr_dlc_revoke_access']);
must('heritage-premium-v13-6.js',['igr_dlc_access_status','ACCÈS LIMITÉ','window.IGR_HERITAGE_PREMIUM']);
must('heritage-premium-v13-6.css',['.heritage-premium-home-action','.heritage-premium-modal','.heritage-premium-lock']);
must('play-modes-v13-8.js',['v13.8-dual-play','igr_local_scenario_pack','igr_heritage_online_create','igr_heritage_online_join']);
must('play-modes-v13-8.css',['.dual-mode-chooser','.dual-mode-card','.heritage-dual-row']);
must('dlc-copy-v12-46.js',['5 dossiers liés. Une Famiglia. Jusqu’au Don.','Bloqués dans la Grey Room. Un groupe terroriste s’empare de la ville. Le périmètre se referme.','Le cartel frappe l’enquête, achète la justice et remonte jusqu’à vos proches.','Le régime est tombé. Les archives restent. Identifiez ceux qui ont ordonné, couvert et profité.']);
must('dlc-copy-v12-46.css',['.terror-access-pill[hidden]']);

must('heritage-maitre-data-v34.js',["id:'maitre'","title:'LE CLIENT'","title:'LE DEAL'","title:'DEUX CHOIX'","title:'LE PROCÈS'","title:'L’HONNEUR'",'L’ANGLE','LA DÉMONSTRATION']);
must('heritage-maitre-v34.js',['igr_heritage_maitre_live_v1','completeChapter','CE QUI EST DÉSORMAIS VRAI','CARTE DES LIENS','window.IGR_HERITAGE_MAITRE']);
must('heritage-maitre-v34.css',['.hplay-theme-maitre','.maitre-angle-box','.maitre-result-grid']);
must('heritage-maitre-assets-v34.js',['v34.3-maitre-polish','heritage-maitre-01-le-client.webp','heritage-maitre-02-le-deal.webp','heritage-maitre-03-deux-choix.webp','heritage-maitre-04-le-proces.webp','heritage-maitre-05-l-honneur.webp']);
mustNot('heritage-maitre-assets-v34.js',['.svg']);
must('scripts/apply-maitre-v34.mjs',['heritage-maitre-data-v34.js','heritage-maitre-assets-v34.js','heritage-maitre-v34.css','heritage-maitre-v34.js','heritage-maitre-01-le-client.webp','heritage-maitre-02-le-deal.webp','heritage-maitre-03-deux-choix.webp','heritage-maitre-04-le-proces.webp','heritage-maitre-05-l-honneur.webp','5 final posters + soft judicial theme + multiplayer bridge']);
mustNot('scripts/apply-maitre-v34.mjs',['.svg','renderPoster']);
must('package.json',['scripts/apply-maitre-v34.mjs dist','scripts/apply-maitre-v34.mjs www']);
console.log('v36.1 runtime hygiene + v35 duration modes + v34.3 MAÎTRE + v13.8 Dual Play + v12.46 DLC regression markers OK');
