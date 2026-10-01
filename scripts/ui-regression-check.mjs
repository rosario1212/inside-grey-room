import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const read=f=>fs.readFileSync(f,'utf8');
const must=(file,items)=>{const t=read(file);for(const x of items)if(!t.includes(x))throw new Error(`${file} missing marker: ${x}`)};
const mustNot=(file,items)=>{const t=read(file);for(const x of items)if(t.includes(x))throw new Error(`${file} contains forbidden marker: ${x}`)};

must('index.html',[
 'live-cell-v12-44.css?v=v12.44-live-cell',
 'dlc-profile-ui-v12-44.css?v=v12.44-ui',
 'dlc-suite-v12-37.js?v=v12.44-per-player-dlc',
 'live-cell-v12-44.js?v=v12.44-live-cell',
 'dlc-profile-ui-v12-44.js?v=v12.44-ui'
]);
must('dlc-suite-v12-37.js',[
 'igr_dlc_access_status','igr_dlc_create_room','igr_dlc_join_room',
 'DLC DÉTENU','DLC NON DÉTENU','PREMIUM_IDS','ensureIdentity','Ce profil ne détient pas'
]);
mustNot('dlc-suite-v12-37.js',['Ce DLC est réservé au propriétaire.','igr_owner_dlc_create_room','OWNER_ONLY_IDS']);
must('dlc-profile-ui-v12-44.js',[
 'igr_dlc_access_status','igr_dlc_profile_access','igr_dlc_room_player_access',
 'igr-filter-fab','lobby-profile-btn','DLC du joueur'
]);
must('dlc-profile-ui-v12-44.css',[
 '.igr-notify-bell','.igr-filter-fab','.igr-filter-popover','.igr-profile-dlc-box','bottom:calc(env(safe-area-inset-bottom) + 14px)'
]);
must('live-cell-v12-44.js',[
 'v12.44-live-cell','const minGap = 100','syncSoon(0,true)','igrCellAction','chooseLobbyRole = async function'
]);
mustNot('live-cell-v12-44.js',['const minGap = 275']);
must('service-worker.js',[
 'igr-v12-44-dlc-ownership-ui','/live-cell-v12-44.js?v=v12.44-live-cell','/dlc-profile-ui-v12-44.js?v=v12.44-ui'
]);
must('supabase/migrations/20261001_dlc_entitlements_v12_44.sql',[
 'igr_dlc_entitlements','igr_dlc_access_status','igr_dlc_create_room','igr_dlc_join_room','premium access required'
]);
must('scripts/build-web.mjs',['live-cell-v12-44.js','dlc-profile-ui-v12-44.js']);
must('scripts/build-mobile.mjs',['live-cell-v12-44.js','dlc-profile-ui-v12-44.js']);

for(const file of ['dlc-suite-v12-37.js','dlc-profile-ui-v12-44.js','live-cell-v12-44.js','service-worker.js','scripts/build-web.mjs','scripts/build-mobile.mjs']){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('v12.44 DLC ownership / UI / live-cell regression markers OK');
