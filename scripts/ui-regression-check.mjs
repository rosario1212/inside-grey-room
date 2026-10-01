import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const must=(f,parts)=>{const s=read(f);for(const p of parts)if(!s.includes(p))throw new Error(`${f}: missing ${p}`)};
const mustNot=(f,parts)=>{const s=read(f);for(const p of parts)if(s.includes(p))throw new Error(`${f}: unexpected ${p}`)};

must('index.html',['dlc-invites-v12-45.css?v=v12.45-dlc-invites','dlc-invites-v12-45.js?v=v12.45-dlc-invites','omerta-v12-39.js?v=v12.45-choice-copy','dlc-copy-v12-46.css?v=v12.46-copy','dlc-copy-v12-46.js?v=v12.46-copy','gameplay-flow-v13.css?v=v13.2-final','dlc-experience-v13.css?v=v13.2-final','lobby-ui-fix-v13.css?v=v13.2-lobby-fix','scenario-flow-v13.js?v=v13.2-final','gameplay-flow-v13.js?v=v13.2-final','dlc-experience-v13.js?v=v13.2-final','lobby-ui-fix-v13.js?v=v13.2-lobby-fix']);
must('dlc-invites-v12-45.js',['igr_dlc_create_invite','igr_dlc_redeem_invite','igr_dlc_list_access','Gérer les accès','Code d’accès']);
must('dlc-invites-v12-45.css',['.igr-dlc-access-modal','.igr-dlc-new-code','.igr-dlc-access-action']);
must('omerta-v12-39.js',['igr-choice-status-note','Aucun rôle choisi']);
mustNot('omerta-v12-39.js',['igr-choice-status-empty']);
must('service-worker.js',["igr-v13-2-final-lobby-fix",'/dlc-invites-v12-45.js?v=v12.45-dlc-invites','/dlc-invites-v12-45.css?v=v12.45-dlc-invites','/omerta-v12-39.js?v=v12.45-choice-copy','/dlc-copy-v12-46.js?v=v12.46-copy','/dlc-copy-v12-46.css?v=v12.46-copy','/gameplay-flow-v13.js?v=v13.2-final','/dlc-experience-v13.js?v=v13.2-final','/lobby-ui-fix-v13.js?v=v13.2-lobby-fix']);
must('scripts/build-web.mjs',['dlc-invites-v12-45.js','dlc-invites-v12-45.css','dlc-copy-v12-46.js','dlc-copy-v12-46.css','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js']);
must('scripts/build-mobile.mjs',['dlc-invites-v12-45.js','dlc-invites-v12-45.css','dlc-copy-v12-46.js','dlc-copy-v12-46.css','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js']);
must('supabase/migrations/20261001_dlc_invites_v12_45.sql',['igr_dlc_invites','igr_dlc_create_invite','igr_dlc_redeem_invite','wrong_dlc','cannot_revoke_owner']);
must('dlc-copy-v12-46.js',['5 dossiers liés. Une Famiglia. Jusqu’au Don.','Bloqués dans la Grey Room. Un groupe terroriste s’empare de la ville. Le périmètre se referme.','Le cartel frappe l’enquête, achète la justice et remonte jusqu’à vos proches.','Le régime est tombé. Les archives restent. Identifiez ceux qui ont ordonné, couvert et profité.']);
must('dlc-copy-v12-46.css',['.terror-access-pill[hidden]']);
console.log('v13.2 runtime + v12.46 DLC regression markers OK');
