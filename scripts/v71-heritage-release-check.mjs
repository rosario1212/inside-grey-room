import {readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)},read=p=>readFile(path.join(root,p),'utf8');
const files=['heritage-play-v13-7.js','heritage-maitre-v34.js','heritage-maitre-online-v34-4.js','heritage-audit-v55.js','heritage-context-v71.js','play-modes-v13-8.js','scripts/build-web.mjs','scripts/build-mobile.mjs'];
for(const p of files){const r=spawnSync(process.execPath,['--check',path.join(root,p)],{encoding:'utf8'});ok(r.status===0,p+' syntax: '+(r.stderr||r.stdout))}
const [play,maitre,online,audit,context,modes,migration]=await Promise.all([
 read('heritage-play-v13-7.js'),read('heritage-maitre-v34.js'),read('heritage-maitre-online-v34-4.js'),read('heritage-audit-v55.js'),read('heritage-context-v71.js'),read('play-modes-v13-8.js'),read('supabase/migrations/20261012204631_heritage_release_v71_authority_and_angle.sql')
]);
ok(play.includes("question:'Que fait Kurokawa du registre ?'"),'KUROI III question still mismatches choices');
ok(play.includes("qualitative:true"),'KUROI V qualitative endings missing');
ok(play.includes("label=opt.qualitative?'Choix d’héritage'"),'KUROI V still renders truth score');
ok(play.includes("live.online?live.campaignCarry"),'online CENDRES/KUROI do not consume host campaign carry');
ok(play.includes("CRISE · Les annexes des rôles absents sont retenues"),'CENDRES crisis has no mechanical information-delay effect');
ok(!play.includes('K-9')&&!play.includes('VENN'),'obsolete CENDRES jargon remains');
ok(play.includes("api().kuroi.upsertClanMember")&&play.includes("api().kuroi.updateDebt"),'KUROI persistent tree/debt state still inert');
ok(maitre.includes("L’Avocat doit formuler un ANGLE"),'MAÎTRE local Angle gate missing');
ok(maitre.includes("ownerRole=live.chapter===1||live.chapter===4?'juge':live.chapter===2?'client':'avocat'"),'MAÎTRE local decision authority missing');
ok(maitre.includes("roleCard:(chapter,roleId,variantKey,carry)"),'MAÎTRE shared role-card accessor missing');
ok(online.includes("IGR_HERITAGE_CONTEXT_V71?.publish"),'MAÎTRE host carry is not published');
ok(online.includes("d.room.campaign_carry"),'MAÎTRE guests do not consume host carry');
ok(online.includes("igr_heritage_online_decide_v71")&&online.includes("igr_heritage_online_advance_v71"),'MAÎTRE v71 RPCs not wired');
ok(audit.includes('function immediateFocus'),'phase-contextual role guidance missing');
ok(context.includes("igr_heritage_online_context_v57"),'v71 public carry publisher missing server sync');
ok(!context.includes("maitre_variant")&&!context.includes(".canon"),'v71 carry publisher leaks hidden MAÎTRE truth');
ok(modes.includes("campaignCarry:d.room.campaign_carry||null"),'generic online bridge does not propagate campaign carry');
ok(migration.includes("when v_room.chapter in (1,4) then 'juge'")&&migration.includes("when v_room.chapter=2 then 'client'")&&migration.includes("when v_room.chapter in (3,5) then 'avocat'"),'server decision authority mapping missing');
ok(migration.includes("maitre angle required"),'server Angle gate missing');
try{
 await stat(path.join(target,'index.html'));
 const html=await readFile(path.join(target,'index.html'),'utf8');
 ok(html.includes('heritage-context-v71.js?v=v71-heritage-release'),'built runtime missing v71 carry script');
 ok(html.indexOf('heritage-context-v71.js')<html.indexOf('play-modes-v13-8.js'),'v71 carry runtime must load before online modes');
}catch{}
if(fail.length){console.error('\nHÉRITAGE v71 release check FAILED:\n- '+fail.join('\n- '));process.exit(1)}
console.log('HÉRITAGE v71 release checks OK');
