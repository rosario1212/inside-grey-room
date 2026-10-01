import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const must=(f,parts)=>{const s=read(f);for(const p of parts)if(!s.includes(p))throw new Error(`${f}: missing ${p}`)};
const mustNot=(f,parts)=>{const s=read(f);for(const p of parts)if(s.includes(p))throw new Error(`${f}: unexpected ${p}`)};

must('index.html',['dlc-invites-v12-45.css?v=v12.45-dlc-invites','dlc-invites-v12-45.js?v=v12.45-dlc-invites','omerta-v12-39.js?v=v12.45-choice-copy']);
must('dlc-invites-v12-45.js',['igr_dlc_create_invite','igr_dlc_redeem_invite','igr_dlc_list_access','Gérer les accès','Code d’accès']);
must('dlc-invites-v12-45.css',['.igr-dlc-access-modal','.igr-dlc-new-code','.igr-dlc-access-action']);
must('omerta-v12-39.js',['igr-choice-status-note','Aucun rôle choisi']);
mustNot('omerta-v12-39.js',['igr-choice-status-empty']);
must('service-worker.js',["igr-v12-45-dlc-invites",'/dlc-invites-v12-45.js?v=v12.45-dlc-invites','/dlc-invites-v12-45.css?v=v12.45-dlc-invites','/omerta-v12-39.js?v=v12.45-choice-copy']);
must('scripts/build-web.mjs',['dlc-invites-v12-45.js','dlc-invites-v12-45.css']);
must('scripts/build-mobile.mjs',['dlc-invites-v12-45.js','dlc-invites-v12-45.css']);
must('supabase/migrations/20261001_dlc_invites_v12_45.sql',['igr_dlc_invites','igr_dlc_create_invite','igr_dlc_redeem_invite','wrong_dlc','cannot_revoke_owner']);
console.log('v12.45 choice-copy + DLC invite-code regression markers OK');
