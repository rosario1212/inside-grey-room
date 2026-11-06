import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtimePath=path.join(root,'timer-runtime-v46.js');
const migrationPath=path.join(root,'supabase','migrations','20261005211500_long_interrogation_six_minutes_canonical.sql');
const hardeningPath=path.join(root,'supabase','migrations','20261005_harden_duration_start_paths.sql');
const builtRuntime=path.join(target,'timer-runtime-v46.js');
const builtIndex=path.join(target,'index.html');
const builtApp=path.join(target,'app-v11.js');
const builtSw=path.join(target,'service-worker.js');
const exists=async file=>{try{await stat(file);return true}catch{return false}};
const requireMatch=(text,re,message)=>{if(!re.test(text))throw new Error(message)};
const forbidMatch=(text,re,message)=>{if(re.test(text))throw new Error(message)};

const runtime=await readFile(runtimePath,'utf8');
const migration=await readFile(migrationPath,'utf8');
const hardening=await readFile(hardeningPath,'utf8');
requireMatch(runtime,/long\.interrogation=360/,'v46.2 must set LONG interrogation to 360 seconds');
requireMatch(runtime,/long\.finalDebrief=240/,'v46.2 must set LONG final debrief to 240 seconds');
requireMatch(runtime,/DERNIER DÉBRIEF · 04:00/,'v46.2 must render the French final-debrief label as 04:00');
requireMatch(runtime,/Convoquer · 6 min/,'v46.2 must render LONG interrogation as 6 min');
forbidMatch(runtime,/long\.interrogation=480/,'v46.2 must not regress LONG interrogation to 480 seconds');
forbidMatch(runtime,/Convoquer · 8 min/,'v46.2 must not rewrite LONG interrogation to 8 min');
requireMatch(migration,/when 'long' then case p_kind[\s\S]*?when 'interrogation' then 360\b/,'DB migration must set LONG interrogation to 360 seconds');
requireMatch(migration,/when 'long' then case p_kind[\s\S]*?when 'final_debrief' then 240\b/,'DB migration must keep LONG final debrief at 240 seconds');
requireMatch(hardening,/create or replace function public\.igr_v13_start_event[\s\S]*?make_interval\(secs=>secs\)/,'Event interrogation path must use the duration-derived seconds');
requireMatch(hardening,/create or replace function public\.igr_v4_start_interrogation[\s\S]*?igr_v35_room_seconds\(r\.code,'interrogation'\)[\s\S]*?make_interval\(secs=>secs\)/,'Cycle-1 interrogation path must use the duration helper');
forbidMatch(hardening,/phase_ends_at=now\(\)\+interval '6 minutes'/,'Server interrogation paths must use the duration helper rather than hardcode six minutes');
if(await exists(builtRuntime)){
  const built=await readFile(builtRuntime,'utf8');
  requireMatch(built,/long\.interrogation=360/,'Built v46.2 runtime must keep LONG interrogation at 360 seconds');
  requireMatch(built,/long\.finalDebrief=240/,'Built v46.2 runtime must keep LONG final debrief at 240 seconds');
  forbidMatch(built,/long\.interrogation=480/,'Built v46.2 runtime regressed LONG interrogation to 480 seconds');
}
if(await exists(builtIndex)){
  const html=await readFile(builtIndex,'utf8');
  requireMatch(html,/timer-runtime-v46\.js\?v=v46-2-six-minute-long/,'Built index must load the cache-busted v46.2 timer runtime');
  const timerPos=html.lastIndexOf('timer-runtime-v46.js?v=v46-2-six-minute-long');
  const after=html.slice(timerPos+'timer-runtime-v46.js?v=v46-2-six-minute-long'.length);
  forbidMatch(after,/<script[^>]+src=/i,'v46.2 timer runtime must remain the final external script at this stage');
}
if(await exists(builtApp)){
  const app=await readFile(builtApp,'utf8');
  requireMatch(app,/\/service-worker\.js\?v=v46-2-six-minute-long/,'Built app must register the v46.2 service worker version');
}
if(await exists(builtSw)){
  const sw=await readFile(builtSw,'utf8');
  requireMatch(sw,/const CACHE='igr-v46-2-six-minute-long';/,'Built service worker must use the v46.2 cache namespace');
  requireMatch(sw,/\/timer-runtime-v46\.js\?v=v46-2-six-minute-long/,'Built service worker must precache the v46.2 timer runtime');
}
const finalRulesSql=await readFile(path.join(root,'supabase','migrations','20261106164500_timer_lawyer_consultations_150s_sync.sql'),'utf8');
const lawyerClient=await readFile(path.join(root,'judicial-runtime-v44.js'),'utf8');
const rulebook=await readFile(path.join(root,'self-guided-rules-v51.js'),'utf8');
const legacyUi=await readFile(path.join(root,'app-v11.js'),'utf8');
for(const [pattern,reason] of [
 [/v_kind:=case new\.phase[\s\S]*?when 'final_debrief' then 'final_debrief'/,'Final-debrief trigger must use canonical helper for judge/non-judge'],
 [/perform public\.igr_v44_maintain\(r\.code\)/,'Room synchronization must maintain lawyer consultation deadlines'],
 [/status in \('pending','active'\) and ends_at<=now\(\)/,'Unanswered lawyer requests must expire'],
 [/ends_at=now\(\)\+interval '150 seconds'/,'Lawyer consultation must last 150 seconds'],
 [/consultation_scope/,'RPC must declare official-client/non-client usage scope'],
 [/oldc\.cycle=r\.cycle/,'Official client once-per-cycle guard missing'],
 [/NOT official OR oldc\.cycle=r\.cycle/,'Non-client once-per-game guard missing'],
 [/interrogation timer unavailable/,'Do not pause an already expired or paused interrogation'],
 [/Enquêteur \+ Analyste : '\|\|public\.igr_v35_seconds_label/,'Initial-debrief events must follow server seconds'],
 [/cycle_debrief'\)\)\|\|/,'Cycle debrief messages must derive server duration'],
 [/final_debrief'\)\)\|\|/,'Final debrief messages must derive server duration'],
 ])requireMatch(finalRulesSql,pattern,reason);
forbidMatch(finalRulesSql,/when v_mode='short' then 180 else 240/,'Judge special-case 3m SHORT debrief must be removed');
const lawyerPrivateSql=await readFile(path.join(root,'supabase','migrations','20261106174500_lawyer_private_minute_and_hearing_presence.sql'),'utf8');
for(const [pattern,message] of [
 [/interval '60 seconds'/,'Confidential Lawyer minute must last 60s only'],
 [/camera blocked during confidential lawyer minute/,'Server must block camera during private minute'],
 [/video_active.*false/,'Private request must stop active video'],
 [/lawyer_attendance/,'Official and ad-hoc attendance must persist to interrogation end'],
 [/event_participants/,'Confrontation must include the official Lawyer as a participant'],
 [/rep\.client_id=any\(p_targets\)/,'Confrontation Lawyer must belong to a selected client'],
 [/secs:=public\.igr_v35_room_seconds\(r\.code,'confrontation'\)/,'Confrontation starts with mode-accurate duration'],
 [/igr_v35_room_seconds\(r\.code,'confrontation'\)/,'Confrontation options must show accurate time'],
 [/DELETE FROM public\.igr_v4_signals/,'Private consultation must invalidate live-media signaling']
])requireMatch(lawyerPrivateSql,pattern,message);
forbidMatch(lawyerPrivateSql,/ends_at=now\(\)\+interval '150 seconds'/,'Private break must not last 150s');
requireMatch(lawyerClient,/APARTÉ PRIVÉ · 01:00/,'Lawyer request UI must display 1:00');
requireMatch(lawyerClient,/cache\?\.lawyer_attendance/,'UI must show counsel attendance after private minute');
requireMatch(lawyerClient,/CONFRONTATION · AVOCAT OFFICIEL/,'UI must admit Lawyer to official-client confrontation');
requireMatch(lawyerClient,/consultation_scope==='per_cycle'/,'Lawyer client UI must distinguish scope');
requireMatch(rulebook,/une seule fois par partie/,'Rulebook must specify non-client one-per-game cap');
requireMatch(rulebook,/minute privée/,'Rulebook must specify private-minute length');
requireMatch(rulebook,/jusqu’à la fin de l’interrogatoire/,'Rulebook must specify Lawyer stays until end');
requireMatch(legacyUi,/Dernier débrief : \$\{STATE\.sync\?\.room/,'Legacy final debrief copy must derive room duration');

console.log('v46.2 timer audit passed: LONG interrogation=360s, final debrief=240s, server start paths and cache propagation verified.');
