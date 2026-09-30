import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const read=f=>fs.readFileSync(f,'utf8');
const must=(file,items)=>{const t=read(file);for(const x of items)if(!t.includes(x))throw new Error(`${file} missing marker: ${x}`)};
const mustNot=(file,items)=>{const t=read(file);for(const x of items)if(t.includes(x))throw new Error(`${file} contains forbidden marker: ${x}`)};

must('index.html',[
 'wss://jtasbdiguhiswoyvobkn.supabase.co',
 'onerror="this.onerror=null;this.src=',
 'live-cell-v12-42.css?v=v12.42-live-cell',
 'live-cell-v12-42.js?v=v12.42-live-cell',
 'dlc-suite-v12-37.js?v=v12.41-owner-launch'
]);
must('live-cell-v12-42.js',[
 'igr_v4_realtime_token','igr_v4_leave_room','postgres_changes','WebSocket',
 'chooseLobbyRole = async function','startGame = async function','startRoomWatcher = function',
 'syncSoon(20,true)','reliableIntroStart','v12.42-live-cell','retirer\\s+(?:mon\\s+)?choix','igrRolePending'
]);
mustNot('live-cell-v12-42.js',['setInterval(()=>syncNow']);
must('live-cell-v12-42.css',['intro-v10-14.webp?v=v12.42-startup','home-v10-14.webp','.lobby-v11 .role-choice-card']);
must('service-worker.js',['igr-v12-42-live-cell','/live-cell-v12-42.js?v=v12.42-live-cell','/live-cell-v12-42.css?v=v12.42-live-cell']);
must('scripts/build-web.mjs',['live-cell-v12-42.js','live-cell-v12-42.css']);
must('scripts/build-mobile.mjs',['live-cell-v12-42.js','live-cell-v12-42.css']);
must('supabase/migrations/20261001_live_room_realtime_v12_42.sql',[
 'igr_v4_room_realtime','supabase_realtime','igr_v4_realtime_token','igr_v4_leave_room','igr_v4_players_realtime'
]);

for(const file of ['live-cell-v12-42.js','service-worker.js','scripts/build-web.mjs','scripts/build-mobile.mjs']){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('v12.42 live cell regression markers OK');
