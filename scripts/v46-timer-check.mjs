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
console.log('v46.2 timer audit passed: LONG interrogation=360s, final debrief=240s, server start paths and cache propagation verified.');
