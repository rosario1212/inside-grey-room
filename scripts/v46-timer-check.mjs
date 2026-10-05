import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtimePath=path.join(root,'timer-runtime-v46.js');
const migrationPath=path.join(root,'supabase','migrations','20261005_restore_long_interrogation_eight_minutes.sql');
const builtRuntime=path.join(target,'timer-runtime-v46.js');
const builtIndex=path.join(target,'index.html');
const exists=async file=>{try{await stat(file);return true}catch{return false}};
const requireMatch=(text,re,message)=>{if(!re.test(text))throw new Error(message)};
const forbidMatch=(text,re,message)=>{if(re.test(text))throw new Error(message)};

const runtime=await readFile(runtimePath,'utf8');
const migration=await readFile(migrationPath,'utf8');
requireMatch(runtime,/long\.interrogation=480/,'v46.1 must set LONG interrogation to 480 seconds');
requireMatch(runtime,/long\.finalDebrief=240/,'v46.1 must set LONG final debrief to 240 seconds');
requireMatch(runtime,/DERNIER DÉBRIEF · 04:00/,'v46.1 must render the French final-debrief label as 04:00');
requireMatch(runtime,/Convoquer · 8 min/,'v46.1 must render LONG interrogation as 8 min');
forbidMatch(runtime,/long\.interrogation=360/,'v46.1 must not regress LONG interrogation to 360 seconds');
forbidMatch(runtime,/Convoquer · 6 min/,'v46.1 must not rewrite LONG interrogation to 6 min');
requireMatch(migration,/when 'long' then case p_kind[\s\S]*?when 'interrogation' then 480\b/,'DB migration must set LONG interrogation to 480 seconds');
requireMatch(migration,/when 'long' then case p_kind[\s\S]*?when 'final_debrief' then 240\b/,'DB migration must keep LONG final debrief at 240 seconds');
if(await exists(builtRuntime)){
  const built=await readFile(builtRuntime,'utf8');
  requireMatch(built,/long\.interrogation=480/,'Built v46.1 runtime must keep LONG interrogation at 480 seconds');
  requireMatch(built,/long\.finalDebrief=240/,'Built v46.1 runtime must keep LONG final debrief at 240 seconds');
  forbidMatch(built,/long\.interrogation=360/,'Built v46.1 runtime regressed LONG interrogation to 360 seconds');
}
if(await exists(builtIndex)){
  const html=await readFile(builtIndex,'utf8');
  requireMatch(html,/timer-runtime-v46\.js\?v=v46-1-long-timers/,'Built index must load the cache-busted v46.1 timer runtime');
}
console.log('v46.1 timer check passed: LONG interrogation=480s, final debrief=240s.');
